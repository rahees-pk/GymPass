import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["monthly", "quarterly", "annual"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for the most common membership queries:
// - user: fetching "my memberships" (GET /api/memberships/me)
// - status: filtering active/expired/cancelled (admin listing, expiry checks)
// - endDate: finding memberships nearing/past expiry
// - user + status compound: the very common "does this user have an
//   active membership right now?" lookup, served by a single index
//   instead of two separate ones being combined at query time.
membershipSchema.index({ user: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ endDate: 1 });
membershipSchema.index({ user: 1, status: 1 });

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;