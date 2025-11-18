import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Cart from "@/models/cart";
import Product from '@/models/product';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch checkout data)
// routing: /api/checkout
export const GET = authMiddleware(async (req) => {
  console.log("🚀 GET /api/checkout route hit!"); // ✅ Log that the route was hit 
  try {
        const requiredAction = "view_checkout"; // Define the required action for this route
        // Connect to the database
        await connectToDatabase();

        // Ensure the required action exists and is assigned to the admin role
        await ensureActionExistsAndAssignToAdmin(requiredAction);
        // ✅ Check if the user has the required permission
        // ✅ Check permission before executing
        const permissionCheck = await checkPermission(requiredAction)(req);
        if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response
        
        const currentUser = req.user; // Get the current user from the request
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ❌ Unauthorized
        }

        // ✅ ALWAYS set createdBy for any create operation
        // Check different possible properties for the user ID
        // Extract user ID safely
        let userId = null;
        if (currentUser.userId && currentUser.userId !== "null") {
        userId = currentUser.userId;
        } else if (currentUser._id && currentUser._id !== "null") {
        userId = currentUser._id;
        } else if (currentUser.id && currentUser.id !== "null") {
        userId = currentUser.id;
        }

        if (!userId) {
        console.warn("⚠️ Could not determine user ID for createdBy");
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
        }

        // 🔹Fetch cart
        const cart = await Cart.findOne({ userId })
          .populate(
            {
              path: 'items.productId',
              select: 'name price salePrice image stock isActive slug'
            }
          )
          .lean(); // Populate product details

        if (!cart || cart.items.length === 0) {
            return NextResponse.json(
                { error: 'Your cart is empty' },
                { status: 400 }
            );
        }
        const invalidItems = [];
        const validItems = [];
        let total = 0;

        for (const item of cart.items) {
        const product = item.productId;
        if (!product) {
          console.warn(`❌ Product not populated for itemId: ${item.productId}`);
          invalidItems.push(
            { /* 
              ... */ });
          continue;
        }

        if (!product.isActive) {
          console.warn(`⚠️ Product inactive: ${product.name?.en}`);
        }

        if (product.stock < item.quantity) {
          console.warn(`📉 Stock mismatch: need=${item.quantity}, have=${product.stock}`);
        }

        const price = product.isOnSale && product.salePrice > 0 ? product.salePrice : product.price;
        total += price * item.quantity;

        validItems.push({
            productId: product ? product._id : item.productId,
            name: product.name,
            quantity: item.quantity,
            price,
            image: product.image,
            maxStock: product.stock
        });
        }

        if (invalidItems.length > 0) {
        return NextResponse.json(
            { 
            error: 'Some items are out of stock or unavailable',
            invalidItems,
            validItems,
            subtotal: total
            },
            { status: 400 }
        );
        }

        return NextResponse.json({
        cart: { items: validItems },
        subtotal: total,
        success: true
        }, {
              status: 200,
              headers: {
                  'Cache-Control': 'no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
              },
            });
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
    
      return NextResponse.json(
        { message: "Internal Server Error", success: false },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }
});