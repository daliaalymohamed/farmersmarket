// This is server-side code for a Next.js page that fetches cart data.import { getCheckoutData } '@/app/actions/checkout/serverCheckoutData';
import { Suspense } from 'react';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { getCustomerById } from '@/app/actions/users/serverUserByIdData';
import { getCheckoutData } from '@/app/actions/checkout/serverCheckoutData';
import CheckoutForm from './checkoutForm';
import Error from '@/components/UI/error';
import CheckoutSkeleton from '@/components/SKELETONS/checkoutSkeleton';

export async function generateMetadata() {
  return {
    title: 'Checkout - Your Store',
    description: 'Complete your purchase securely.'
  };
}

const CheckoutPage = async () => {
  // Get authenticated user data - this already handles token verification
  const { user: authUser } = await getAuthenticatedUser();
  if (!authUser) {
    return <Error error="You must be logged in to access the checkout page." />;
  }

  // Get full profile data
  const userProfile = await getCustomerById(authUser.userId);
  const userData = userProfile?.user ? userProfile.user : userProfile;

  // If no user data, throw error to be caught below
  if (!userData) {
    return <Error error={result.error || 'Failed to load Profile data.'} />;
  }
  const result = await getCheckoutData();
  if (!result.success) {
    return <Error error={result.error} />;
  }

  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutForm initialData={result.data} profileData={userData}/>
    </Suspense>
  );
};

export default CheckoutPage;