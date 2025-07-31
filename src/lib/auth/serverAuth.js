import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { verifyTokenServer } from '@/middlewares/backend_helpers';

// Server-side function to get authentication headers
// This function retrieves the authentication token and language from cookies and headers
// and returns them in a format suitable for API requests.
export const getAuthenticatedUser = async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const token = cookieStore.get('token')?.value;
  const acceptLanguage = headersList.get('accept-language') || 'en';

  if (!token) {
    console.error('No authentication token found in cookies');
  }

  try {
    const userData = await verifyTokenServer(token);
    if (!userData?.userId) {
      console.error('Invalid user data from token verification:', userData);
    }

    return {
      user: userData,
      token,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': acceptLanguage,
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };
  } catch (error) {
    console.error('Error verifying token:', error);
  }
}