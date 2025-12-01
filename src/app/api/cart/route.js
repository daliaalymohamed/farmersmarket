import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Cart from "@/models/cart";
import Product from '@/models/product';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch cart)
// routing: /api/cart
export const GET = authMiddleware(async (req) => {
  console.log("🚀 GET /api/cart route hit!"); // ✅ Log that the route was hit 
  try {
        const requiredAction = "view_cart"; // Define the required action for this route
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
              select: 'name price salePrice image quantity stock slug'
            }
          )
          .lean(); // Populate product details

        // populated cart items
        const populatedCartItems = cart ? cart.items.map(item => {
          const product = item.productId;
          return {
            productId: product ? product._id : item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            maxStock: item.maxStock,
            slug: product ? product.slug : null,
          };
        }) : [];
  
        // 🔹 Response
        return NextResponse.json(
            {
                cart: {
                  items: cart ? populatedCartItems : []
                },
                cartSuccess: true
            },
            {
              status: 200,
              headers: {
                  'Cache-Control': 'no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
              },
            }
        );
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
    
      return NextResponse.json(
        { message: "Internal Server Error", cartSuccess: false },
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
        
// Handle POST (add to cart)
// routing: /api/cart
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/cart route hit!"); // ✅ Log that the route was hit
  const requiredAction = "add_to_cart"; // Define the required action for this route
  
  try {
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
    
    let body;
    try {
    body = await req.json();
    } catch (err) {
    return NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 }); // ❌ Bad request
    }

    const { productId, quantity = 1 } = body;

    // Validate product exists and is in stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.stock <= 0) {
      return Response.json(
        { success: false, message: 'Product not available' },
        { status: 400 }
      );
    }

    // 🔍 Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 }
      );
    }

    // 🛑 Ensure quantity is integer and non-zero
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      return NextResponse.json(
        { error: "Quantity must be a non-zero number" },
        { status: 400 }
      );
    }
      
    // ✅ Proceed with the request
    // Build the cart
    // ✅ Find or create user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // 🔎 Check if item already exists
    const itemIndex = cart.items.findIndex(i =>
      i.productId.equals(productId)
    );

    // ✅ Build updated cart item data
    const updatedItemData = {
      productId: product._id,
      name: {
        en: product.name.en || 'Unnamed Product',
        ar: product.name.ar || 'اسم المنتج غير معروف'
      },
      price: product.isOnSale && product.salePrice > 0 ? product.salePrice : product.price,
      image: product.image,
      maxStock: product.stock
    };

    if (itemIndex > -1) {
      // 💡 Update existing item: treat `qty` as delta
      const item = cart.items[itemIndex];
      const newQuantity = item.quantity + qty;

      // 🔒 Prevent underflow or overstock
      if (newQuantity <= 0) {
        // If result is zero/negative → remove item
        cart.items.splice(itemIndex, 1);
      } else {
        item.quantity = Math.min(newQuantity, product.stock); // Cap at stock
      }
    } else {
      // ➕ Add new item only if adding (positive)
      if (qty > 0) {
        cart.items.push({
          ...updatedItemData,
          quantity: Math.min(qty, product.stock) // Don't exceed stock
        });
      }
      // Ignore negative qty for non-existent items
    }
    // Save the cart
    await cart.save();

    // 🔁 Re-fetch populated cart to ensure clean output
    const freshCart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'name price salePrice image stock slug'
    }).lean();

    const cartItems = freshCart?.items.map(item => {
      const product = item.productId;
      return {
        productId: product?._id.toString() || item.productId,
        name: item.name || product?.name,
        price: item.price ?? (product?.price ?? 0),
        image: item.image || product?.image,
        quantity: item.quantity,
        maxStock: item.maxStock || product?.stock || 0
      };
    }) || [];


    return NextResponse.json({
      message: qty > 0 ? 'Item added to cart successfully' : 'Item quantity updated',
      cart: { items: cartItems },
      cartSuccess: true
    }, { status: 200 }); // ✅ Created
    
  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    
    // Handle duplicate key error (if vendor name must be unique)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Cart with this name already exists", details: error.message },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create vendor", details: error.message },
      { status: 500 }
    );
  }
});

// Handle remove product from cart
export const DELETE = authMiddleware(async (req) => {
    console.log("🚀 DELETE /api/cart route hit!"); // ✅ Log that the route was hit
    const requiredAction = "remove_from_cart"; // Define the required action for this route

    try {
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

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
        return Response.json(
            { success: false, message: 'Missing productId' },
            { status: 400 }
        );
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

        // Find and update cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
          return NextResponse.json({ cart: { items: [] }, cartSuccess: true }, { status: 200 });
        }

        // Remove item by productId
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        // 🔁 Re-fetch cart with populated product data
        const freshCart = await Cart.findOne({ userId }).populate({
          path: 'items.productId',
          select: 'name price salePrice image stock slug'
        }).lean();

        // ✅ Build clean response using populated data
        const populatedCartItems = freshCart ? freshCart.items.map(item => {
          const product = item.productId;
          return {
            productId: product._id.toString(),
            name: item.name || product.name,
            price: item.price ?? (product.isOnSale && product.salePrice > 0 ? product.salePrice : product.price),
            image: item.image || product.image,
            quantity: item.quantity,
            maxStock: item.maxStock || product.stock,
            slug: product.slug
          };
        }) : [];

        return NextResponse.json({
          message: "Cart removed successfully",
          cart: { items: populatedCartItems },
          cartSuccess: true
        }, { status: 200 });
        } catch (error) {
          console.error("❌ Error removing cart:", error);
          return NextResponse.json(
            { error: "Failed to remove cart", details: error.message },
            { status: 500 }
          );
        }
});
