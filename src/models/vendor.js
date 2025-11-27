import mongoose from "mongoose";
// Vendor model for managing vendors in the e-commerce application
const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPhone: { type: String, required: true },
  location: { type: String },
  about: { type: String },
  socialLinks: {
    facebook: { type: String },
    instagram: { type: String },
  },
  active: { type: Boolean, default: true }, // For soft delete
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who added the vendor,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who last updated the vendor
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

// Add compound index for active status
VendorSchema.index({ name: 1, active: 1 });


export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);