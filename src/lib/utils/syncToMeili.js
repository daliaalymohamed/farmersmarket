// scripts/syncToMeili.js
import { connectToDatabase } from '@/lib/utils/dbConnection';
import Product from '@/models/product';
import Vendor from '@/models/vendor';
import Category from '@/models/category';
import client from '@/lib/utils/meiliSearchClient';

export const syncData = async () => {

    await connectToDatabase();

    // Get Meilisearch instance
    const index = client.index('all_search');

    // Optional: Check document count to avoid unnecessary re-sync
    const stats = await index.getStats().catch(() => null);
    if (stats?.numberOfDocuments > 0 && !force) {
      console.log('🔍 Meilisearch already has data. Skipping sync.');
      isSynced = true;
      return;
    }

    // Fetch all active products
    const products = await Product.find({ isActive: true }).populate('categoryId vendorId').lean();
    const searchableProducts = products.map(p => new Product(p).toSearchable());

    const categories = await Category.find({}).lean();
    const searchableCategories = categories.map(c => new Category(c).toSearchable());
    
    // Clear existing data
    await index.deleteAllDocuments().catch(console.warn);

    // Combine and send to Meilisearch
    await index.addDocuments([...searchableProducts, ...searchableCategories]);

    // Set searchable attributes
    await index.updateSettings({
      searchableAttributes: ['searchable'],
      displayedAttributes: ['*'],
      filterableAttributes: ['type'], 

      rankingRules: [
        'typo',
        'words',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 3,
          twoTypos: 6
        }
      }
    });

  console.log('✅ Successfully synced data to Meilisearch');
}

syncData().catch(console.error);