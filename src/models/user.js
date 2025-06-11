import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/************** Hashing passwords *********************** */
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
/************** Hashing passwords *********************** */

// add compound index for active and CreatedAt fields
// This will help in filtering users based on their active status and creation date
//  it can jump directly to the relevant documents.
UserSchema.index({ active: 1, CreatedAt: 1 }); // compound index

export default mongoose.models.User || mongoose.model("User", UserSchema);