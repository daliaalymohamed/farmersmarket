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
    imageUrl: { type: String, required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who added the product
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who updated the product
    isActive: { type: Boolean, default: true }, // Soft delete
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

// Define a virtual to populate 'categoryId' field
ProductSchema.virtual("category", {  // ✅ Change from "name" to "category"
  ref: "Category", // ✅ Reference the correct model name (case-sensitive!)
  localField: "categoryId",
  foreignField: "_id",
  justOne: true, // ✅ Ensures we get a single object, not an array
});
// Apply the middleware to find and findOne queries
ProductSchema.pre("find", autoPopulateCategoryName);
ProductSchema.pre("findOne", autoPopulateCategoryName);
function autoPopulateCategoryName(next) {
  this.populate("category")
  next();
}

// Virtual populate for getting inventory information
ProductSchema.virtual('inventories', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'productId'
});

// Get total stock across all warehouses
ProductSchema.virtual('totalStock').get(async function() {
  const inventories = await this.model('Inventory')
    .find({ productId: this._id })
    .select('quantity');
  return inventories.reduce((sum, inv) => sum + inv.quantity, 0);
});

// Virtual populate for getting all vendors through inventory
ProductSchema.virtual('additionalVendors', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'productId',
  match: { vendorId: { $exists: true } }
});

// Add compound index for category and active status
ProductSchema.index({ categoryId: 1, vendorId: 1, active: 1 });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);