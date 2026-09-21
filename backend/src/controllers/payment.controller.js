import crypto from "crypto";
import mongoose from "mongoose";
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

const PLAN_CONFIG = {
  monthly: { price: 999, amount: 99900, duration: 30 },
  quarterly: { price: 2499, amount: 249900, duration: 90 },
  annual: { price: 7999, amount: 799900, duration: 365 },
};

const ALLOWED_PLANS = Object.keys(PLAN_CONFIG);

// Max attempts for the transaction retry loop below. MongoDB's own
// documentation recommends retrying on TransientTransactionError
// rather than treating a single write conflict as a hard failure.
const MAX_TRANSACTION_ATTEMPTS = 5;

/**
 * Checks whether the given user already has a genuinely valid active
 * membership (status "active" AND endDate >= now), lazily correcting
 * any stale "active" record whose endDate has already passed.
 *
 * Accepts an optional Mongoose session so the same logic can run
 * either as a standalone check (create-order, no session) or as part
 * of an atomic transaction (verify, with session).
 */
const userHasActiveMembership = async (userId, session = null) => {
  const activeMemberships = await Membership.find({ user: userId, status: "active" }).session(
    session
  );
  const now = new Date();

  for (const membership of activeMemberships) {
    if (membership.endDate >= now) {
      return true;
    }
    membership.status = "expired";
    await membership.save({ session });
  }

  return false;
};

/**
 * POST /api/payments/create-order
 * Authenticated. Creates a Razorpay order for the selected plan and a
 * corresponding pending Payment document (membership: null,
 * status: "created"). Never accepts price/amount/duration/userId from
 * the client — all of that comes from server-side configuration and
 * the authenticated session.
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ message: "Plan is required" });
    }

    if (!ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({
        message: "Plan must be one of: monthly, quarterly, annual",
      });
    }

    if (await userHasActiveMembership(req.user.id)) {
      return res.status(400).json({ message: "You already have an active membership." });
    }

    const { amount } = PLAN_CONFIG[plan];
    const receipt = `gympass_${req.user.id}_${Date.now()}`;

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt,
        notes: {
          userId: req.user.id,
          plan,
        },
      });
    } catch (razorpayError) {
      console.error("Razorpay order creation error:", razorpayError);
      return res.status(502).json({ message: "Failed to create payment order. Please try again." });
    }

    let payment;
    try {
      payment = await Payment.create({
        user: req.user.id,
        membership: null,
        razorpayOrderId: razorpayOrder.id,
        amount,
        status: "created",
      });
    } catch (dbError) {
      console.error("Payment document creation error:", dbError);
      return res.status(500).json({ message: "Failed to record the payment. Please try again." });
    }

    return res.status(201).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      payment: {
        id: payment._id,
      },
      plan,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return res.status(500).json({ message: "Something went wrong while creating the order" });
  }
};

/**
 * Runs the membership-activation critical section inside a Mongoose
 * transaction, with retry-on-conflict. Concurrency safety comes from
 * an advisory lock: a write to the requesting user's own User
 * document, performed first inside the transaction. Two concurrent
 * transactions for the SAME user both attempt to write that SAME
 * document, so MongoDB's transaction engine forces one of them to
 * fail with a write conflict (surfaced as a TransientTransactionError)
 * — that one is retried here, and on retry it re-reads state that now
 * reflects whatever the winning transaction already committed.
 *
 * This also re-reads the Payment document inside the same lock, so a
 * duplicate verification call for the exact same Payment (not just
 * the same user) is equally race-free.
 */
const activateMembershipTransactionally = async ({ userId, paymentId, razorpayPaymentId, razorpaySignature, plan }) => {
  const session = await mongoose.startSession();

  try {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
      try {
        session.startTransaction();

        // --- Advisory lock: write to the user's own document first.
        // The value doesn't matter — only that this write participates
        // in the transaction and targets a document shared by any
        // other concurrent verification attempt for this same user.
        await User.updateOne({ _id: userId }, { $set: { updatedAt: new Date() } }, { session });

        // --- Re-read the Payment INSIDE the lock, in case a
        // concurrent request for this exact Payment already completed
        // while we were waiting/retrying.
        const payment = await Payment.findById(paymentId).session(session);

        if (!payment) {
          await session.abortTransaction();
          return { status: 404, body: { message: "Payment record not found" } };
        }

        if (payment.status === "paid") {
          await session.abortTransaction();

          if (!payment.membership) {
            console.error(
              `Inconsistent payment data: Payment ${payment._id} is "paid" but has no membership reference.`
            );
            return { status: 500, body: { message: "Payment data is inconsistent. Please contact support." } };
          }

          const existingMembership = await Membership.findById(payment.membership);

          if (!existingMembership) {
            console.error(
              `Inconsistent payment data: Payment ${payment._id} references missing Membership ${payment.membership}.`
            );
            return { status: 500, body: { message: "Payment data is inconsistent. Please contact support." } };
          }

          return {
            status: 200,
            body: {
              success: true,
              message: "Payment was already verified and the membership is active",
              membership: existingMembership,
            },
          };
        }

        if (payment.status !== "created") {
          await session.abortTransaction();
          return { status: 400, body: { message: "This payment cannot be verified" } };
        }

        // --- Active-membership check, now safely serialized by the
        // lock acquired above. ---
        const hasActiveMembership = await userHasActiveMembership(userId, session);

        if (hasActiveMembership) {
          await session.abortTransaction();
          return { status: 400, body: { message: "You already have an active membership." } };
        }

        // --- Create Membership + update Payment, atomically. ---
        const { duration } = PLAN_CONFIG[plan];
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

        const membership = new Membership({
          user: userId,
          plan,
          status: "active",
          startDate,
          endDate,
          amount: payment.amount / 100, // Payment.amount is paise; Membership.amount is rupees
          autoRenew: false,
        });
        await membership.save({ session });

        payment.membership = membership._id;
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.status = "paid";
        await payment.save({ session });

        await session.commitTransaction();

        await createNotification({
          user: userId,
          type: "payment",
          title: "Payment Successful",
          message: `Your payment of ₹${payment.amount / 100} for the ${plan} plan was successful.`,
          relatedId: payment._id,
          relatedType: "Payment",
        });

        await createNotification({
          user: userId,
          type: "membership",
          title: "Membership Activated",
          message: `Your ${plan} membership is now active, valid until ${endDate.toLocaleDateString(
            "en-IN"
          )}.`,
          relatedId: membership._id,
          relatedType: "Membership",
        });

        return {
          status: 200,
          body: {
            success: true,
            message: "Payment verified and membership activated successfully",
            membership,
          },
        };
       
      } catch (err) {
        await session.abortTransaction().catch(() => {});

        const isTransient =
          (typeof err.hasErrorLabel === "function" && err.hasErrorLabel("TransientTransactionError")) ||
          (Array.isArray(err.errorLabels) && err.errorLabels.includes("TransientTransactionError"));

        if (isTransient && attempt < MAX_TRANSACTION_ATTEMPTS) {
          continue; // retry with the same session
        }

        console.error(
          `Membership activation transaction failed for Payment ${paymentId}, user ${userId} (attempt ${attempt}):`,
          err
        );
        return {
          status: 500,
          body: { message: "Failed to activate membership. Please try again or contact support." },
        };
      }
    }

    // Exhausted retries without a transient success — a genuinely
    // persistent conflict, not expected in normal operation.
    return {
      status: 503,
      body: { message: "Could not activate membership due to a temporary conflict. Please try verifying again." },
    };
  } finally {
    session.endSession();
  }
};

/**
 * POST /api/payments/verify
 * Authenticated. Verifies a completed Razorpay payment's signature,
 * cross-checks the order amount and plan directly with Razorpay
 * (never trusting client-supplied values), and — only if every check
 * passes — atomically activates a Membership and marks the Payment as
 * paid. Concurrency-safe: see activateMembershipTransactionally above.
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // --- Step 1: validate input presence ---
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    // --- Step 2: find the Payment document ---
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found for this order" });
    }

    // --- Step 3: ownership check ---
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "This payment does not belong to your account" });
    }

    // --- Cheap fast-path idempotency check (not authoritative — the
    // real, race-free check happens inside the locked transaction
    // below; this just avoids redundant signature/Razorpay-API work
    // when the answer is already obviously "yes, already processed"). ---
    if (payment.status === "paid") {
      if (!payment.membership) {
        console.error(
          `Inconsistent payment data: Payment ${payment._id} is marked "paid" but has no membership reference.`
        );
        return res.status(500).json({ message: "Payment data is inconsistent. Please contact support." });
      }
      const existingMembership = await Membership.findById(payment.membership);
      if (!existingMembership) {
        console.error(
          `Inconsistent payment data: Payment ${payment._id} references missing Membership ${payment.membership}.`
        );
        return res.status(500).json({ message: "Payment data is inconsistent. Please contact support." });
      }
      return res.status(200).json({
        success: true,
        message: "Payment was already verified and the membership is active",
        membership: existingMembership,
      });
    }

    if (payment.status !== "created") {
      return res.status(400).json({ message: "This payment cannot be verified" });
    }

    // --- Step 5: verify the Razorpay signature ---
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    const signatureIsValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureIsValid) {
      return res.status(400).json({ message: "Payment signature verification failed" });
    }

    // --- Step 6: verify order amount directly with Razorpay ---
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    } catch (fetchError) {
      console.error("Razorpay order fetch error:", fetchError);
      return res.status(502).json({ message: "Unable to verify payment with Razorpay right now" });
    }

    if (razorpayOrder.amount !== payment.amount) {
      return res.status(400).json({ message: "Payment amount could not be verified" });
    }

    // --- Step 7: determine plan from the order's own notes (never
    // from the client), and validate it against server config ---
    const plan = razorpayOrder.notes?.plan;

    if (!plan || !ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({ message: "Unable to determine a valid plan for this payment" });
    }

    // --- Steps 8-10: concurrency-safe, atomic membership activation ---
    const result = await activateMembershipTransactionally({
      userId: req.user.id,
      paymentId: payment._id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      plan,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return res.status(500).json({ message: "Something went wrong while verifying the payment" });
  }
};