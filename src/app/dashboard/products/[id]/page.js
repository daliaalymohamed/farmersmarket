// This is server-side code for a Next.js page that fetches product data based on the provided ID.import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import { getVendors } from '@/app/actions/vendors/serverVendorsData';
import Product from './product';
import Error from '@/components/UI/error';

const ProductPage = async ({ params }) => {
  const { id } = await params;

  try {
    const {product, prodSuccess} = await getProductById(id);
    const { categories, success } = await getCategories({});
    const vendors = await getVendors({
      noLimit: true,
      active: true
    });
    
    if (!prodSuccess) {
      return <Error error={'Failed to load product data.'} />;
    }
    if (!success) {
      return <Error error={'Failed to load categories data.'} />;
    }
    if (!vendors.vendorSuccess) {
      return <Error error={'Failed to load vendors data.'} />;
    }

    return <Product initialData={product} initialCategories={categories} initialVendors={vendors} />;
  } catch (error) {
    console.error('Error loading product:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default ProductPage