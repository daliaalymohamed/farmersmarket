// authorization
import User from '@/models/user';
import Role from '@/models/role';
import { NextResponse } from 'next/server';

const checkPermission = (requiredAction) => async (req) => {
  try {
    if (!req.user || !req.user.userId) {
      console.log("here")
      console.log(req.user)
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Find the user with role populated (only fetch `actions`)
    const user = await User.findById(req.user.userId).populate({ 
      path: "roleId", 
      select: "actions" 
    });
    if (!user || !user.roleId) {
      return NextResponse.json({ message: "User not found or role missing" }, { status: 404 });
    }

    const role = await Role.findById(user.roleId._id).select("actions").populate("actions");
    // Extract action names from role.actions
    const actionNames = role.actions.map(action => action.name);
    if (!actionNames.includes(requiredAction)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    return null; // ✅ Authorized (No response means proceed)
  } catch (err) {
    console.error('Server error', err);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
};

export default checkPermission;