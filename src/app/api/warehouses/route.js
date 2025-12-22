import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Warehouse from "@/models/warehouse";
import Inventory from '@/models/inventory';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all warehouses)
// routing: /api/warehouses
export const GET = authMiddleware(async (req) => {
  console.log("🚀 GET /api/warehouses route hit!");
  try {
    const requiredAction = "view_warehouses"; // Define the required action for this route
    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    // ✅ Check if the user has the required permission
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    const { searchParams } = new URL(req.url);
    
    // 🔹 1. Pagination & Limits
    const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam), 50) : 10;
    const noLimit = ['true', '1', 'yes'].includes(searchParams.get("noLimit")?.toLowerCase());
    
    const shouldPaginate = !noLimit && limit > 0;

    // 🔹 2. Filters
    const query = {};
    
    // Search by name
    const search = searchParams.get("search");
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by active status
    const activeParam = searchParams.get("active");
    if (activeParam !== null && activeParam !== undefined && activeParam !== '') {
      const isActive = ['true', '1', 'yes'].includes(activeParam.toLowerCase());
      query.active = isActive;
    }

    // 🔹 3. Sorting
    const sort = { createdAt: -1, _id: -1 };

    // 🔹 4. Count total
    const total = await Warehouse.countDocuments(query);
    const totalPages = shouldPaginate ? Math.ceil(total / limit) : 0;

    // 🔹 5. Fetch warehouses
    let warehouses;
    if (shouldPaginate) {
      warehouses = await Warehouse.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "managerId",
          model: "User",
          select: "firstName lastName email"
        });
    } else {
      warehouses = await Warehouse.find(query)
        .sort(sort)
        .populate({
          path: "managerId",
          model: "User",
          select: "firstName lastName email"
        });
    }

    // 🔹 6. Response
    return NextResponse.json(
      {
        warehouses,
        ...(shouldPaginate && {
          pagination: {
            total,
            page,
            limit,
            totalPages,
          },
        }),
        warehouseSuccess: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET /api/warehouses error:", error);
    return NextResponse.json(
      { warehouseSuccess: false, message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

// Handle POST (Create new warehouse)
// routing: /api/warehouses
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/warehouses route hit!");
  try {
    const requiredAction = "add_warehouse";
    
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

    // Parse request body
    const warehouseData = await req.json();

    // Validate required fields
    if (!warehouseData.name) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    // Create new warehouse
    const warehouse = new Warehouse({
      ...warehouseData,
      managerId: userId,
    });

    await warehouse.save();
    
    // Populate managerId
    await warehouse.populate({
      path: "managerId",
      model: "User",
      select: "firstName lastName email"
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Warehouse created successfully',
        warehouse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/warehouses error:", error);
    return NextResponse.json(
      { success: false, message: 'Failed to create warehouse', details: error.message },
      { status: 500 }
    );
  }
});

// Handle PATCH (toggle warehouse or warehouse to together)
// routing: /api/warehouses
export const PATCH = authMiddleware(async (req) => {
  console.log("🚀 PATCH /api/warehouses route hit!"); // ✅ Log that the route was hit

  try {
    const requiredAction = "bulk_toggle_warehouse_status"; // Define the required action for this route
    
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

    const { warehouseIds, active } = await req.json();

    if (!Array.isArray(warehouseIds) || warehouseIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid warehouseIds array is required' },
        { status: 400 }
      );
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be boolean' },
        { status: 400 }
      );
    }

    // Update all warehouses
    const updateResult = await Warehouse.updateMany(
      { _id: { $in: warehouseIds } },
      { 
        active,
        managerId: userId
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No warehouses found to update' },
        { status: 404 }
      );
    }

    // Fetch updated warehouses with populated managerId
    const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } })
      .populate('managerId', 'firstName lastName email');

    return NextResponse.json({
      message: `Updated ${updateResult.modifiedCount} warehouses successfully`,
      warehouses: warehouses
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouses' },
      { status: 500 }
    );
  }
});