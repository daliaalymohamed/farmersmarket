// This is server-side code for a Next.js page that fetches vendors data { getVendors } from '@/app/actions/vendors/serverVendorsData';
import { getVendors } from '@/app/actions/vendors/serverVendorsData';
import VendorsList from './vendorsList';
import Error from '@/components/UI/error';

// ✅ Add generateMetadata here
export const generateMetadata = async ({ searchParams }) => {
  const { search } = await searchParams || {};
  return {
    title: search ? `Vendors: ${search}` : 'All Vendors',
    description: `Browse ${search ? `vendors matching "${search}"` : 'all vendors'}`
  };
}

const VendorsPage = async ({ searchParams }) => {
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { page, limit, search } = await searchParams || {};

  const initialFilters = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 3,
    search: search || '',
  };

  // Validate numbers
  if (isNaN(initialFilters.page)) initialFilters.page = 1;
  if (isNaN(initialFilters.limit)) initialFilters.limit = 3;
  try {
      
      // Get vendors data
      const vendors = await getVendors(initialFilters);
      if (!vendors.vendorSuccess) {
            return <Error error={'Failed to load vendors data.'} />;
      }
      return <VendorsList initialData={vendors} initialFilters={initialFilters} />;
    } catch (error) {
      console.error('Error loading vendors:', error);
      throw error; // This will be caught by the error.js boundary
    }
}
export default VendorsPage