import Product from '@/models/product'; // Import the product model
import mongoose from 'mongoose';

// Fetch a product by ID
export const getProductById = async (id) => {
    // 🛡️ OPTIONAL: Ignore source map requests in development
    if (id.endsWith('.map')) {
        return new Response(null, { status: 204 });
    }

    // 🛡️ Validate ID format before calling the service
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return new Response(JSON.stringify({ error: 'Invalid product ID format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        const product = await Product.findById(id)
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
            }
        ]);
        return product;
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};