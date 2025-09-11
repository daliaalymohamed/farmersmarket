// This is server-side code for a Next.js page that fetches vendor data based on the provided ID.import { getVendorById } from '@/app/actions/vendor/serverVendorByIdData';
import { getVendorById } from '@/app/actions/vendors/serverVendorByIdData';
import Vendor from './vendor';

const VendorPage = async ({ params }) => {
  const { id } = await params;

  try {
    const vendor = await getVendorById(id);
    
    return <Vendor initialData={vendor} />;
  } catch (error) {
    console.error('Error loading vendor:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default VendorPage