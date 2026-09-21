import Gym from "../models/Gym.js";

const ALLOWED_STATUSES = ["pending", "approved", "rejected", "suspended"];
const UPDATABLE_STATUSES = ["approved", "rejected"];

/**
 * GET /api/admin/gyms
 * GET /api/admin/gyms?status=pending
 * Admin only. Lists every gym on the platform, regardless of owner,
 * optionally filtered by status via the query string. The owning
 * user's name and email are populated so an admin reviewing the list
 * knows who submitted each gym.
 */
export const getAllGyms = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        });
      }
      filter = { status };
    }

    const gyms = await Gym.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ gyms });
  } catch (error) {
    console.error("Get all gyms (admin) error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching gyms" });
  }
};

/**
 * PATCH /api/admin/gyms/:id/status
 * Admin only. Approves or rejects a pending (or previously
 * reviewed) gym. This is the ONLY place gym approval status changes —
 * owners cannot set this via the regular gym update endpoint.
 */
export const updateGymStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!UPDATABLE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be either approved or rejected" });
    }

    const gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    gym.status = status;
    await gym.save();

    const message = status === "approved" ? "Gym approved successfully" : "Gym rejected successfully";

    return res.status(200).json({ message, gym });
  } catch (error) {
    console.error("Update gym status error:", error);
    return res.status(500).json({ message: "Something went wrong while updating gym status" });
  }
};