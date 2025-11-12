// models/cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
  name: {
      en: { type: String, required: true }, // English name
      ar: { type: String, required: true }, // Arabic name
  },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  maxStock: { type: Number }
});

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User',
    index: true // ✅ Index for fast lookup
  },
  items: [cartItemSchema],
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: '30d' // 🔥 Auto-delete after 30 days (TTL)
  }
});

export default mongoose.models.Cart || mongoose.model('Cart', cartSchema);