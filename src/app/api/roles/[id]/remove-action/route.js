import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/dbConnection';
import Role from '@/models/role';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

export const PUT = authMiddleware(async (req, { params }) => {
  try {
    const { id: roleId } = await params;
    console.log(`🚀 PUT /api/roles/${roleId}/remove-action`);

    await connectToDatabase();

    const requiredAction = "remove_action_from_role";
    await ensureActionExistsAndAssignToAdmin(requiredAction);

    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck;

    const { actionIds } = await req.json();
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Valid actionIds array required' },
        { status: 400 }
      );
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Remove specified actions
    const actionIdsStr = actionIds.map(id => id.toString());
    role.actions = role.actions.filter(a => !actionIdsStr.includes(a.toString()));

    await role.save();

    // Respond with updated role including actions
    const populatedRole = await Role.findById(roleId).populate('actions', '_id name').lean();

    return NextResponse.json({
      success: true,
      message: 'Actions removed successfully',
      role: populatedRole
    }, { status: 200 });

  } catch (error) {
    console.error('Error removing actions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});