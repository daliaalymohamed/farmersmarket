import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import User from "@/models/user";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import { getUserById } from '@/services/userService';

// Handle GET (Fetch user by ID)
// routing: /api/users/[id]
export const GET = authMiddleware(async (req, context) => {
  console.log("🚀 GET /api/users/:id route hit!"); // ✅ Log that the route was hit
  
  try {
   // Get params asynchronously
    const params = await context.params;
    
    // Validate ID parameter
    if (!params?.id) {
      return NextResponse.json({ 
        error: 'Missing user ID parameter' 
      }, { status: 400 });
    }

    const id = params.id;
    const requiredAction = "view_user"; // Define the required action for this route

    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    // ✅ Check if the user has the required permission
    // ✅ Check permission before executing
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response
    
    // ✅ Proceed with the request
    // Fetch the user by ID
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json('User not found', { status: 404 }); // ❌ Not found
    }

    return NextResponse.json(user, 
      { status: 200, headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
       } }); // ✅ Success
  } catch (error) {
      console.error('❌ Error fetching user:', error);

      // Handle specific errors
      if (error.name === 'CastError') {
        return NextResponse.json({
          error: 'Invalid user ID format',
          details: error.message
        }, { status: 400 });
      }
      // Handle generic errors
      return NextResponse.json({
        error: 'Internal Server Error',
        details: error.message
      }, { status: 500 });
    } // ❌ Server error
});

// Handle PUT (Update user by ID)
// routing: /api/users/[id]
export const PUT = authMiddleware(async (req, context) => {
  console.log("🚀 PUT /api/users/:id route hit!"); // ✅ Log that the route was hit
    
  try {
    // Get params asynchronously
    const params = await context.params;
    
    // Validate ID parameter
    if (!params?.id) {
      return NextResponse.json({ 
        error: 'Missing user ID parameter' 
      }, { status: 400 });
    }

    const id = params.id;
    const requiredAction = "edit_user"; // Define the required action for this route

    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    // ✅ Check if the user has the required permission
    // ✅ Check permission before executing
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response
    
    // ✅ Proceed with the request
    const userData = await req.json(); // Assuming the request body contains the updated user data
    
    // Use the $set operator to properly update nested fields
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: userData },  // Use $set to update nested objects
      { 
        new: true,        // Return updated document
        runValidators: true,  // Run model validators
        upsert: true // This will create the nested object if it doesn't exist
      }
    );
    
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 }); // ❌ Not found
    }
    return NextResponse.json({message: 'User has been updated successfully', user: updatedUser}, { status: 200 }); // ✅ Success
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 }); // ❌ Server error
  }
});

// Handle PATCH (activate or deactivate user by ID)
// The PATCH method is used for partial updates, which is appropriate for activating/deactivating a user.
// routing: /api/users/[id]
export const PATCH = authMiddleware(async (req, context) => {
  console.log("🚀 PATCH /api/users/:id route hit!"); // ✅ Log that the route was hit
  
  try {
    // Get params asynchronously
    const params = await context.params;
    
    // Validate ID parameter
    if (!params?.id) {
      return NextResponse.json({ 
        error: 'Missing user ID parameter' 
      }, { status: 400 });
    }

    const id = params.id;
    const requiredAction = "toggle_user_status"; // Define the required action for this route
    
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

    // Update the user's active status
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { active }, // Update the `active` field based on the request
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 }); // ❌ Not found
    }

    const message = active
      ? "User has been activated successfully"
      : "User has been deactivated successfully";

    return NextResponse.json(
      { message, user: updatedUser },
      { status: 200 }
    ); // ✅ Success
  } catch (error) {
    console.error("❌ Error toggling user status:", error);
    return NextResponse.json({ error: "Failed to toggle user status" }, { status: 500 }); // ❌ Server error
  }
});