import mongoose from "mongoose";
// Vendor model for managing vendors in the e-commerce application
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPhone: String,
  location: String,
  description: String,
  socialLinks: {
    facebook: String,
    instagram: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who added the vendor
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);