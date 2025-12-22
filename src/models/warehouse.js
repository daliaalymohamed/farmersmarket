import mongoose from "mongoose";

const WarehouseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  contactInfo: {
    phone: String,
    email: String,
    contactPerson: String
  },
  active: { type: Boolean, default: true },
  capacity: { type: Number, required: true }, // Total storage capacity
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, 
{ 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Add compound index for active status
WarehouseSchema.index({ name: 1, active: 1 });


export default mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);