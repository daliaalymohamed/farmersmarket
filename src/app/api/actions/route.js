import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Action from '@/models/action';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all actions)
// routing: /api/actions
export const GET = authMiddleware(async (req) => {
  console.log("🚀 GET /api/actions route hit!"); // ✅ Log that the route was hit to use it in vendorsList

  try {
        const requiredAction = "view_actions"; // Define the required action for this route
        // Connect to the database
        await connectToDatabase();

        // Ensure the required action exists and is assigned to the admin role
        await ensureActionExistsAndAssignToAdmin(requiredAction);
        // ✅ Check if the user has the required permission
        // ✅ Check permission before executing
        const permissionCheck = await checkPermission(requiredAction)(req);
        if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

       

        // 🔹 1. Sorting
        const sort = { createdAt: -1, _id: -1 }; // Newest first

        // 🔹 2. Fetch roles
        let actions;
        actions = await Action.find()
            .sort(sort)
            .lean()

        // 🔹 3. Response
        // ✅ ALWAYS return 200, even if no roles found
      return NextResponse.json({
        actions: actions,
        success: true,
        message: actions.length === 0 ? 'No actions found' : `Found ${actions.length} actions`
      }, { 
        status: 200,
        headers: {
              'Cache-Control': 'no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
      });

    } catch (error) {
      console.error('❌ Error fetching actions:', error);
      return NextResponse.json(
        { message: "Internal Server Error", success: false },
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