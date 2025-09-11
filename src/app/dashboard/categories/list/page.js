// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/lib/services/serverServices/users/serverUserData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import CategoriesList from './categoriesList';

// ✅ Add generateMetadata here
export const generateMetadata = async ({ searchParams }) => {
  const { search } = await searchParams || {};
  return {
    title: search ? `Categories: ${search}` : 'All Categories',
    description: `Browse ${search ? `categories matching "${search}"` : 'all categories'}`
  };
}

const CategoriesPage = async ({ searchParams }) => {
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { search } = await searchParams || {};
  const initialFilters = {
    search: search || '',
  };
  try {
      
      // Get categories data
      const categories = await getCategories(initialFilters);
    
      return <CategoriesList initialData={categories} initialFilters={initialFilters} />;
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error; // This will be caught by the error.js boundary
    }
}
export default CategoriesPage