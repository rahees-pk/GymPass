import Membership from "../models/Membership.js";

const ALLOWED_PLANS = ["monthly", "quarterly", "annual"];

/**
 * If a membership's status is still "active" but its endDate has
 * already passed, lazily corrects it to "expired" and saves that
 * change — this is what lets the system track expiry without a
 * scheduled/cron job. Any other status is returned unchanged.
 */
const resolveExpiry = async (membership) => {
  if (!membership) return membership;

  if (membership.status === "active" && membership.endDate < new Date()) {
    membership.status = "expired";
    await membership.save();
  }

  return membership;
};

/**
 * POST /api/memberships
 * Development/testing only for this phase — real membership creation
 * will be gated behind successful Razorpay payment in a later phase.
 * Never trusts a user id from the request body; always uses the
 * authenticated user's id.
 */
export const createMembership = async (req, res) => {
  try {
    const { plan, amount, startDate, endDate, autoRenew } = req.body;

    if (!plan || amount === undefined || !startDate || !endDate) {
      return res.status(400).json({
        message: "plan, amount, startDate, and endDate are required",
      });
    }

    if (!ALLOWED_PLANS.includes(plan)) {
      return res.status(400).json({
        message: "Plan must be one of: monthly, quarterly, annual",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: "startDate and endDate must be valid dates" });
    }

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({ message: "endDate must be after startDate" });
    }

    const membership = await Membership.create({
      user: req.user.id, // never trust a client-supplied user id
      plan,
      amount,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      autoRenew: Boolean(autoRenew),
      // status is intentionally not accepted from the client — the
      // schema default ("active") applies here.
    });

    return res.status(201).json({ membership });
  } catch (error) {
    console.error("Create membership error:", error);
    return res.status(500).json({ message: "Something went wrong while creating the membership" });
  }
};

/**
 * GET /api/memberships/me
 * Returns the authenticated user's most recent membership, with
 * expiry resolved lazily (no cron). Responds clearly when the user
 * has none at all.
 */
export const getMyMembership = async (req, res) => {
  try {
    let membership = await Membership.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    if (!membership) {
      return res.status(200).json({ message: "No membership found", membership: null });
    }

    membership = await resolveExpiry(membership);

    return res.status(200).json({ membership });
  } catch (error) {
    console.error("Get my membership error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching your membership" });
  }
};

/**
 * GET /api/memberships/:id
 * A user may only view their own membership.
 */
export const getMembershipById = async (req, res) => {
  try {
    let membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to view this membership" });
    }

    membership = await resolveExpiry(membership);

    return res.status(200).json({ membership });
  } catch (error) {
    console.error("Get membership by id error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching the membership" });
  }
};

/**
 * PATCH /api/memberships/:id/cancel
 * A user may only cancel their own membership, and only while it is
 * still active. No refund or payment-cancellation logic here.
 */
export const cancelMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to cancel this membership" });
    }

    if (membership.status !== "active") {
      return res.status(400).json({ message: "Only an active membership can be cancelled" });
    }

    membership.status = "cancelled";
    await membership.save();

    return res.status(200).json({ message: "Membership cancelled successfully", membership });
  } catch (error) {
    console.error("Cancel membership error:", error);
    return res.status(500).json({ message: "Something went wrong while cancelling the membership" });
  }
};

/**
 * GET /api/memberships/check-active
 * Reusable check: does the authenticated user currently have a valid
 * membership? Valid = status "active" AND endDate >= now. Never
 * checks or stores a gym id — a valid membership grants access to
 * every approved gym, not one specific gym.
 */
export const checkActiveMembership = async (req, res) => {
  try {
    let membership = await Membership.findOne({ user: req.user.id }).sort({ createdAt: -1 });

    membership = await resolveExpiry(membership);

    const hasMembership = Boolean(
      membership && membership.status === "active" && membership.endDate >= new Date()
    );

    return res.status(200).json({
      success: true,
      hasMembership,
      membership: hasMembership ? membership : null,
    });
  } catch (error) {
    console.error("Check active membership error:", error);
    return res.status(500).json({ message: "Something went wrong while checking membership status" });
  }
};