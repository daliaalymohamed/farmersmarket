import Category from '@/models/category'; // Import the Category model

// Fetch a category by ID
export const getCategoryById = async (id) => {
    try {
        const category = await Category.findById(id); // Fetch category by ID from the database
        return category;
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};