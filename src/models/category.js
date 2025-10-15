import mongoose from "mongoose";
import { deleteFile } from "@/middlewares/backend_helpers";
import path from "path";
import { fileURLToPath } from "url";
import { generateUniqueSlug } from "@/lib/utils/slugify";

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
    },
    image: { type: String, required: true },
    color: { type: String, required: false },
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

// ✅ Pre-save hook: Use the utility function
CategorySchema.pre('save', async function (next) {
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

//The pre('remove') hook to handle errors during file deletion when a record is deleted.
CategorySchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getQuery());

  if (doc && doc.image) {
    const filePath = path.resolve(
      __dirname,
      "..",
      "api",
      "uploads",
      "categories",
      "images",
      doc.image
    );

    try {
      await deleteFile(filePath);
    } catch (deleteError) {
      console.error(`❌ Error deleting file ${filePath}:`, deleteError);
    }
  }

  next();
});

// Add compound index for product and active status
CategorySchema.index({ 'name.en': 1 });
CategorySchema.index({ 'name.ar': 1 });

// Convert category to Meilisearch-friendly format
CategorySchema.methods.toSearchable = function () {
  return {
    id: this._id.toString(),
    type: 'category',
    name_en: this.name.en,
    name_ar: this.name.ar,
    color: this.color,
    
    // Unified searchable string
    searchable: [this.name.en, this.name.ar]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),

    image: this.image ? `/api/images/category/${this.image}` : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);