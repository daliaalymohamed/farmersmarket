// (Get, Update, Delete by ID)
import { uploadMiddleware } from '@/middlewares/fileImgUploadMiddleware';
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Product from "@/models/product";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import { getProductById } from '@/services/productService';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle GET (Fetch product by ID)
// routing: /api/products/[id]
export const GET = async (req, context) => {
  console.log("🚀 GET /api/products/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
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
export const PUT = authMiddleware(async (req, context) => {
  console.log("🚀 PUT /api/products/:id route hit!"); // ✅ Log that the route was hit
  const params = await context.params;
  const id = params.id;
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
    
    const currentUser = req.user; // Get the current user from the request
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ❌ Unauthorized
    }

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
          folder: path.join(process.cwd(), 'src', 'app', 'api', 'uploads', 'products', 'images'),
          isArray: false,
        },
      ]);
      fields = result.fields;
      uploadedFiles = result.uploadedFiles;
      console.log('📁 Saving image to:', path.join(process.cwd(), 'src', 'app', 'api', 'uploads', 'products', 'images'));
    } else {
      // Handle JSON case (no file upload)
      // console.log("📄 Processing JSON data (no file upload)");
      const body = await req.json();
      
      // Map JSON structure to fields format
      if (body.name) {
        if (body.name.en) fields['name.en'] = body.name.en;
        if (body.name.ar) fields['name.ar'] = body.name.ar;
      }
      if (body.description) {
        if (body.description.en) fields['description.en'] = body.description.en;
        if (body.description.ar) fields['description.ar'] = body.description.ar;
      }
      if (body.price) fields.price = body.price;
      if (body.categoryId) fields.categoryId = body.categoryId;
      if (body.stock) fields.stock = body.stock;
      if (body.vendorId) fields.vendorId = body.vendorId;
      if (body.isActive !== undefined) fields.isActive = body.isActive; // Optional
      if (body.isFeatured !== undefined) fields.isFeatured = body.isFeatured; // Optional
      if (body.isOnSale !== undefined) fields.isOnSale = body.isOnSale; // Optional
      if (body.salePrice) fields.salePrice = body.salePrice; // Optional discounted price
      if (body.saleStart) fields.saleStart = new Date(body.saleStart); // Optional sale start date
      if (body.saleEnd) fields.saleEnd = new Date(body.saleEnd); // Optional sale end date
      if (body.tags) fields.tags = body.tags; // Optional tags
      // No uploaded files in JSON case
      uploadedFiles = {};
    }

    // ✅ ALWAYS set updatedBy for any update operation
    // Check different possible properties for the user ID
    let userId = null;
    if (currentUser.userId && currentUser.userId !== "null") {
      userId = currentUser.userId;
    } else if (currentUser._id && currentUser._id !== "null") {
      userId = currentUser._id;
    } else if (currentUser.id && currentUser.id !== "null") {
      userId = currentUser.id;
    }

    if (userId) {
      fields.updatedBy = userId;
      console.log("✅ Setting updatedBy to:", userId);
    } else {
      console.warn("⚠️ Could not determine user ID for updatedBy field");
      console.log("Available currentUser properties:", Object.keys(currentUser));
    }

    // Build name object
    const name = {};
    if (fields['name.en']) name.en = fields['name.en'];
    if (fields['name.ar']) name.ar = fields['name.ar'];

    // Build description object
    const description = {};
    if (fields['description.en']) description.en = fields['description.en'];
    if (fields['description.ar']) description.ar = fields['description.ar'];

    // ✅ Proceed with the request
    // Find existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Handle image update
    let newImageFilename = existingProduct.image;
    if (uploadedFiles.image) {
        const oldImagePath = path.resolve(
          __dirname,
          "..",
          "..", // Move up two directories to reach the root of the project
          "uploads", // Root uploads folder
          "products", // Parent folder
          "images", // Subfolder
          existingProduct.image // Use the filename stored in the database
        );

        // Delete old image if it exists
        try {
          await fs.access(oldImagePath); // Check if file exists
          await fs.unlink(oldImagePath); // Delete it
          // console.log(`🗑️ Old image deleted: ${oldImagePath}`);
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.warn(`Old image does not exist: ${oldImagePath}`);
          } else {
            console.error(`❌ Error deleting old image:`, err);
          }
        }

        newImageFilename = uploadedFiles.image; // Use new uploaded image
    }

    // Build update data
    const updateData = {
      ...(Object.keys(name).length > 0 && { name }),
      ...(Object.keys(description).length > 0 && { description }),
      ...(fields.price && { price: fields.price }),
      ...(fields.categoryId && { categoryId: fields.categoryId }),
      ...(fields.stock && { stock: fields.stock }),
      ...(fields.vendorId && { vendorId: fields.vendorId }),
      ...(fields.isActive !== undefined && { isActive: fields.isActive }),
      ...(fields.isFeatured !== undefined && { isFeatured: fields.isFeatured }),
      ...(fields.isOnSale !== undefined && { isOnSale: fields.isOnSale }),
      ...(fields.salePrice && { salePrice: fields.salePrice }),
      ...(fields.saleStart && { saleStart: fields.saleStart }),
      ...(fields.saleEnd && { saleEnd: fields.saleEnd }),
      ...(fields.tags && { tags: fields.tags }),
      ...(newImageFilename && { image: newImageFilename }),
      // ✅ Only include updatedBy if we have a valid user ID
      ...(fields.updatedBy && { updatedBy: fields.updatedBy }),
    };

    // Update the category
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ✅ Populate related documents
    const populatedProduct = await Product.populate(updatedProduct, [
      { path: 'categoryId' },
      { path: 'createdBy' },
      { path: 'updatedBy' },
      { path: 'vendorId' }
    ]);

    // Now return fully populated product
    return NextResponse.json({
      message: 'Product has been updated successfully',
      product: populatedProduct // ✅ Now includes full objects
    }, { status: 200 });// ✅ Success

  } catch (error) {
    console.error("❌ Full server error:", error); // 👈 Full error stack
    return NextResponse.json(
      { error: "Failed to update product", details: error.message },
      { status: 500 }
    );
  }
});


// Handle PATCH (activate or deactivate product by ID)
// The PATCH method is used for partial updates, which is appropriate for activating/deactivating a product.
// routing: /api/products/[id]
export const PATCH = authMiddleware(async (req, context) => {
  console.log("🚀 PATCH /api/products/:id route hit!"); // ✅ Log that the route was hit
  
  try {
    // Get params asynchronously
    const params = await context.params;
    
    // Validate ID parameter
    if (!params?.id) {
      return NextResponse.json({ 
        error: 'Missing product ID parameter' 
      }, { status: 400 });
    }

    const id = params.id;
    const requiredAction = "toggle_product_status"; // Define the required action for this route
    
    // Connect to the database
    await connectToDatabase();

    // Ensure the required action exists and is assigned to the admin role
    await ensureActionExistsAndAssignToAdmin(requiredAction);

    // ✅ Check if the user has the required permission
    const permissionCheck = await checkPermission(requiredAction)(req);
    if (permissionCheck) return permissionCheck; // ❌ If unauthorized, return response

    const currentUser = req.user; // Get the current user from the request
    if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // ❌ Unauthorized
    }

    // Check different possible properties for the user ID
    // Extract user ID safely
    let userId = null;
    if (currentUser.userId && currentUser.userId !== "null") {
      userId = currentUser.userId;
    } else if (currentUser._id && currentUser._id !== "null") {
      userId = currentUser._id;
    } else if (currentUser.id && currentUser.id !== "null") {
      userId = currentUser.id;
    }

    if (!userId) {
      console.warn("⚠️ Could not determine user ID for createdBy");
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    // ✅ Proceed with the request
    const { isActive } = await req.json(); // Assuming the request body contains the updated active status
    // Validate that `isActive` is a boolean
    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid 'isActive' value. Must be true or false boolean values" },
        { status: 400 }
      ); // ❌ Bad request
    }

    // Update the product's active status
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive, updatedBy: userId },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 }); // ❌ Not found
    }

    const message = isActive
      ? "Product has been activated successfully"
      : "Product has been deactivated successfully";

    // ✅ Populate related documents
    const populatedProduct = await Product.populate(updatedProduct, [
      { path: 'createdBy' },
      { path: 'updatedBy' },
    ]);

    // Now return fully populated product
    return NextResponse.json({
      message,
      product: populatedProduct // ✅ Now includes full objects
    }, { status: 200 });// ✅ Success
  } catch (error) {
    console.error("❌ Error toggling product status:", error);
    return NextResponse.json({ error: "Failed to toggle product status" }, { status: 500 }); // ❌ Server error
  }
});