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
    // Don't log as error, log as info instead
    if (process.env.NODE_ENV === 'development') {
      console.info('No authentication token found in cookies - redirecting to login');
    }
    return { user: null, headers: {} };
  }

  try {
    const userData = await verifyTokenServer(token);
    if (!userData?.userId) {
      return { user: null, headers: {} };
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
    // Log as info instead of error for auth issues
    if (process.env.NODE_ENV === 'development') {
      console.info('Error verifying token - redirecting to login', error);
    }
    return { user: null, headers: {} };
  }
}