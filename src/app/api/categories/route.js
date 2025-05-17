import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Category from "@/models/category";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all categories)
// routing: /api/categories?locale=en
export const GET = async (req) => {
  console.log("🚀 GET /api/categories?locale=en route hit!"); // ✅ Log that the route was hit
  
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale'); // Get locale from query params
    
  try {
        // Connect to the database
        await connectToDatabase();

        // ✅ Proceed with the request       
        if (!locale) {
          return NextResponse.json({ error: 'Locale is required' }, { status: 400 }); // ❌ Bad request
        }
        const categories = await Category.find(
          {},
          { [`name.${locale}`]: 1, imageUrl: 1 }
        );  
        return NextResponse.json(categories, { status: 200 }); // ✅ Success
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }); // ❌ Server error
    }
};

// Handle POST (Create a new category)
// routing: /api/categories
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/categories route hit!"); // ✅ Log that the route was hit
  
  const requiredAction = "create_category"; // Define the required action for this route
    
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
        let body;
        try {
          body = await req.json();
        } catch (err) {
          return NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 }); // ❌ Bad request
        }

        const { name, imageUrl } = body;
        if (!name?.en || !name?.ar || !imageUrl) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 }); // ❌ Bad request
        }

        const newCategory = new Category({
          name: {
            en: name.en,
            ar: name.ar,
          },
          imageUrl,
        });
        await newCategory.save();

        return NextResponse.json(
          { message: "✅ Category Created Successfully", category: newCategory },
          { status: 201 } // ✅ Created
      );// ✅ Success
    } catch (error) {
        console.error('❌ Error in creating category', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }); // ❌ Server error
    }
});
