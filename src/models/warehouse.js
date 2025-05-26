import mongoose from "mongoose";
// Vendor model for managing vendors in the e-commerce application
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Optional if one warehouse
  location: String,
  capacity: Number, // optional
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional: warehouse supervisor
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

export default mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);