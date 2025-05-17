// (Get, Update, Delete by ID)
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
export const GET = async (req, {params}) => {
  console.log("🚀 GET /api/categories/:id route hit!"); // ✅ Log that the route was hit
  const { id } = params;

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
export const PUT = authMiddleware(async (req, {params}) => {
  console.log("🚀 PUT /api/categories/:id route hit!"); // ✅ Log that the route was hit
  const { id } = params;
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
    
    // ✅ Proceed with the request
    const categoryData = await req.json(); // Assuming the request body contains the updated user data
    const updatedCategory = await Category.findByIdAndUpdate(id, categoryData, { new: true });
    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 }); // ❌ Not found
    }
    return NextResponse.json({message: 'Category has been updated successfully', category: updatedCategory}, { status: 200 }); // ✅ Success
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 }); // ❌ Server error
  }
 });

// Handle DELETE (Delete category by ID)
// routing: /api/categories/[id]
export const DELETE = authMiddleware(async (req, {params}) => {
  console.log("🚀 DELETE /api/categories/:id route hit!"); // ✅ Log that the route was hit
  const { id } = params;
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
