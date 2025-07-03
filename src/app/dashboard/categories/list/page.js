// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/lib/services/serverServices/users/serverUserData';
import { getCategories } from '@/lib/services/serverSideServices/categories/serverCategoriesData';
import CategoriesList from './categoriesList';

const CategoriesPage = async () => {
    try {
        
        // Get full profile data
        const categories = await getCategories();
        
        if (!categories) {
          notFound();
        }
    
        return <CategoriesList initialData={categories} />;
      } catch (error) {
        console.error('Error loading categories:', error);
        throw error; // This will be caught by the error.js boundary
      }
}
export default CategoriesPage