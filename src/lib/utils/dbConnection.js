import mongoose from "mongoose";
import initializeDatabase from "../../middlewares/initializeDatabase.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

// 🛑 Use a global variable to track connection & initialization state
global._mongo = global._mongo || { isConnected: false, isConnecting: false, isDBInitialized: false };


export async function connectToDatabase() {
  if (global._mongo.isConnected) {
    console.log("✅ Already connected to MongoDB");
    return;
  }

  if (global._mongo.isConnecting) {
    console.log("⏳ Connection already in progress...");
    return;
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    global._mongo.isConnecting = true; // Prevent duplicate connection attempts
    const db = await mongoose.connect(MONGODB_URI);
    global._mongo.isConnected = db.connections[0].readyState === 1;
    global._mongo.isConnecting = false;
    console.log("✅ MongoDB Connected Successfully");

    if (!global._mongo.isDBInitialized) {
      console.log("🚀 Running initializeDatabase...");
      await initializeDatabase();
      global._mongo.isDBInitialized = true;
    }
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
}


// 🛑 Ensure the database is connected before handling any requests
// ✅ Run this function **immediately** on the backend (server-side)
// ✅ connectToDatabase() is executed on the backend immediately when Next.js starts
// ✅ No user request is required to initialize the database
// ✅ Ensures actions, roles, and admin are created before handling any requests
// ✅ Ensure it runs only once when the server starts
// connectToDatabase();