// models/shippingZones.js
import mongoose from 'mongoose';

// models/shippingZone.js
const shippingZoneSchema = new mongoose.Schema({
  name: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
  }, // e.g., "Cairo Metro", "Outside Egypt"
  zipCodes: [{ type: String, required: true}], // e.g., ["11511", "12345"]
  cityNames: [{
      en: { type: String, required: true}, // English city name
      ar: { type: String, required: true}  // Arabic city name
  }], // fallback if no ZIP match
  country: { type: String, default: 'Egypt' },
  shippingFee: { type: Number, required: true }, // EGP
  taxRate: { type: Number, default: 0.14 }, // 14% VAT
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who added the product
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who updated the product
},{ 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

// Add compound index for active status
shippingZoneSchema.index({ name: 1, active: 1 });

export default mongoose.models.ShippingZone || mongoose.model('ShippingZone', shippingZoneSchema);