import Gym from "../models/Gym.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

/**
 * Uploads all files from req.files (Multer memoryStorage buffers) to
 * Cloudinary concurrently, and returns them in the { url, publicId }
 * shape the Gym model expects.
 */
const uploadFilesToCloudinary = async (files = []) => {
  const uploads = files.map((file) => uploadToCloudinary(file.buffer));
  const results = await Promise.all(uploads);
  return results.map(({ url, publicId }) => ({ url, publicId }));
};

/**
 * POST /api/gyms
 * Authenticated owners only. Creates a new gym, always owned by the
 * requesting user and always starting in "pending" status.
 */
export const createGym = async (req, res) => {
  try {
    const { name, description, addressLine, city, state, pincode, country, longitude, latitude, facilities } =
      req.body;

    if (!name || !description || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({ message: "Missing required gym details" });
    }

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: "Gym location (longitude, latitude) is required" });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadFilesToCloudinary(req.files);
    }

    // Facilities may arrive as a JSON string (from multipart form-data) or an array.
    let parsedFacilities = [];
    if (facilities) {
      parsedFacilities = Array.isArray(facilities) ? facilities : JSON.parse(facilities);
    }

    const gym = await Gym.create({
      name,
      description,
      owner: req.user.id, // never trust a client-supplied owner id
      address: {
        addressLine,
        city,
        state,
        pincode,
        country: country || "India",
      },
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
      facilities: parsedFacilities,
      images,
      // status is intentionally NOT read from req.body — always starts pending
    });

    return res.status(201).json({ gym });
  } catch (error) {
    console.error("Create gym error:", error);
    return res.status(500).json({ message: "Something went wrong while creating the gym" });
  }
};

/**
 * GET /api/gyms
 * Public. Returns only approved gyms, with owner info limited to
 * safe, minimal fields.
 */
export const getGyms = async (req, res) => {
  try {
    const gyms = await Gym.find({ status: "approved" })
      .populate("owner", "name") // only expose the owner's name, nothing else
      .sort({ createdAt: -1 });

    return res.status(200).json({ gyms });
  } catch (error) {
    console.error("Get gyms error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching gyms" });
  }
};

/**
 * GET /api/gyms/:id
 * Public. Only an approved gym is accessible via this endpoint.
 */
export const getGymById = async (req, res) => {
  try {
    const gym = await Gym.findOne({ _id: req.params.id, status: "approved" }).populate(
      "owner",
      "name"
    );

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    return res.status(200).json({ gym });
  } catch (error) {
    console.error("Get gym by id error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching the gym" });
  }
};

/**
 * GET /api/gyms/owner/mine
 * Authenticated owner only. Returns gyms belonging to the requesting
 * owner — never another owner's gyms.
 */
export const getOwnerGyms = async (req, res) => {
  try {
    const gyms = await Gym.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ gyms });
  } catch (error) {
    console.error("Get owner gyms error:", error);
    return res.status(500).json({ message: "Something went wrong while fetching your gyms" });
  }
};

/**
 * PUT /api/gyms/:id
 * Owner can update only their own gym. Status/approval fields cannot
 * be changed through this endpoint.
 */
export const updateGym = async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    const isOwner = gym.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You do not have permission to update this gym" });
    }

    const {
      name,
      description,
      addressLine,
      city,
      state,
      pincode,
      country,
      longitude,
      latitude,
      facilities,
    } = req.body;

    // Only apply fields that were actually provided.
    if (name !== undefined) gym.name = name;
    if (description !== undefined) gym.description = description;
    if (addressLine !== undefined) gym.address.addressLine = addressLine;
    if (city !== undefined) gym.address.city = city;
    if (state !== undefined) gym.address.state = state;
    if (pincode !== undefined) gym.address.pincode = pincode;
    if (country !== undefined) gym.address.country = country;

    if (longitude !== undefined && latitude !== undefined) {
      gym.location = {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    if (facilities !== undefined) {
      gym.facilities = Array.isArray(facilities) ? facilities : JSON.parse(facilities);
    }

    // New images (if any) are uploaded and appended to the existing set.
    if (req.files && req.files.length > 0) {
      const newImages = await uploadFilesToCloudinary(req.files);
      gym.images.push(...newImages);
    }

    // status is intentionally never accepted here — approval is admin-only,
    // implemented separately in a later step.

    await gym.save();

    return res.status(200).json({ gym });
  } catch (error) {
    console.error("Update gym error:", error);
    return res.status(500).json({ message: "Something went wrong while updating the gym" });
  }
};

/**
 * DELETE /api/gyms/:id
 * Owner can delete only their own gym. Cloudinary images are cleaned
 * up first; failures there do not block the MongoDB deletion.
 */
export const deleteGym = async (req, res) => {
  try {
    const gym = await Gym.findById(req.params.id);

    if (!gym) {
      return res.status(404).json({ message: "Gym not found" });
    }

    const isOwner = gym.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You do not have permission to delete this gym" });
    }

    // Clean up Cloudinary images. A failure here is logged but does not
    // prevent the gym document itself from being deleted.
    for (const image of gym.images) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (cloudinaryError) {
        console.error(`Failed to delete Cloudinary image ${image.publicId}:`, cloudinaryError);
      }
    }

    await gym.deleteOne();

    return res.status(200).json({ message: "Gym deleted successfully" });
  } catch (error) {
    console.error("Delete gym error:", error);
    return res.status(500).json({ message: "Something went wrong while deleting the gym" });
  }
};