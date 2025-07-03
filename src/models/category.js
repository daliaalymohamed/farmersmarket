import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
    },
    image: { type: String, required: true },
    color: { type: String, required: false }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);