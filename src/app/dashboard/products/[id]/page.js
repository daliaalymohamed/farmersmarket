// This is server-side code for a Next.js page that fetches product data based on the provided ID.import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import { getVendors } from '@/app/actions/vendors/serverVendorsData';
import Product from './product';
import Error from '@/components/UI/error';

const ProductPage = async ({ params }) => {
  const { id } = await params;

  const productResult = await getProductById(id);

  // ✅ Check if result exists and has data
  if (!productResult || !productResult.prodSuccess || !productResult.product) {
    return <Error error={result.error || 'Failed to load product data.'} />;
  }

  const categoryResult = await getCategories({});
  if (!categoryResult || !categoryResult.categories || !categoryResult?.success) {
    return <Error error={result.error || 'Failed to load category data.'} />;
  }

  const vendorResult = await getVendors({ noLimit: true, active: true });
  if (!vendorResult || !vendorResult.vendors || !vendorResult?.vendorSuccess) {
    return <Error error={result.error || 'Failed to load vendor data.'} />;
  }

  const product = productResult.product;
  const categories = categoryResult.categories;
  const vendors = vendorResult.vendors;

  return <Product initialData={product} initialCategories={categories} initialVendors={vendors} />;
  
}

export default ProductPage