import "dotenv/config";
console.log("MONGODB_URI:", process.env.MONGODB_URI);
import { connectToDatabase } from "./src/lib/utils/dbConnection.js";

console.log("📢 Running debugDB.js...");

connectToDatabase()
  .then(() => console.log("✅ Database connection successful"))
  .catch((error) => console.error("❌ Database connection failed:", error));