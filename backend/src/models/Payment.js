import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      required: false,
      default: null,
    },
    razorpaySignature: {
      type: String,
      required: false,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for the most common payment queries:
// - user: a user's payment history
// - membership: finding the payment(s) tied to a given membership
// - status: filtering created/paid/failed (e.g. admin reconciliation)
// razorpayOrderId already gets a unique index automatically from
// `unique: true` above, so it is not repeated here.
paymentSchema.index({ user: 1 });
paymentSchema.index({ membership: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;