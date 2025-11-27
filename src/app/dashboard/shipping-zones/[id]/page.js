// This is server-side code for a Next.js page that fetches shipping zone data based on the provided ID.import { getShippingZoneById } from '@/app/actions/shippingZones/serverShippingZoneByIdData';
import { getShippingZoneById } from '@/app/actions/shippingZones/serverShippingZoneByIdData';
import ShippingZone from './shippingZone';
import Error from '@/components/UI/error';

const ShippingZonePage = async ({ params }) => {
  const { id } = await params;

  try {
    const zoneResult = await getShippingZoneById(id);

    if (!zoneResult.success) {
        return <Error error={result.error || 'Failed to load zone data.'} />;
    }
    
    if (!zoneResult.zone) {
        console.warn("⚠️ No data returned despite success");
        return <Error error="No content available" />;
    }

    const zone = zoneResult.zone;

    return <ShippingZone initialData={zone} />;
  } catch (error) {
    console.error('Error loading zone:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default ShippingZonePage