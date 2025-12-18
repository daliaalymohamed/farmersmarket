import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { verifyTokenServer } from '@/middlewares/backend_helpers';

// Server-side function to get authentication headers
// This function retrieves the authentication token from cookies or authorization header
export const getAuthenticatedUser = async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Debug: Log all cookies in development
  if (process.env.NODE_ENV === 'development') {
    const allCookies = cookieStore.getAll();
    // console.log('🍪 All Available Cookies:', allCookies.map(c => c.name).join(', '));
  }

  // Try to get JWT token from cookies (regular email/password login)
  let token = cookieStore.get('token')?.value;
  
  // if (process.env.NODE_ENV === 'development' && token) {
  //   console.log('✓ Found JWT token from cookie');
  // }

  // If no JWT cookie, try to get from Authorization header
  if (!token) {
    const authHeader = headersList.get('authorization');
    token = authHeader?.replace('Bearer ', '');
    if (process.env.NODE_ENV === 'development' && token) {
      console.log('✓ Found JWT token from Authorization header');
    }
  }

  const acceptLanguage = headersList.get('accept-language') || 'en';

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ No JWT token found - will have empty headers');
    }
    // Even if no user, return headers object structure
    return { 
      user: null, 
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': acceptLanguage,
      }
    };
  }

  try {
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔐 Verifying JWT token with verifyTokenServer...');
    // }

    const userData = await verifyTokenServer(token);
    
    if (!userData?.userId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Token verification returned:', userData);
      }
      // Return basic headers even if verification failed
      return { 
        user: null, 
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': acceptLanguage,
        }
      };
    }

    // if (process.env.NODE_ENV === 'development') {
    //   console.log('✅ Authenticated user ID:', userData.userId);
    // }

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
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error verifying JWT token:', error.message);
    }
    // Return basic headers even on error
    return { 
      user: null, 
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': acceptLanguage || 'en',
      }
    };
  }
}