import { uploadMiddleware } from '@/middlewares/fileImgUploadMiddleware';
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Category from "@/models/category";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';

// Handle GET (Fetch all categories)
// routing: /api/categories?locale=en
export const GET = async (req) => {
  console.log("🚀 GET /api/categories route hit!"); // ✅ Log that the route was hit
  
  try {
        // Connect to the database
        await connectToDatabase();

        // ✅ Proceed with the request       
        const categories = await Category.find();  
        return NextResponse.json(categories, { status: 200 }); // ✅ Success
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }); // ❌ Server error
    }
};

// Handle POST (Create a new category)
// routing: /api/categories
export const POST = authMiddleware(async (req, context) => {
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

    // Check Content-Type to determine how to parse the request
    const contentType = req.headers.get('content-type') || '';
    let fields = {};
    let uploadedFiles = {};

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload case
      // console.log("📁 Processing multipart/form-data (file upload)");
      const result = await uploadMiddleware(req, [
        {
          fieldName: "image",
          category: "images",
          folder: "public/uploads/categories/images",
          isArray: false,
        },
      ]);
      fields = result.fields;
      uploadedFiles = result.uploadedFiles;
    } else {
      // Handle JSON case (no file upload)
      // console.log("📄 Processing JSON data (no file upload)");
      let body;
      try {
        body = await req.json();
      } catch (err) {
        return NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 }); // ❌ Bad request
      }
      
      // Map JSON structure to fields format
      if (body.name) {
        if (body.name.en) fields['name.en'] = body.name.en;
        if (body.name.ar) fields['name.ar'] = body.name.ar;
      }
      if (body.color) fields.color = body.color;
      
      // No uploaded files in JSON case
      uploadedFiles = {};
    }

    // Build name object
    const name = {};
    if (fields['name.en']) name.en = fields['name.en'];
    if (fields['name.ar']) name.ar = fields['name.ar'];

    // ✅ Validate required fields for creation
    if (Object.keys(name).length === 0) {
      return NextResponse.json(
        { error: "Category name is required (at least one language)" }, 
        { status: 400 }
      );
    }

    // ✅ Proceed with the request
    // Extract values for cleaner code
    const image = uploadedFiles.image || null;
    const color = fields.color || null;

    const newCategory = new Category({
      name: {
        en: name.en,
        ar: name.ar,
      },
      image,
      color
    });
    await newCategory.save();
    
    return NextResponse.json({
      message: 'Category has been created successfully', 
      category: newCategory
    }, { status: 201 }); // ✅ Created
    
  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    
    // Handle duplicate key error (if category name must be unique)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Category with this name already exists", details: error.message },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create category", details: error.message },
      { status: 500 }
    );
  }
});