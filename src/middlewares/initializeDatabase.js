import mongoose from "mongoose";
import User from "../models/user.js";
import Role from "../models/role.js";
import Action from "../models/action.js";
import { defaultRoles } from "./data/roles.js";
import { defaultActions } from "./data/actions.js";
import bcrypt from "bcrypt";

// Add default actions
async function initializeActions() {
  console.log("Initializing actions...");

  for (const actionName of defaultActions) {
    try {
      const action = await Action.findOneAndUpdate(
        { name: actionName },
        { name: actionName },
        { upsert: true, new: true }
      );
      console.log(`✅ Action ensured: ${actionName}`);
    } catch (error) {
      console.error(`❌ Error ensuring action ${actionName}:`, error);
    }
  }

  console.log("✅ Action initialization complete.");
}

// Add default roles
async function initializeRoles() {
  await initializeActions();

  const allActions = await Action.find();
  const allActionIds = allActions.map(action => action._id);
  console.log(`🔹 All available actions: ${allActions.map(a => a.name).join(", ")}`);

  for (const roleName of defaultRoles) {
    const actions = roleName === "admin" ? allActionIds : [];

    try {
      const role = await Role.findOneAndUpdate(
        { name: roleName },
        { name: roleName, actions },
        { upsert: true, new: true }
      );
      console.log(`✅ Role ensured: ${roleName} with actions: ${roleName === "admin" ? "ALL ACTIONS" : "No Actions"}`);
    } catch (error) {
      console.error(`❌ Error ensuring role ${roleName}:`, error);
    }
  }
}

// Add admin user record
async function initializeAdminUser() {
  const adminRole = await Role.findOne({ name: "admin" });
  console.log(`Admin role found: ${adminRole ? adminRole._id : "Not found"}`);

  if (!adminRole) {
    console.error("❌ Admin role not found! Ensure roles are initialized first.");
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const adminUser = await User.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL },
      {
        firstName: "Admin",
        lastName: "Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        phoneNumber: process.env.ADMIN_PHONE,
        roleId: adminRole._id,
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Admin user ensured: ${adminUser.email}`);
  } catch (error) {
    console.error("❌ Error ensuring admin user:", error);
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected.");

    await initializeActions();
    await initializeRoles();
    await initializeAdminUser();

    console.log("✅ Database initialized successfully.");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}

export default initializeDatabase;