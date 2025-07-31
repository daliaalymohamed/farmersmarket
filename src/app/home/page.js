// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/lib/services/serverServices/users/serverUserData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import Home from './home';
import { notFound } from 'next/navigation';

const HomePage = async ({searchParams}) => {
  
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { search } = await searchParams || {};
  const initialFilters = {
    search: search || '',
  };
  try {
    const categories = await getCategories(initialFilters);
    
    if (!categories) {
      notFound();
    }

    return <Home categories={categories} />;
  } catch (error) {
    console.error('Error loading Data:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default HomePage