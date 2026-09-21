import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be under 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // never returned by default on queries
    },
    role: {
      type: String,
      enum: {
        values: ["user", "owner", "admin"],
        message: "Role must be one of: user, owner, admin",
      },
      default: "user",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "suspended"],
        message: "Status must be one of: active, suspended",
      },
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Extra safety net: even if a query forgets to exclude sensitive fields,
// they will never appear in JSON responses (e.g. res.json(user)).
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;