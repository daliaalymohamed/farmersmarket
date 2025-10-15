// (Get, Update, Delete by ID)
import { uploadMiddleware } from '@/middlewares/fileImgUploadMiddleware';
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Category from "@/models/category";
import Product from "@/models/product";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin, deleteFile } from '@/middlewares/backend_helpers';
import { getCategoryById } from '@/services/categoryService';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";
import { generateUniqueSlug } from '@/lib/utils/slugify';

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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

    return NextResponse.json({category, success: true}, { status: 200 }); // ✅ Success
  } catch (error) {
    console.error('❌ Error fetching category:', error);
    return NextResponse.json({message: 'Internal Server Error', success: false}, { status: 500 }); // ❌ Server error
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
          folder: path.join(process.cwd(), 'src', 'app', 'api', 'uploads', 'categories', 'images'),
          isArray: false,
        },
      ]);
      fields = result.fields;
      uploadedFiles = result.uploadedFiles;
      // console.log('📁 Saving image to:', path.join(process.cwd(), 'src', 'app', 'api', 'uploads', 'categories', 'images'));
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
    // Find existing category
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Handle image update
    let newImageFilename = existingCategory.image;
    if (uploadedFiles.image) {
        const oldImagePath = path.resolve(
          __dirname,
          "..",
          "..", // Move up two directories to reach the root of the project
          "uploads", // Root uploads folder
          "categories", // Parent folder
          "images", // Subfolder
          existingCategory.image // Use the filename stored in the database
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

    // If name.en is being updated, generate a new unique slug
    let newSlug = existingCategory.slug; // Keep existing by default
    
    if (name.en) {
      // Name is being updated, generate new slug
      newSlug = await generateUniqueSlug(Category, name.en, id);
    }

    // Build update data
    const updateData = {
      ...(Object.keys(name).length > 0 && { name }),
      ...(fields.color && { color: fields.color }),
      ...(newImageFilename && { image: newImageFilename }),
      // Always include slug (it will be the old one if name didn't change)
      slug: newSlug,  
    };
    console.log('Update Data:', updateData); // Debug log

    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Category has been updated successfully',
      category: updatedCategory
    }, { status: 200 }); // ✅ Success

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

    // Delete the image from the file system
    const { image } = deletedCategory;

    // Construct the full file path
    const filePath = path.resolve(
      __dirname,
      "..",
      "..", // Move up two directories to reach the root of the project
      "uploads", // Root uploads folder
      "categories", // Parent folder
      "images", // Subfolder
      image // Use the filename stored in the database
    );

    // Delete the associated file
    try {
      await deleteFile(filePath);
    } catch (deleteError) {
      console.error(`Error deleting file ${filePath}:`, deleteError);
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
