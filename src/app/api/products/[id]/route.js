// (Get, Update, Delete by ID)
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Product from "@/models/product";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import { getProductById } from '@/services/productService';

// Handle GET (Fetch product by ID)
// routing: /api/products/[id]
export const GET = async (req, {params}) => {
  console.log("🚀 GET /api/products/:id route hit!"); // ✅ Log that the route was hit
  const { id } = params;

  try {
    // Connect to the database
    await connectToDatabase();

    // ✅ Proceed with the request
    // Fetch the category by ID
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json('Product not found', { status: 404 }); // ❌ Not found
    }

    return NextResponse.json(product, { status: 200 }); // ✅ Success
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    return NextResponse.json({message: 'Internal Server Error'}, { status: 500 }); // ❌ Server error
  }
};

// Handle PUT (Update product by ID)
// routing: /api/products/[id]
export const PUT = authMiddleware(async (req, {params}) => {
  console.log("🚀 PUT /api/products/:id route hit!"); // ✅ Log that the route was hit
  const { id } = params;
  const requiredAction = "edit_product"; // Define the required action for this route

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
    const productData = await req.json(); // Assuming the request body contains the updated user data
    const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true });
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 }); // ❌ Not found
    }
    return NextResponse.json({message: 'Product has been updated successfully', product: updatedProduct}, { status: 200 }); // ✅ Success
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 }); // ❌ Server error
  }
 });

// Handle DELETE (Delete product by ID)
// routing: /api/products/[id]
export const DELETE = authMiddleware(async (req, {params}) => {
  console.log("🚀 DELETE /api/products/:id route hit!"); // ✅ Log that the route was hit
  const { id } = params;
  const requiredAction = "delete_product"; // Define the required action for this route

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
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return NextResponse.json({ error: "Product Not Found" }, { status: 404 });
    } 
    return NextResponse.json({
      message: "✅ Product has been deleted successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
});