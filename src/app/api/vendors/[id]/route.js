// (Get, Update, Delete by ID)
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Vendor from "@/models/vendor";
import Product from '@/models/product';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import { getVendorById } from '@/services/vendorService';

// Handle GET (Fetch vendor by ID)
// routing: /api/vendors/[id]
export const GET = authMiddleware(async (req, context) => {
  console.log("🚀 GET /api/vendors/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
  const requiredAction = "view_vendor"; // Define the required action for this route
    console.log("id => ", id)
  try {
    // Connect to the database
    await connectToDatabase();

     // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    // ✅ Check if the user has the required permission
    // ✅ Check permission before executing
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    // ✅ Proceed with the request
    // Fetch the category by ID
    const product = await getVendorById(id);
    if (!product) {
      return NextResponse.json('Vendor not found', { status: 404 }); // ❌ Not found
    }
    return NextResponse.json(product, { status: 200 }); // ✅ Success
  } catch (error) {
    console.error('❌ Error fetching vendor:', error);
    return NextResponse.json({message: 'Internal Server Error'}, { status: 500 }); // ❌ Server error
  }
});

// Handle PUT (Update vendor by ID)
// routing: /api/vendors/[id]
export const PUT = authMiddleware(async (req, context) => {
  console.log("🚀 PUT /api/vendors/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
  const requiredAction = "edit_vendor"; // Define the required action for this route

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
    // Find existing vendor
    const existingVendor = await Vendor.findById(id);
    if (!existingVendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
   
    // Update the vendor
    const updateData = await req.json();
    const updatedVendor = await Vendor.findByIdAndUpdate(id, { ...updateData, updatedBy: userId }, {
      new: true,
      runValidators: true
    })

    if (!updatedVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // ✅ Populate related documents
    const populatedVendor = await Vendor.populate(updatedVendor, [
      { path: 'createdBy' },
      { path: 'updatedBy' },
    ]);

    // Now return fully populated vendor
    return NextResponse.json({
      message: 'Vendor has been updated successfully',
      vendor: populatedVendor // ✅ Now includes full objects
    }, { status: 200 });// ✅ Success

  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    return NextResponse.json(
      { error: "Failed to update vendor", details: error.message },
      { status: 500 }
    );
  }
});

// Handle PATCH (activate or deactivate vendor by ID)
// The PATCH method is used for partial updates, which is appropriate for activating/deactivating a vendor.
// routing: /api/vendors/[id]
export const PATCH = authMiddleware(async (req, context) => {
  console.log("🚀 PATCH /api/vendors/:id route hit!"); // ✅ Log that the route was hit
  
  try {
    // Get params asynchronously
    const params = await context.params;
    
    // Validate ID parameter
    if (!params?.id) {
      return NextResponse.json({ 
        error: 'Missing vendor ID parameter' 
      }, { status: 400 });
    }

    const id = params.id;
    const requiredAction = "toggle_vendor_status"; // Define the required action for this route
    
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

    // ✅ Proceed with the request
    const { active } = await req.json(); // Assuming the request body contains the updated active status
    // Validate that `active` is a boolean
    if (typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid 'active' value. Must be true or false boolean values" },
        { status: 400 }
      ); // ❌ Bad request
    }

    // Update the vendor's active status
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      { active, updatedBy: userId },
      { new: true } // Return the updated document
    );

    if (!updatedVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 }); // ❌ Not found
    }

    // Update active status of related products if any
    const productUpdateResult = await Product.updateMany(
      { vendorId: id },
      { isActive: active, updatedBy: userId }
    );

    const message = active 
        ? `Vendor has been activated successfully. ${productUpdateResult.modifiedCount} products were also activated.`
        : `Vendor has been deactivated successfully. ${productUpdateResult.modifiedCount} products were also deactivated.`;

    // ✅ Populate related documents
    const populatedVendor = await Vendor.populate(updatedVendor, [
      { path: 'createdBy' },
      { path: 'updatedBy' },
    ]);

    // Now return fully populated vendor
    return NextResponse.json({
      message,
      vendor: populatedVendor, // ✅ Now includes full objects
      meta: {
          productsAffected: productUpdateResult.modifiedCount,
      }
    }, { status: 200 });// ✅ Success
  } catch (error) {
    console.error("❌ Error toggling vendor status:", error);
    return NextResponse.json({ error: "Failed to toggle vendor status" }, { status: 500 }); // ❌ Server error
  }
});