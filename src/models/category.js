import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
    },
    imageUrl: { type: String, required: true }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);