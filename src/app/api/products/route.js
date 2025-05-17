import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/utils/dbConnection";
import Product from "@/models/product";
import Category from "@/models/category";
import checkPermission from '@/middlewares/backend_checkPermissionMiddleware';
import { authMiddleware } from '@/middlewares/backend_authMiddleware';
import { ensureActionExistsAndAssignToAdmin } from '@/middlewares/backend_helpers';


// Handle GET (Fetch all products with category details)
// routing: /api/products?locale=en
export const GET = async (req) => {
    console.log("🚀 GET /api/products?locale=en route hit!"); // ✅ Log that the route was hit
    
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale'); // Get locale from query params
      
    try {
          // Connect to the database
          await connectToDatabase();
  
          // ✅ Proceed with the request       
          if (!locale) {
            return NextResponse.json({ error: 'Locale is required' }, { status: 400 }); // ❌ Bad request
          }
          const products = await Product.find(
            {},
            { [`name.${locale}`]: 1, [`description.${locale}`]: 1, price: 1, categoryId: 1, stock: 1, imageUrl: 1 }
          );  
          return NextResponse.json(products, { status: 200 }); // ✅ Success
      } catch (error) {
          console.error('❌ Error fetching products:', error);
          return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }); // ❌ Server error
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
        
        // ✅ Proceed with the request       
        let body;
        try {
          body = await req.json();
        } catch (err) {
          return NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 }); // ❌ Bad request
        }

        const { name, description, price, categoryId, imageUrl, stock } = body;
        if (!name?.en || !name?.ar || !description?.en || !description?.ar || !price || !categoryId || !imageUrl) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 }); // ❌ Bad request
        }

        // Check if the provided category exists
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
          return NextResponse.json({ error: "Invalid category ID" }, { status: 400 }); // ❌ Bad request
        }
        const newProduct = new Product({
          name,
          description,
          price,
          categoryId,
          imageUrl,
          stock
        });
        await newProduct.save();

        return NextResponse.json(
          { message: "✅ Product Created Successfully", product: newProduct },
          { status: 201 } // ✅ Created
      );// ✅ Success
    } catch (error) {
        console.error('❌ Error in creating product', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }); // ❌ Server error
    }
});
