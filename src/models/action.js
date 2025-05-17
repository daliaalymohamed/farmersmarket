import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "create_task", "edit_task"
});

export default mongoose.models.Action || mongoose.model("Action", ActionSchema);