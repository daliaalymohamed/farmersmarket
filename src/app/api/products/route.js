import { uploadMiddleware } from '@/middlewares/fileImgUploadMiddleware';
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Product from "@/models/product";
import Category from "@/models/category";
import Vendor from "@/models/vendor";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";
// for syncing with MeiliSearch to push new/updated products to the search index
import client from '@/lib/utils/meiliSearchClient'; 
import { searchIndex } from '@/lib/utils/meiliSearchClient';

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Handle GET (Fetch all products with category details)
// routing: /api/products
export const GET = async (req) => {
    console.log("🚀 GET /api/products?page=1&limit=3&search={}&status=all&category=all route hit!"); // ✅ Log that the route was hit
    
    try {
          // Connect to the database
          await connectToDatabase();
  
          const { searchParams } = new URL(req.url);
          
          // Pagination
          const page = Math.max(parseInt(searchParams.get("page")) || 1, 1);
          const limit = Math.min(parseInt(searchParams.get("limit")) || 3, 50); // max 50 per page
          // Build query dynamically
          const query = {};
          const sort = { createdAt: -1,  _id: -1 }; // Newest first
  
          // 1. Search by name filter
          const search = searchParams.get("search");
          if (search) {
              query.$or = [
                { "name.en": { $regex: search, $options: 'i' } },
                { "name.ar": { $regex: search, $options: 'i' } }
            ];
          }

          // 2. Category filter
          const category = searchParams.get("category");
          if (category && category !== "all") {
              const categoryObj = await Category.findById(category);
              if (categoryObj) {
                  query.categoryId = categoryObj._id; // Use the actual ObjectId
                } else {
                  // If no category found, return empty result
                  return NextResponse.json({
                      products: [],
                      pagination: {
                          total: 0,
                          page,
                          limit,
                          totalPages: 0,
                          hasNextPage: false,
                          hasPrevPage: false
                      },
                      stats: {
                          total: 0,
                          active: 0,
                          inactive: 0,
                          lowStock: 0,
                          totalValue: 0
                      }
                  }, { status: 200, headers: {
                      'Cache-Control': 'no-store, must-revalidate',
                      'Pragma': 'no-cache',
                      'Expires': '0'
                  } });
              }
          }

          // 3. Status filter
          const status = searchParams.get("status");
          if (status === "active") query.isActive = true;
          else if (status === "inactive") query.isActive = false;
  
          // Other filters
          // You can add more filters here as needed, e.g., price range, stock status, etc.
          

          // Fetch total count
          const total = await Product.countDocuments(query);
          const totalPages = Math.ceil(total / limit);
          // Fetch users
          const products = await Product.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate([
              {
                path: "categoryId",
                model: "Category"
              },
              {
                path: "createdBy",
                model: "User"
              },
              {
                path: "updatedBy",
                model: "User"
              },
              {
                path: "vendorId",
                model: "Vendor"
              }
            ]);
         
          // Get stats using filtered aggregation
          const [statsResult] = await Product.aggregate([
            {
              $facet: {
                totalCount: [{ $count: "count" }],
                active: [{ $match: { isActive: true } }, { $count: "count" }],
                inactive: [{ $match: { isActive: false } }, { $count: "count" }],
                lowStock: [{ $match: { stock: { $gt: 0, $lt: 10 } } }, { $count: "count" }],
                totalValue: [
                  { $addFields: { value: { $multiply: ["$price", "$stock"] } } },
                  { $group: { _id: null, total: { $sum: "$value" } } }
                ]
              }
            }
          ]);

          const stats = {
            total: statsResult.totalCount[0]?.count || 0,
            active: statsResult.active[0]?.count || 0,
            inactive: statsResult.inactive[0]?.count || 0,
            lowStock: statsResult.lowStock[0]?.count || 0,
            totalValue: statsResult.totalValue[0]?.total || 0
          };

          // Return response
          return NextResponse.json({
              products,
              pagination: {
                  total,
                  page,
                  limit,
                  totalPages,
                  hasNextPage: page < totalPages,
                  hasPrevPage: page > 1
              },
              stats,
              prodSuccess: true
          }, { status: 200, headers: {
                  'Cache-Control': 'no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              } });
  
      } catch (error) {
          console.error('❌ Error fetching products:', error);
          return NextResponse.json({ message: "Internal Server Error", prodSuccess: false }, { status: 500,
              headers: {
                  'Cache-Control': 'no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
              }
            });
      }
}

// Handle POST (Create a new product)
// routing: /api/products
export const POST = authMiddleware(async (req) => {
  console.log("🚀 POST /api/products route hit!"); // ✅ Log that the route was hit
  
  const requiredAction = "add_product"; // Define the required action for this route
  
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

      // ✅ ALWAYS set createdBy for any create operation
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
        fields = {
          'name.en': body.name?.en,
          'name.ar': body.name?.ar,
          'description.en': body.description?.en,
          'description.ar': body.description?.ar,
          price: body.price,
          categoryId: body.categoryId,
          stock: body.stock,
          vendorId: body.vendorId,
          isActive: body.isActive,
          isFeatured: body.isFeatured,
          isOnSale: body.isOnSale,
          salePrice: body.salePrice,
          saleStart: body.saleStart ? new Date(body.saleStart) : undefined,
          saleEnd: body.saleEnd ? new Date(body.saleEnd) : undefined,
          tags: body.tags, // Will parse below
          image: body.image, // Only used if not uploading file
        };
      }

      // ✅ Validate required fields
      if (!fields['name.en'] || !fields['name.ar']) {
        return NextResponse.json(
          { error: "Product name in both English and Arabic is required" },
          { status: 400 }
        );
      }
      if (!fields.price || isNaN(Number(fields.price)) || Number(fields.price) < 0) {
        return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
      }
      if (!fields.categoryId) {
        return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
      }

      // Check if category exists
      const categoryExists = await Category.findById(fields.categoryId);
      if (!categoryExists) {
        return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
      }

      if (!fields.vendorId) {
        return NextResponse.json({ error: "Vendor Id is required" }, { status: 400 })
      }

      // Check if vendor exists
      const vendorExists = await Vendor.findById(fields.vendorId);
      if (!vendorExists) {
        return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
      }

      // Parse isOnSale as boolean
      const isOnSale = ['true', '1', true, 'on'].includes(String(fields.isOnSale).toLowerCase());

      // Parse tags if string
      let tags = [];
      if (fields.tags) {
        try {
          tags = typeof fields.tags === 'string' ? JSON.parse(fields.tags) : fields.tags;
          if (!Array.isArray(tags)) tags = [];
        } catch (e) {
          tags = [];
        }
      }

      // Build name object
      const name = {};
      if (fields['name.en']) name.en = fields['name.en'];
      if (fields['name.ar']) name.ar = fields['name.ar'];
  
      // Build description object
      const description = {};
      if (fields['description.en']) description.en = fields['description.en'];
      if (fields['description.ar']) description.ar = fields['description.ar'];
  
      // Validate dates
      // Parse dates only if on sale
      let saleStart = null;
      let saleEnd = null;

      if (isOnSale) {
        saleStart = fields.saleStart ? new Date(fields.saleStart) : null;
        saleEnd = fields.saleEnd ? new Date(fields.saleEnd) : null;

      if (!saleStart || isNaN(saleStart.getTime())) {
        return NextResponse.json(
          { error: "Valid sale start date is required when on sale" },
          { status: 400 }
        );
      }
      if (!saleEnd || isNaN(saleEnd.getTime())) {
        return NextResponse.json(
          { error: "Valid sale end date is required when on sale" },
          { status: 400 }
        );
      }
      if (saleStart > saleEnd) {
        return NextResponse.json(
          { error: "Sale start date must be before end date" },
          { status: 400 }
        );
      }
    }

      // Use uploaded file if exists, otherwise fallback to provided image (if any)
      const image = uploadedFiles.image || fields.image || null;

      // ✅ Proceed with the request
      // Build created data
      const createdData = {
        name,
        description,
        price: Number(fields.price),
        categoryId: fields.categoryId,
        stock: Number(fields.stock) || 0,
        vendorId: fields.vendorId,
        isActive: fields.isActive !== undefined ? fields.isActive : true,
        isFeatured: fields.isFeatured || false,
        isOnSale: isOnSale,
        salePrice: isOnSale && fields.salePrice ? Number(fields.salePrice) : undefined,
        saleStart: isOnSale ? saleStart : undefined,
        saleEnd: isOnSale ? saleEnd : undefined,
        tags,
        image,
        createdBy: userId,
        updatedBy: userId,
      };

      const newProduct = new Product(createdData);
      await newProduct.save();

      // ✅ Populate references before returning
      const populatedProduct = await Product.populate(newProduct, [
        { path: 'categoryId' },
        { path: 'updatedBy' },
        { path: 'createdBy' },
        { path: 'vendorId' }
      ]);

      // 🔁 REAL-TIME SEARCH INDEXING
      try {
        const searchable = populatedProduct.toSearchable();
        await client.index(searchIndex.ALL).addDocuments([searchable]);
        console.log(`✅ Indexed product: ${searchable.name_en}`);
      } catch (err) {
        console.warn('❌ Search sync failed:', err.message);
        // Continue — don't block success
      }

      return NextResponse.json(
        {
          message: 'Product created successfully',
          product: populatedProduct,
        },
        { status: 201 }
      );// ✅ Success
  
  } catch (error) {
      console.error("❌ Full server error:", error); // 👈 Full error stack
      return NextResponse.json(
        { error: "Failed to update product", details: error.message },
        { status: 500 }
      );
  }
});

// Handle PATCH (toggle product or products to together)
// routing: /api/products
export const PATCH = authMiddleware(async (req) => {
  console.log("🚀 PATCH /api/products route hit!"); // ✅ Log that the route was hit

  try {
    const requiredAction = "bulk_toggle_product_status"; // Define the required action for this route
    
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
    
    const { productIds, isActive } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Valid productIds array is required' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Active status must be boolean' },
        { status: 400 }
      );
    }

    // Update all products
    const updatedProducts = await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        isActive,
        updatedBy: userId
      }
    );

    if (updatedProducts.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No products found to update' },
        { status: 404 }
      );
    }
    
    // Fetch updated products with populated createdBy/updatedBy
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    return NextResponse.json({
      message: `Updated ${products.length} products`,
      products
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to update products' },
      { status: 500 }
    );
  }
});