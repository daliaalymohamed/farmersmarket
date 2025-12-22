import { getWarehouses } from '@/app/actions/warehouses/serverWarehousesData';
import WarehousesList from './warehousesList';
import Error from '@/components/UI/error';

export const generateMetadata = async ({ searchParams }) => {
  const { search } = await searchParams || {};
  return {
    title: search ? `Warehouses: ${search}` : 'All Warehouses',
    description: `Browse ${search ? `warehouses matching "${search}"` : 'all warehouses'}`
  };
}

const WarehousesPage = async ({ searchParams }) => {
  const { page, limit, search } = await searchParams || {};

  const initialFilters = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 3,
    search: search || '',
  };

  if (isNaN(initialFilters.page)) initialFilters.page = 1;
  if (isNaN(initialFilters.limit)) initialFilters.limit = 3;

  try {
    const warehouses = await getWarehouses(initialFilters);    
  
    if (!warehouses.warehouseSuccess) {
          return <Error error={'Failed to load warehouses data.'} />;
    }
    
    return <WarehousesList initialFilters={initialFilters} />;
  } catch (error) {
    console.error('Error loading warehouses:', error);
    throw error;
  }
}

export default WarehousesPage;
