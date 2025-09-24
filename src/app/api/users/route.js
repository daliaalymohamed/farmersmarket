import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import User from "@/models/user";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import dayjs from 'dayjs';

// Handle GET (Fetch all users with role details)
// routing: /api/users
export const GET = authMiddleware(async (req) => {
    console.log("🚀 GET /api/users route hit!"); // ✅ Log that the route was hit
    
    try {
        const requiredAction = "view_users"; // Define the required action for this route
        // Connect to the database
        await connectToDatabase();

        // Ensure the required action exists and is assigned to the admin role
        await ensureActionExistsAndAssignToAdmin(requiredAction);
        // ✅ Check if the user has the required permission
        // ✅ Check permission before executing
        const permissionCheck = await checkPermission(requiredAction)(req);
        if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response
        
        const { searchParams } = new URL(req.url);

        // Pagination
        const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
        const limit = Math.min(parseInt(searchParams.get("limit")) || 3, 50); // max 50 per page

        // Build query dynamically
        const query = {};
        const sort = { createdAt: -1 };

        // Status filter
        const status = searchParams.get("status");
        if (status === "active") query.active = true;
        else if (status === "inactive") query.active = false;

        // Date range filter
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = dayjs(startDate).startOf('day').toDate();
                if (!isNaN(start)) query.createdAt.$gte = start;
            }
            if (endDate) {
                const end = dayjs(endDate).endOf('day').toDate();
                if (!isNaN(end)) query.createdAt.$lte = end;
            }
        }

        // Search filter
        const search = searchParams.get("search");
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch total count
        const total = await User.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Fetch users
        const users = await User.find(query, {
            firstName: 1,
            lastName: 1,
            email: 1,
            phoneNumber: 1,
            roleId: 1,
            orders: 1,
            active: 1,
            addresses: 1,
            createdAt: 1
        })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
            path: "roleId",
            populate: {
                path: "actions",
                model: "Action"
            }
        });

        // Return response
        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            success: true
        }, { status: 200, headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            } });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return NextResponse.json({ message: "Internal Server Error", success: false }, { status: 500,
            headers: {
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
         });
    }

});




