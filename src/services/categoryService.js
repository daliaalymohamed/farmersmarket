import Category from '@/models/category'; // Import the Category model
import mongoose from 'mongoose';

// Fetch a category by ID
export const getCategoryById = async (id) => {
    // 🛡️ OPTIONAL: Ignore source map requests in development
    if (id.endsWith('.map')) {
        return new Response(null, { status: 204 });
    }

    // 🛡️ Validate ID format before calling the service
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return new Response(JSON.stringify({ error: 'Invalid category ID format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        const category = await Category.findById(id); // Fetch category by ID from the database
        return category;
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};