import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { 
        type: String, required: true, 
        unique: true, 
        default: () => `ORD-${uuidv4().slice(0, 8).toUpperCase()}`
    }, // Unique order number
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to User
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, // Reference to Product
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // Price at the time of purchase
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
    // Reference shipping and billing addresses from user
    shippingAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User.addresses'
    },
    billingAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User.addresses'
    },
    sameAsShipping: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ["Credit Card", "PayPal", "Cash on Delivery"], required: true },
    paymentStatus: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
  },
  { timestamps: true }
);

// Handle same as shipping address
OrderSchema.pre('save', function(next) {
  if (this.sameAsShipping) {
    this.billingAddressId = this.shippingAddressId;
  }
  next();
});

// Add an index on orderNumber for faster queries
OrderSchema.index({ orderNumber: 1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
