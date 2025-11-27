// This is server-side code for a Next.js page that fetches shipping zones data.import { getShippingZones } from '@actions/shippingZones/serverShippingZonesData';
import { getShippingZones } from '@/app/actions/shippingZones/serverShippingZonesData';
import ShippingZonesList from './shippingZonesList';
import Error from '@/components/UI/error';

// ✅ Add generateMetadata here
export const generateMetadata = async ({ searchParams }) => {
  const { search } = await searchParams || {};
  return {
    title: search ? `Zones: ${search}` : 'All Shipping Zones',
    description: `Browse ${search ? `zones matching "${search}"` : 'all zones'}`
  };
}

const ShippingZonesPage = async ({ searchParams }) => {
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { page, limit, search, status } = await searchParams || {};

  const initialFilters = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 3,
    search: search || '',
    status: status ? status.toLowerCase() : 'all', // Default to 'all' if not provided
  };

  // Validate numbers
  if (isNaN(initialFilters.page)) initialFilters.page = 1;
  if (isNaN(initialFilters.limit)) initialFilters.limit = 3;
  try {
      
      // Get zones data
      const shippingZones = await getShippingZones(initialFilters);
      
      if (!shippingZones.success) {
            return <Error error={result.error || 'Failed to load zones data.'} />;
      }
      
      return <ShippingZonesList initialData={shippingZones} initialFilters={initialFilters} />;
    } catch (error) {
      console.error('Error loading zones:', error);
      throw error; // This will be caught by the error.js boundary
    }
}
export default ShippingZonesPage