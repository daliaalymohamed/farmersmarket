import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Vendor from "@/models/vendor";
import Product from '@/models/product';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all vendors)
// routing: /api/vendors
export const GET = authMiddleware(async (req) => {
  console.log("🚀 GET /api/vendors?page=1&limit=3&search={} route hit!"); // ✅ Log that the route was hit to use it in vendorsList
  console.log("🚀 GET /api/vendors?noLimit=true&active=true") // to use it in productModal
  try {
        const requiredAction = "view_vendors"; // Define the required action for this route
        // Connect to the database
        await connectToDatabase();

        // Ensure the required action exists and is assigned to the admin role
        await ensureActionExistsAndAssignToAdmin(requiredAction);
        // ✅ Check if the user has the required permission
        // ✅ Check permission before executing
        const permissionCheck = await checkPermission(requiredAction)(req);
        if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

        const { searchParams } = new URL(req.url);
        
        // 🔹 1. Pagination & Limits
        const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? Math.min(parseInt(limitParam), 50) : 3; // default 3
        const noLimit = ['true', '1', 'yes'].includes(searchParams.get("noLimit")?.toLowerCase());
        
        // If noLimit=true, override limit to fetch all
        const shouldPaginate = !noLimit && limit > 0;

        // 🔹 2. Filters
        const query = {};
        
        // Search by name
        const search = searchParams.get("search");
        if (search) {
          query.name = { $regex: search, $options: 'i' };
        }

        // Filter by active status: 'true', 'false', or ignore for "all"
        const activeParam = searchParams.get("active");
        if (activeParam !== null && activeParam !== undefined && activeParam !== '') {
          const isActive = ['true', '1', 'yes'].includes(activeParam.toLowerCase());
          query.active = isActive;
        }
        // If no `active` param → return all (no filter)

      // 🔹 3. Sorting
      const sort = { createdAt: -1, _id: -1 }; // Newest first

      // 🔹 4. Count total (needed for pagination)
      const total = await Vendor.countDocuments(query);
      const totalPages = shouldPaginate ? Math.ceil(total / limit) : 0;

      // 🔹 5. Fetch vendors
      let vendors;
      if (shouldPaginate) {
        vendors = await Vendor.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate({
            path: "createdBy",
            model: "User",
            select: "firstName lastName email"
          })
          .populate({
            path: "updatedBy",
            model: "User",
            select: "firstName lastName email"
          });
      } else {
        // Return all vendors (no pagination)
        vendors = await Vendor.find(query)
          .sort(sort)
          .populate({
            path: "createdBy",
            model: "User",
            select: "firstName lastName email"
          })
          .populate({
            path: "updatedBy",
            model: "User",
            select: "firstName lastName email"
          });
      }

      // 🔹 6. Response
      return NextResponse.json(
        {
          vendors,
          ...(shouldPaginate && {
            pagination: {
              total,
              page,
              limit,
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
          }),
          // If no pagination, no pagination object returned
        vendorSuccess: true
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
      console.error('❌ Error fetching vendors:', error);
      return NextResponse.json(
        { message: "Internal Server Error", vendorSuccess: false },
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
        
// Handle POST (Create a new vendor)
// routing: /api/vendors
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/vendors route hit!"); // ✅ Log that the route was hit
  const requiredAction = "add_vendor"; // Define the required action for this route
  
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
      
    // ✅ Proceed with the request
    // Build created data
    const createdData = {
      name: body.name,
      contactPhone: body.contactPhone,
      location: body.location,
      about: body.about,
      socialLinks: body.socialLinks,
      createdBy: userId,
      updatedBy: userId,
    };
    const newVendor = new Vendor(createdData);
    await newVendor.save();
    
    return NextResponse.json({
      message: 'Vendor has been created successfully', 
      vendor: newVendor
    }, { status: 201 }); // ✅ Created
    
  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    
    // Handle duplicate key error (if vendor name must be unique)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Vendor with this name already exists", details: error.message },
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

// Handle PATCH (toggle vendor or vendors to together)
// routing: /api/vendors
export const PATCH = authMiddleware(async (req) => {
  console.log("🚀 PATCH /api/vendors route hit!"); // ✅ Log that the route was hit

  try {
    const requiredAction = "bulk_toggle_vendor_status"; // Define the required action for this route
    
    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);

    // ✅ Check if the user has the required permission
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    const currentUser = req.user; // Get the current user from the request
    if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ❌ Unauthorized
    }

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
    
    const { vendorIds, active } = await req.json();

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid vendorIds array is required' },
        { status: 400 }
      );
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be boolean' },
        { status: 400 }
      );
    }

    // Update all vendors
    const updatedVendors = await Vendor.updateMany(
      { _id: { $in: vendorIds } },
      { 
        active,
        updatedBy: userId
      }
    );

    if (updatedVendors.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No vendors found to update' },
        { status: 404 }
      );
    }

    // Update active status of related products if any
    const productUpdateResult = await Product.updateMany(
      { vendorId: { $in: vendorIds } },
      { isActive: active, updatedBy: userId }
    );
    
    // Fetch updated vendors with populated createdBy/updatedBy
    const vendors = await Vendor.find({ _id: { $in: vendorIds } })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return NextResponse.json({
      message: `Updated ${vendors.length} vendors successfully. ${productUpdateResult.modifiedCount} related products were also updated.`,
      vendors,
      meta: {
          productsAffected: productUpdateResult.modifiedCount,
        }
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to update vendors' },
      { status: 500 }
    );
  }
});