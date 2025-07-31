import mongoose from "mongoose";
import { deleteFile } from "@/middlewares/backend_helpers";
import path from "path";
import { fileURLToPath } from "url";

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
    color: { type: String, required: false }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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


export default mongoose.models.Category || mongoose.model("Category", CategorySchema);