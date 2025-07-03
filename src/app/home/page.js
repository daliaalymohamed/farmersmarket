// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/lib/services/serverServices/users/serverUserData';
import { getCategories } from '@/lib/services/serverSideServices/categories/serverCategoriesData';
import Home from './home';
import { notFound } from 'next/navigation';

const HomePage = async () => {
  
  try {
    const categories = await getCategories();
    
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