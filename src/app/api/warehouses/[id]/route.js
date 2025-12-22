import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Warehouse from "@/models/warehouse";
import Inventory from "@/models/inventory";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch single warehouse by ID)
// routing: /api/warehouses/[id]
export const GET = authMiddleware(async (req, context) => {
  try {
    const params = await context.params;
    const warehouseId = params.id;
    console.log(`🚀 GET /api/warehouses/${warehouseId} route hit!`);

    const requiredAction = "view_warehouse";
    
    // Connect to the database
    await connectToDatabase();

     // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    // ✅ Check if the user has the required permission
    // ✅ Check permission before executing
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    // ✅ Proceed with the request
    // Fetch the warehouse by ID
    const warehouse = await Warehouse.findById(warehouseId).populate({
      path: "managerId",
      model: "User",
      select: "firstName lastName email"
    });

    if (!warehouse) {
      return NextResponse.json(
        { warehouseSuccess: false, message: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        warehouseSuccess: true,
        warehouse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET /api/warehouses/[id] error:", error);
    return NextResponse.json(
      { warehouseSuccess: false, message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

//// Handle PUT (Update warehouse by ID)
// routing: /api/warehouses/[id]
export const PUT = authMiddleware(async (req, context) => {
  console.log("🚀 PUT /api/warehouses/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
  const requiredAction = "edit_warehouse"; // Define the required action for this route

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

    // ✅ Proceed with the request
    // Find existing warehouse
    const existingWarehouse = await Warehouse.findById(id);
    if (!existingWarehouse) {
        return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Update the warehouse
    const updateData = await req.json();
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(id, { ...updateData, updatedBy: userId }, {
      new: true,
      runValidators: true
    })

    if (!updatedWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // ✅ Populate related documents
    const populatedWarehouse = await Warehouse.populate(updatedWarehouse, [
      { path: 'managerId' },
    ]);

    // Now return fully populated warehouse
    return NextResponse.json({
      message: 'Warehouse has been updated successfully',
      warehouse: populatedWarehouse // ✅ Now includes full objects
    }, { status: 200 });// ✅ Success

  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    return NextResponse.json(
      { error: "Failed to update warehouse", details: error.message },
      { status: 500 }
    );
  }
});

// Handle PATCH (activate or deactivate warehouse by ID)
// The PATCH method is used for partial updates, which is appropriate for activating/deactivating a warehouse.
// routing: /api/warehouses/[id]
export const PATCH = authMiddleware(async (req, context) => {
  console.log("🚀 PATCH /api/warehouses/:id route hit!"); // ✅ Log that the route was hit
  
  try {
    // Get params asynchronously
    const params = await context.params;
    
    // Validate ID parameter
    if (!params?.id) {
      return NextResponse.json({ 
        error: 'Missing warehouse ID parameter' 
      }, { status: 400 });
    }

    const id = params.id;
    const requiredAction = "toggle_warehouse_status"; // Define the required action for this route
    
    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);

    // ✅ Check if the user has the required permission
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    // ✅ Proceed with the request
    const { active } = await req.json(); // Assuming the request body contains the updated active status
    // Validate that `active` is a boolean
    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid 'active' value. Must be true or false boolean values" },
        { status: 400 }
      ); // ❌ Bad request
    }

    // Update the warehouse's active status
    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      id,
      { active },
      { new: true } // Return the updated document
    );

    if (!updatedWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 }); // ❌ Not found
    }

    const message = active 
        ? 'Warehouse has been activated successfully'
        : 'Warehouse has been deactivated successfully';

    // ✅ Populate related documents
    const populatedWarehouse = await Warehouse.populate(updatedWarehouse, [
      { path: 'managerId' },
    ]);

    // Now return fully populated warehouse
    return NextResponse.json({
      message,
      warehouse: populatedWarehouse, // ✅ Now includes full objects
    }, { status: 200 });// ✅ Success
  } catch (error) {
    console.error("❌ Error toggling warehouse status:", error);
    return NextResponse.json({ error: "Failed to toggle warehouse status" }, { status: 500 }); // ❌ Server error
  }
});