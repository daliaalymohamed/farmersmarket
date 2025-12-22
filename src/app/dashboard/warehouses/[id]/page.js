// This is server-side code for a Next.js page that fetches vendor data based on the provided ID.import { getWarehouseById } from '@/app/actions/vendor/serverVendorByIdData';
import { getWarehouseById } from '@/app/actions/warehouses/serverWarehouseByIdData';
import Warehouse from './warehouse';
import Error from '@/components/UI/error';

const WarehousePage = async ({ params }) => {
  const { id } = await params;

  try {
    const warehouseResult = await getWarehouseById(id);

    if (!warehouseResult || !warehouseResult.warehouseSuccess || !warehouseResult.warehouse) {
      return <Error error={warehouseResult.error || 'Failed to load warehouse data.'} />;
    }

    const warehouse = warehouseResult.warehouse;

    return <Warehouse initialData={warehouse} />;
  } catch (error) {
    console.error('Error loading warehouse:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default WarehousePage