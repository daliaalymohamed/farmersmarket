// This is server-side code for a Next.js page that fetches product data based on the provided ID.import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getProductById } from '@/app/actions/products/serverProductByIdData';
import { getCategories } from '@/app/actions/categories/serverCategoriesData';
import Product from './product';
import { notFound } from 'next/navigation';

const ProductPage = async ({ params }) => {
  const { id } = await params;

  try {
    const product = await getProductById(id);
    const categories = await getCategories({});
    
    if (!product) {
      notFound();
    }

    return <Product initialData={product} initialCategories={categories}/>;
  } catch (error) {
    console.error('Error loading product:', error);
    throw error; // This will be caught by the error.js boundary
  }
}

export default ProductPage