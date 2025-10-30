import mongoose from "mongoose";
import { generateUniqueSlug } from "@/lib/utils/slugify";

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
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who added the product
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who updated the product
    isActive: { type: Boolean }, // Soft delete
    isFeatured: { type: Boolean, default: false }, // For highlighting products
    isOnSale: { type: Boolean, default: false }, // For sale products
    salePrice: { type: Number }, // Optional discounted price
    saleStart: { type: Date },
    saleEnd: { type: Date },
    tags: [{ type: String }], // Optional tags for filtering
    slug: { 
      type: String, 
      lowercase: true, 
      unique: true, 
      index: true,
      sparse: true // Important: allows null values without violating unique constraint
    }// For fast lookups,
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



// Add compound index for product and active status
ProductSchema.index({ categoryId: 1, vendorId: 1, isActive: 1 });
ProductSchema.index({ isOnSale: 1, stock: 1, isActive: 1 });           // For "On Sale/Top Deals"
ProductSchema.index({ createdAt: -1, stock: 1, isActive: 1 });         // For "New Arrivals"
ProductSchema.index({ isFeatured: 1, stock: 1, isActive: 1 });         // For "Featured"
ProductSchema.index({ 'name.en': 1 });
ProductSchema.index({ 'name.ar': 1 });
ProductSchema.index({ tags: 1 });


// ✅ Pre-save hook: Use the utility function
ProductSchema.pre('save', async function (next) {
  if (!this.name?.en) return next();

  try {
    // Use the utility function
    this.slug = await generateUniqueSlug(this.constructor, this.name.en, this._id);
    console.log('Generated slug on save:', this.slug);
    next();
  } catch (error) {
    console.error('Error generating slug:', error);
    next(error);
  }
});


// Convert product to Meilisearch-friendly format
ProductSchema.methods.toSearchable = function () {
  return {
    id: this._id.toString(),
    type: 'product',
    name_en: this.name.en,
    name_ar: this.name.ar,
    description_en: this.description?.en,
    description_ar: this.description?.ar,
    category_id: this.categoryId?.toString(),
    vendor_id: this.vendorId?.toString(),
    price: this.price,
    salePrice: this.salePrice,
    stock: this.stock,
    isOnSale: this.isOnSale,
    isFeatured: this.isFeatured,
    isActive: this.isActive,
    tags: Array.isArray(this.tags) ? this.tags : [],
    slug: this.slug,
    // Searchable combined field
    searchable: [
      this.name.en,
      this.name.ar,
      this.description?.en,
      this.description?.ar,
      ...(this.tags || []),
      this.categoryId?.name?.en, // if populated
      this.categoryId?.name?.ar,
      this.vendorId?.name              // if populated
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),

    image: this.image ? `/api/images/product/${this.image}` : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
}

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);