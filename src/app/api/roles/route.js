import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Role from '@/models/role';
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all roles)
// routing: /api/roles
export const GET = authMiddleware(async (req) => {
  console.log("🚀 GET /api/roles?search={} route hit!"); // ✅ Log that the route was hit to use it in vendorsList

  try {
        const requiredAction = "view_roles"; // Define the required action for this route
        // Connect to the database
        await connectToDatabase();

        // Ensure the required action exists and is assigned to the admin role
        await ensureActionExistsAndAssignToAdmin(requiredAction);
        // ✅ Check if the user has the required permission
        // ✅ Check permission before executing
        const permissionCheck = await checkPermission(requiredAction)(req);
        if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

        const { searchParams } = new URL(req.url);
        
        // 🔹 1. Filters
        const query = {};
        
        // Search by name
        const search = searchParams.get("search");
        if (search && search.trim() !== '') {
          // Case-insensitive search on role name
          query.name = { $regex: search.trim(), $options: 'i' };
        }


        // 🔹 2. Sorting
      const sort = { createdAt: -1, _id: -1 }; // Newest first

      // 🔹 3. Fetch roles
      let roles;
      roles = await Role.find(query)
          .sort(sort)
          .populate('actions', 'name _id') 
          .lean()

      // 🔹 4. Response
      // ✅ ALWAYS return 200, even if no roles found
      return NextResponse.json({
        roles: roles,
        success: true,
        message: roles.length === 0 ? 'No roles found' : `Found ${roles.length} roles`
      }, { 
        status: 200,
        headers: {
              'Cache-Control': 'no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
      });

    } catch (error) {
      console.error('❌ Error fetching roles:', error);
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
        

// Handle POST (create new role)
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/roles route hit!"); // ✅ Log that the route was hit to use
  
  try {
    const requiredAction = "add_role"; // Define the required action for this route
    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);
    // ✅ Check if the user has the required permission
    // ✅ Check permission before executing
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    // ✅ Proceed with the request
    const requestData = await req.json();

    // Create new role
    const newRole = new Role({
      name: requestData.name,
      actions: requestData.actions || [],
    });

    await newRole.save();

    return NextResponse.json({
      message: 'Role created successfully',
      role: newRole,
      success: true
    }, { status: 201 });// ✅ Success

  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    return NextResponse.json(
      { error: "Failed to create role", details: error.message },
      { status: 500 }
    );
  }
});