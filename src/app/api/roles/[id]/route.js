import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Role from '@/models/role';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle PUT (edit role)
// routing: /api/roles/:id
export const PUT = authMiddleware(async (req, context) => {
    const params = await context.params;
    const roleId = params.id;
    console.log(`🚀 PUT /api/roles/${roleId} route hit!`); // ✅ Log that the route was hit to use
    const requiredAction = "edit_role"; // Define the required action for this route

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
    // Find existing role
    const existingRole = await Role.findById(roleId);
    if (!existingRole) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
   
    // Update the role
    const updateData = await req.json();
    
    // Only update allowed fields, preserve actions
    const allowedFields = ['name']; // Define which fields can be updated
    const fieldsToUpdate = {};
    
    allowedFields.forEach(field => {
      if (field in updateData) {
        fieldsToUpdate[field] = updateData[field];
      }
    });

    const updatedRole = await Role.findByIdAndUpdate(roleId, fieldsToUpdate, {
      new: true,
      runValidators: true
    })

    if (!updatedRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Populate actions
    await updatedRole.populate('actions', '_id name');

    // Now return fully response
    return NextResponse.json({
      message: 'Role has been updated successfully',
      role: updatedRole // ✅ Now includes full objects
    }, { status: 200 });// ✅ Success

  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    return NextResponse.json(
      { error: "Failed to update vendor", details: error.message },
      { status: 500 }
    );
  }
});