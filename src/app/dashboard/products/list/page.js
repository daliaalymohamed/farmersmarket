// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/lib/services/serverServices/users/serverUserData';
import { getProducts } from '@/app/actions/products/serverProductsData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import ProductsList from './productsList';

const ProductsPage = async ({ searchParams }) => {
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { page, limit, search, status, category } = await searchParams || {};

  const initialFilters = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 3,
    search: search || '',
    status: status ? status.toLowerCase() : 'all', // Default to 'all' if not provided
    category: category || 'all', // Default to 'all' if not provided
  };

  // Validate numbers
  if (isNaN(initialFilters.page)) initialFilters.page = 1;
  if (isNaN(initialFilters.limit)) initialFilters.limit = 3;

  try {
      // Get products with initial filters
      const products = await getProducts(initialFilters);
      const categories = await getCategories(initialFilters);
      
      if (!products || !categories) {
        notFound();
      }
  
      return <ProductsList 
        initialData={products} 
        initialFilters={initialFilters} 
        initialCategories={categories}/>;
  } catch (error) {
      console.error('Error loading products or categories', error);
      throw error;
  }
}
export default ProductsPage