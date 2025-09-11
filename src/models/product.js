import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
    },
    description: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
    },
    price: { type: Number, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    stock: { type: Number, default: 0 },
    image: { type: String, required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who added the product
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who updated the product
    isActive: { type: Boolean }, // Soft delete
    isFeatured: { type: Boolean, default: false }, // For highlighting products
    isOnSale: { type: Boolean, default: false }, // For sale products
    salePrice: { type: Number }, // Optional discounted price
    saleStart: { type: Date },
    saleEnd: { type: Date },
    tags: [{ type: String }], // Optional tags for filtering
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Virtual: Populate inventories
ProductSchema.virtual("inventories", {
  ref: "Inventory",
  localField: "_id",
  foreignField: "productId",
});

// /// ✅ Virtual: Get additional vendors via inventory
// ProductSchema.virtual("additionalVendors", {
//   ref: "Inventory",
//   localField: "_id",
//   foreignField: "productId",
//   match: { vendorId: { $exists: true, $ne: null } },
//   justOne: false,
// });

// // calculate totalStock
// ProductSchema.methods.getTotalStock = async function () {
//   const Inventory = mongoose.model("Inventory");
//   const inventories = await Inventory.find({ productId: this._id }).select("quantity");
//   return inventories.reduce((sum, inv) => sum + inv.quantity, 0);
// };

// Add compound index for product and active status
ProductSchema.index({ categoryId: 1, vendorId: 1, isActive: 1 });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);