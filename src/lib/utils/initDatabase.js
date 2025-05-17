import { connectToDatabase } from "./dbConnection";
import initializeDatabase from "@/middlewares/initializeDatabase"; // Ensure this path is correct

let isDatabaseInitialized = false;

export async function initializeDatabaseOnce() {
  if (!isDatabaseInitialized) {
    console.log("🚀 Initializing database...");
    await connectToDatabase();

    // 🛠 Call initializeDatabase() to add roles, actions, and admin
    await initializeDatabase();

    isDatabaseInitialized = true;
  }
}
