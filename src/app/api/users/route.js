import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import User from "@/models/user";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';


// Handle GET (Fetch all users with role details)
// routing: /users
export const GET = authMiddleware(async (req) => {
    console.log("🚀 GET /api/users route hit!"); // ✅ Log that the route was hit
    const requiredAction = "view_users"; // Define the required action for this route
    
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
        const users = await User.find({ active: true }, { firstName: 1, lastName: 1, email: 1, phoneNumber: 1, roleId: 1, orders: 1, active: 1 });
        return NextResponse.json(users, { status: 200 }); // ✅ Success
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }); // ❌ Server error
    }
});




