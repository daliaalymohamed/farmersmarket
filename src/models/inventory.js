import mongoose from "mongoose";

// Inventory model for managing vendors in the e-commerce application
const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  quantity: { type: Number, required: true },
  restockThreshold: { type: Number, default: 10 }, // Alert if below
  restockDate: Date,
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who updated stock
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

// Add compound index for productId and warehouseId for efficient querying
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);