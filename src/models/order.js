import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
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
    address: {
      street: String,
      city: String,
      zip: String,
      country: String,
    },
    paymentMethod: { type: String, enum: ["Credit Card", "PayPal", "Cash on Delivery"], required: true },
    paymentStatus: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
