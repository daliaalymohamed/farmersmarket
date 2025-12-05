import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Cart from "@/models/cart";
import User from "@/models/user";
import ShippingZone from "@/models/shippingZone";
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

        // 🔹 Fetch cart with populated product data
        const cart = await Cart.findOne({ userId }).populate({
          path: 'items.productId',
          select: 'name price isOnSale salePrice image stock isActive slug'
        }).lean();

        if (!cart || cart.items.length === 0) {
          return NextResponse.json(
            { error: 'Your cart is empty' },
            { status: 400 }
          );
        }

        
        // 🔹 Fetch user's default shipping address
        const userProfile = await User.findById(userId).select('addresses').lean();
        const defaultShipping = userProfile?.addresses?.find(a => a.isDefaultShipping);

        if (!defaultShipping) {
          return NextResponse.json(
            { error: 'Please set a default shipping address.' },
            { status: 400 }
          );
        }

        // 🔹 Find matching shipping zone using city name OR zip code
        let shippingZone = null;

        // First: Try match by zip code
        if (defaultShipping.zipCode) {
          shippingZone = await ShippingZone.findOne({
            active: true,
            // check if zipCodes array contains the user's zip code
            zipCodes: defaultShipping.zipCode
          });
        }

        // Second: If no ZIP match, try by city name (English)
        if (!shippingZone && defaultShipping.city) {
          shippingZone = await ShippingZone.findOne({
            active: true,
            "cityNames.en": defaultShipping.city
          });
        }

        // Optional: Fallback to country-level zone if needed
        if (!shippingZone && defaultShipping.country) {
          shippingZone = await ShippingZone.findOne({
            active: true,
            country: defaultShipping.country
          });
        }

        // Final fallback values
        const shippingFee = shippingZone?.shippingFee ?? 50; // EGP
        const taxRate = shippingZone?.taxRate ?? 0.14; // 14%
        

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

        // ✅ Safe price calculation with proper fallbacks
        const isOnSale = product.isOnSale === true;
        const salePrice = typeof product.salePrice === 'number' ? product.salePrice : 0;
        const regularPrice = typeof product.price === 'number' ? product.price : 0;
        
        // Calculate final price
        const price = isOnSale && salePrice > 0 ? salePrice : regularPrice;

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
              subtotal: total,
            },
            { status: 400 }
        );
        }

        return NextResponse.json({
          cart: { items: validItems },
          subtotal: total,
          shippingFee: parseFloat(shippingFee.toFixed(2)),
          taxRate: parseFloat(taxRate.toFixed(4)),
          taxAmount: parseFloat((total * taxRate).toFixed(2)),
          totalWithTaxAndShipping: parseFloat((total + (total * taxRate) + shippingFee).toFixed(2)),
          // 👇 Useful for showing delivery estimate
          shippingZoneName: shippingZone?.name,
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