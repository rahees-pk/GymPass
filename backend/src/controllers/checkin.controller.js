import CheckIn from "../models/CheckIn.js";
import Gym from "../models/Gym.js";
import Membership from "../models/Membership.js";
import createNotification from "../utils/createNotification.js";

/**
 * Finds a genuinely valid active membership for the given user
 * (status "active" AND endDate >= now), lazily correcting any stale
 * "active" record whose endDate has already passed. Returns the
 * membership document if valid, otherwise null. Mirrors the same
 * check used during payment verification, reimplemented here rather
 * than imported since payment.controller.js doesn't currently export
 * it and modifying that file is out of scope for this phase.
 */
const findValidActiveMembership = async (userId) => {
  const activeMemberships = await Membership.find({ user: userId, status: "active" });
  const now = new Date();

  for (const membership of activeMemberships) {
    if (membership.endDate >= now) {
      return membership;
    }
    membership.status = "expired";
    await membership.save();
  }

  return null;
};

/**
 * POST /api/checkins
 * Authenticated. Checks the user into an approved gym, provided they
 * have a valid active membership and no other active check-in. This
 * is a gym-ID-based flow for Phase 6 — QR scanning is a later phase.
 */
export const createCheckIn = async (req, res) => {
  try {
    const { gymId } = req.body;

    if (!gymId) {
      return res.status(400).json({ message: "gymId is required" });
    }

    const gym = await Gym.findOne({ _id: gymId, status: "approved" });

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    const activeMembership = await findValidActiveMembership(req.user.id);

    if (!activeMembership) {
      return res.status(403).json({ message: "You need an active membership to check in." });
    }

    const existingActiveCheckIn = await CheckIn.findOne({ user: req.user.id, status: "active" });

    if (existingActiveCheckIn) {
      return res.status(400).json({
        message: "You already have an active check-in. Please check out before checking in elsewhere.",
      });
    }

    const checkIn = await CheckIn.create({
  user: req.user.id,
  gym: gym._id,
  membership: activeMembership._id,
  checkedInAt: new Date(),
  status: "active",
});

await createNotification({
  user: req.user.id,
  type: "checkin",
  title: "Check-in Successful",
  message: `You checked in at ${gym.name}.`,
  relatedId: checkIn._id,
  relatedType: "CheckIn",
});

return res.status(201).json({
      message: "Checked in successfully",
      checkIn,
    });
  } catch (error) {
    console.error("Create check-in error:", error);
    return res.status(500).json({ message: "Something went wrong while checking in" });
  }
};

/**
 * PATCH /api/checkins/:id/checkout
 * Authenticated. Ends the user's own active check-in.
 */
export const checkOut = async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id).populate("gym", "name");

    if (!checkIn) {
      return res.status(404).json({ message: "Check-in not found" });
    }

    if (checkIn.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You do not have permission to modify this check-in" });
    }

    if (checkIn.status !== "active") {
      return res.status(400).json({ message: "This check-in is not currently active" });
    }

    checkIn.checkedOutAt = new Date();
    checkIn.status = "completed";
    await checkIn.save();


    await createNotification({
      user: req.user.id,
      type: "checkout",
      title: "Check-out Successful",
      message: checkIn.gym?.name
        ? `You checked out from ${checkIn.gym.name}.`
        : "You have checked out successfully.",
      relatedId: checkIn._id,
      relatedType: "CheckIn",
    });
    
    return res.status(200).json({
      message: "Checked out successfully",
      checkIn,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return res.status(500).json({ message: "Something went wrong while checking out" });
  }
};

/**
 * GET /api/checkins/active
 * Authenticated. Returns the user's current active check-in, if any.
 */
export const getActiveCheckIn = async (req, res) => {
  try {
    const checkIn = await CheckIn.findOne({ user: req.user.id, status: "active" }).populate(
      "gym",
      "name address images"
    );

    return res.status(200).json({ checkIn: checkIn || null });
  } catch (error) {
    console.error("Get active check-in error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching your active check-in" });
  }
};

/**
 * GET /api/checkins/history
 * Authenticated. Returns the user's check-in history, newest first.
 */
export const getCheckInHistory = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ user: req.user.id })
      .sort({ checkedInAt: -1 })
      .populate("gym", "name address images");

    return res.status(200).json({ checkIns });
  } catch (error) {
    console.error("Get check-in history error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching your check-in history" });
  }
};