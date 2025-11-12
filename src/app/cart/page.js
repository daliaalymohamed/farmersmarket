// This is server-side code for a Next.js page that fetches cart data.import { getCartItems } '@/app/actions/cart/serverCartData';
import { Suspense } from 'react';
import { getCartItems } from '@/app/actions/cart/serverCartData';
import CartList from './cartList';
import Error from '@/components/UI/error';

// ✅ Dynamic Metadata
export async function generateMetadata() {
  return {
    title: 'Your Shopping Cart',
    description: 'Review and manage items in your shopping cart before checkout.'
  };
}

const CartPage = async () => {
  try {
    // Fetch cart data on server
    const result = await getCartItems({});
    if (!result.cartSuccess) {
      return <Error error={'Failed to load cart.'} />;
    }

    return (
        // <Suspense fallback={<CartListSkeleton />}>
            <CartList 
                initialData={result.cart} 
            />
        // </Suspense>
    );
  } catch (error) {
    console.error('Error loading cart:', error);
    return <Error error="An unexpected error occurred while loading your cart." />;
  }
};

export default CartPage;