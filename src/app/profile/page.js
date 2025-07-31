// This is server-side code for a Next.js page that fetches profile data for the authenticated user.
import { getCustomerById } from '@/app/actions/users/serverUserByIdData';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import MyProfile from './profile';
import { notFound } from 'next/navigation';

const ProfilePage = async () => {
  try {
    // Get authenticated user data - this already handles token verification
    const { user } = await getAuthenticatedUser();
    // Get full profile data
    const userProfile = await getCustomerById(user.userId);
    
    if (!userProfile) {
      notFound();
    }

    return <MyProfile initialData={userProfile} />;
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default ProfilePage