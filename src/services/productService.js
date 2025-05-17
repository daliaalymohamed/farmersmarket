import Product from '@/models/product'; // Import the product model

// Fetch a product by ID
export const getProductById = async (id) => {
    try {
        const product = await Product.findById(id); // Fetch product by ID from the database
        return product;
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};