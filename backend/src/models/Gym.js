import mongoose from "mongoose";

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Gym name is required"],
      trim: true,
      minlength: [2, "Gym name must be at least 2 characters"],
      maxlength: [100, "Gym name must be under 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Gym description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description must be under 2000 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Gym must belong to an owner"],
    },
    address: {
      addressLine: {
        type: String,
        required: [true, "Address line is required"],
        trim: true,
        maxlength: [200, "Address line must be under 200 characters"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        maxlength: [100, "City must be under 100 characters"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
        maxlength: [100, "State must be under 100 characters"],
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
        match: [/^\d{6}$/, "Pincode must be a valid 6-digit Indian pincode"],
      },
      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order, NOT [lat, lng]
        required: [true, "Gym location coordinates are required"],
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lng, lat] = coords;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Coordinates must be [longitude, latitude] within valid ranges",
        },
      },
    },
    facilities: {
      type: [String],
      default: [],
    },
    images: {
      type: [
        {
          url: {
            type: String,
            required: [true, "Image url is required"],
          },
          publicId: {
            type: String,
            required: [true, "Image publicId is required"],
          },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "suspended"],
        message: "Status must be one of: pending, approved, rejected, suspended",
      },
      default: "pending",
      required: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, "Average rating cannot be negative"],
        max: [5, "Average rating cannot exceed 5"],
      },
      count: {
        type: Number,
        default: 0,
        min: [0, "Rating count cannot be negative"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index enables MongoDB geospatial queries (e.g. $near) on
// location, which is required for future "gyms near me" functionality.
gymSchema.index({ location: "2dsphere" });

const Gym = mongoose.model("Gym", gymSchema);

export default Gym;