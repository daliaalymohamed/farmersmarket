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


export default mongoose.models.Inventory || mongoose.model("Warehouse", WarehouseSchema);