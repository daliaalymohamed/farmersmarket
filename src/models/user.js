import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Reusable address schema
const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefaultShipping: { type: Boolean, default: false },
  isDefaultBilling: { type: Boolean, default: false }
}, { _id: true });

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }, // Reference to Role
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }], // Reference to Order
    active: { type: Boolean, default: true }, // For soft delete
    tokenVersion: { type: Number, default: 0 }, // For token invalidation,
    addresses: [AddressSchema]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Set default shipping address
UserSchema.methods.setDefaultShippingAddress = async function(addressId) {
  this.addresses.forEach(addr => addr.isDefaultShipping = false);
  const address = this.addresses.id(addressId);
  if (!address) throw new Error('Address not found');
  address.isDefaultShipping = true;
  await this.save();
};

// Set default billing address
UserSchema.methods.setDefaultBillingAddress = async function(addressId) {
  this.addresses.forEach(addr => addr.isDefaultBilling = false);
  const address = this.addresses.id(addressId);
  if (!address) throw new Error('Address not found');
  address.isDefaultBilling = true;
  await this.save();
};

// hashing password before saving the document to the db
UserSchema.pre("save", async function () {
  // hashing password only when changed,
  //  because this pre middlware will be executed when updating also.
  if (this.isModified("password")) {
    const hashedPassword = await bcrypt.hash(
      this.password,
      +process.env.HASHING_COST
    );
    this.password = hashedPassword;
    this.repeatPassword = hashedPassword;
  }
  this.email = this.email.toLowerCase();
});

// avoid returning the password in the response
UserSchema.post("save", function () {
  this.email = this.email.toLowerCase();
  this.password = undefined;
  this.repeatPassword = undefined;
});

// comparing the stored password with the entered one
UserSchema.methods.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

// add compound index for active and CreatedAt fields
// This will help in filtering users based on their active status and creation date
//  it can jump directly to the relevant documents.
UserSchema.index({ active: 1, CreatedAt: 1 }); // compound index

export default mongoose.models.User || mongoose.model("User", UserSchema);