import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import Role from '@/models/role';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

export const PUT = authMiddleware(async (req, { params }) => {
  try {
    const { id: roleId } = await params; // Extract dynamic param
    console.log(`🚀 PUT /api/roles/${roleId}/assign-action`);

    await connectToDatabase();

    // Ensure action exists and check permission
    const requiredAction = "assign_action_to_role";
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck;

    // Parse body
    const { actionIds } = await req.json();
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Valid actionIds array required' },
        { status: 400 }
      );
    }

    // Find role
    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Assign unique actions
    const newActions = new Set([
      ...role.actions.map(a => a.toString()),
      ...actionIds.map(id => id.toString())
    ]);

    role.actions = Array.from(newActions);

    await role.save();

    // Respond with updated role including actions
    const populatedRole = await Role.findById(roleId).populate('actions', '_id name').lean();

    return NextResponse.json({
      success: true,
      message: 'Actions assigned successfully',
      role: populatedRole
    }, { status: 200 });

  } catch (error) {
    console.error('Error assigning actions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});