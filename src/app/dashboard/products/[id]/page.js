// This is server-side code for a Next.js page that fetches product data based on the provided ID.import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import { getVendors } from '@/app/actions/vendors/serverVendorsData';
import Product from './product';
import { redirect } from 'next/navigation';

const ProductPage = async ({ params }) => {
  const { id } = await params;

  const productResult = await getProductById(id);

  // ✅ Check if result exists and has data
  if (!productResult || !productResult.prodSuccess || !productResult.product) {
    // If no product found, redirect to /home
    redirect('/home');
  }

  const categoryResult = await getCategories({});
  if (!categoryResult || !categoryResult.categories || !categoryResult?.success) {
    // If no categories found, redirect to /home
    redirect('/home');
  }

  const vendorResult = await getVendors({ noLimit: true, active: true });
  if (!vendorResult || !vendorResult.vendors || !vendorResult?.vendorSuccess) {
    // If no vendors found, redirect to /home
    redirect('/home');
  }

  const product = productResult.product;
  const categories = categoryResult.categories;
  const vendors = vendorResult.vendors;

  return <Product initialData={product} initialCategories={categories} initialVendors={vendors} />;
  
}

export default ProductPage