// This is server-side code for a Next.js page that fetches profile data for the authenticated user.
import { getCustomerById } from '@/app/actions/users/serverUserByIdData';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import MyProfile from './profile';
import Error from '@/components/UI/error';

// ✅ Dynamic Metadata
export async function generateMetadata() {
  // Profile data to get metadata
  const { user: authUser } = await getAuthenticatedUser();
  const userProfile = await getCustomerById(authUser.userId);
  if (userProfile.success && userProfile.metadata) {
    return userProfile.metadata;
  }
  return {
    title: 'My Profile - E-Commerce App',
    description: 'View and edit your profile information',
  };
}

const ProfilePage = async () => {
  try {
    // Get authenticated user data - this already handles token verification
    const { user: authUser } = await getAuthenticatedUser();

    // Get full profile data
    const userProfile = await getCustomerById(authUser.userId);
    const userData = userProfile?.user ? userProfile.user : userProfile;

    // If no user data, throw error to be caught below
    if (!userData) {
      return <Error error={result.error || 'Failed to load Profile data.'} />;
    }

    // Pass flat user object to client component
    return <MyProfile initialData={userData} />;
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default ProfilePage