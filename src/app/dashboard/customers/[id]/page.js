// This is server-side code for a Next.js page that fetches customer data based on the provided ID.import { getCustomerById } from '@/app/actions/users/serverUserByIdData';
import { getCustomerById } from '@/app/actions/users/serverUserByIdData';
import CustomerProfile from './customerProfile';

const CustomerPage = async ({ params }) => {
  const { id } = await params;
  try {
    const customer = await getCustomerById(id);


    return <CustomerProfile initialData={customer} />;
  } catch (error) {
    console.error('Error loading customer:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default CustomerPage