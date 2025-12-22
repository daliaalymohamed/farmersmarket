// This is server-side code for a Next.js page that fetches vendor data based on the provided ID.import { getVendorById } from '@/app/actions/vendor/serverVendorByIdData';
import { getVendorById } from '@/app/actions/vendors/serverVendorByIdData';
import Vendor from './vendor';
import Error from '@/components/UI/error';

const VendorPage = async ({ params }) => {
  const { id } = await params;

  try {
    const vendorResult = await getVendorById(id);

    if (!vendorResult || !vendorResult.vendorSuccess || !vendorResult.vendor) {
      return <Error error={vendorResult.error || 'Failed to load vendor data.'} />;
    }

    const vendor = vendorResult.vendor;

    return <Vendor initialData={vendor} />;
  } catch (error) {
    console.error('Error loading vendor:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default VendorPage