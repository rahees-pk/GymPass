import mongoose from "mongoose";

/**
 * Connects to MongoDB using the URI from environment variables.
 * We call this once, when the server starts (see server.js).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // If the database can't connect, the app can't function — stop the process.
    process.exit(1);
  }
};

export default connectDB;
