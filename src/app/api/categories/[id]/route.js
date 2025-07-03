// (Get, Update, Delete by ID)
import { uploadMiddleware } from '@/middlewares/fileImgUploadMiddleware';
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Category from "@/models/category";
import Product from "@/models/product";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import { getCategoryById } from '@/services/categoryService';

// Handle GET (Fetch category by ID)
// routing: /api/categories/[id]
export const GET = async (req, context) => {
  console.log("🚀 GET /api/categories/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;

  try {
    // Connect to the database
    await connectToDatabase();

    // ✅ Proceed with the request
    // Fetch the category by ID
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json('Category not found', { status: 404 }); // ❌ Not found
    }

    return NextResponse.json(category, { status: 200 }); // ✅ Success
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    return NextResponse.json({message: 'Internal Server Error'}, { status: 500 }); // ❌ Server error
  }
};

// Handle PUT (Update category by ID)
// routing: /api/categories/[id]
export const PUT = authMiddleware(async (req, context) => {
  console.log("🚀 PUT /api/categories/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
  const requiredAction = "edit_category"; // Define the required action for this route
  
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
      const body = await req.json();
      
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

    // ✅ Proceed with the request
    // Only update what was sent
    const updateData = {
      ...(Object.keys(name).length > 0 && { name }),
      ...(fields.color && { color: fields.color }),
      ...(uploadedFiles.image && { image: uploadedFiles.image }),
    };

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      upsert: true // This will create the nested object if it doesn't exist
    });
    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 }); // ❌ Not found
    }
    return NextResponse.json({message: 'Category has been updated successfully', category: updatedCategory}, { status: 200 }); // ✅ Success
  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    return NextResponse.json(
      { error: "Failed to update category", details: error.message },
      { status: 500 }
    );
  }
 });

// Handle DELETE (Delete category by ID)
// routing: /api/categories/[id]
export const DELETE = authMiddleware(async (req, context) => {
  console.log("🚀 DELETE /api/categories/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
  const requiredAction = "delete_category"; // Define the required action for this route

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
    // 1. Delete the category
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return NextResponse.json({ error: "Category Not Found" }, { status: 404 });
    } 
    // 2. Delete related products
    const deletedProducts = await Product.deleteMany({ categoryId: id });

    return NextResponse.json({
      message: "✅ Category and related products deleted successfully",
      deletedProductsCount: deletedProducts.deletedCount,
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting category and products:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
});
