import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "admin", "editor", "user"
  actions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Action' }], // Reference to Action
});

export default mongoose.models.Role || mongoose.model("Role", RoleSchema);