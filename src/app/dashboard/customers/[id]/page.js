// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/lib/services/serverServices/users/serverUserData';
import { getCustomerById } from '@/lib/services/serverSideServices/users/serverUserByIdData';
import CustomerProfile from './customerProfile';
import { notFound } from 'next/navigation';

const CustomerPage = async ({ params }) => {
  const { id } = await params;
  try {
    const customer = await getCustomerById(id);
    
    if (!customer) {
      notFound();
    }

    return <CustomerProfile initialData={customer} />;
  } catch (error) {
    console.error('Error loading customer:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default CustomerPage