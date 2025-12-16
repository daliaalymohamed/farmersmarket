// This is server-side code for a Next.js page that fetches roles data.import { getRoles } from '@/app/actions/roles/serverRolesData';
import { getRoles } from '@/app/actions/roles/serverRolesData';
import RolesList from './rolesList';
import Error from '@/components/UI/error';

// ✅ Add generateMetadata here
export const generateMetadata = async ({ searchParams }) => {
  const { search } = await searchParams || {};
  return {
    title: search ? `Roles: ${search}` : 'All Roles',
    description: `Browse ${search ? `roles matching "${search}"` : 'all roles'}`
  };
}

const RolesPage = async ({ searchParams }) => {
  // Get initial filters from URL search params
  // First extract and convert all searchParams safely
  // Safely extract and convert searchParams with defaults
  const { search } = await searchParams || {};
  const initialFilters = {
    search: search || '',
  };
  try {
      
      // Get roles data
      const { success, error } = await getRoles(initialFilters);
    
      if (!success) {
            return <Error error={error || 'Failed to load roles data.'} />;
      }
      
      return <RolesList initialFilters={initialFilters} />;
    } catch (error) {
      console.error('Error loading roles:', error);
      throw error; // This will be caught by the error.js boundary
    }
}
export default RolesPage