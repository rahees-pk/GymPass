import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    checkedInAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkedOutAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for the most common check-in queries:
// - user: a user's check-in history
// - gym: a gym's check-in activity (useful for a later owner-facing view)
// - user + status: finding whether a user currently has an active
//   check-in (the duplicate-prevention check), served by one index
//   instead of two separately combined at query time.
checkInSchema.index({ user: 1 });
checkInSchema.index({ gym: 1 });
checkInSchema.index({ user: 1, status: 1 });

const CheckIn = mongoose.model("CheckIn", checkInSchema);

export default CheckIn;