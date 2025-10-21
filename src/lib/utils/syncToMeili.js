// lib/utils/syncToMeili.js
import { connectToDatabase } from '@/lib/utils/dbConnection';
import Product from '@/models/product';
import Category from '@/models/category';
import Vendor from '@/models/vendor';
import client from '@/lib/utils/meiliSearchClient';
import { searchIndex } from '@/lib/utils/meiliSearchClient';

let syncInProgress = false;

export const syncData = async (force = false) => {
  if (syncInProgress) {
    console.log('⏳ Sync already in progress, skipping...');
    return { success: true, message: 'Sync in progress' };
  }

  syncInProgress = true;

  try {
    await connectToDatabase();

    let index;

    try {
      // ✅ Step 1: List all indexes and check if ours exists
      const indexesResponse = await client.getIndexes();
      
      // 🛠 Use .results to access the array
      const existingIndex = indexesResponse.results.find(idx => idx.uid === searchIndex.ALL);

      if (existingIndex) {
        // Use existing index
        index = client.index(searchIndex.ALL);
        console.log('✅ Found existing index:', searchIndex.ALL);
      } else {
        // Create new one with primary key
        console.log('🆕 Index not found. Creating...', searchIndex.ALL);
        const task = await client.createIndex(searchIndex.ALL, { primaryKey: 'id' });
        console.log('📋 Create index task UID:', task.taskUid);

        // ✅ Wait for creation to complete
        await client.tasks.waitForTask(task.taskUid);
        index = client.index(searchIndex.ALL);
        console.log('✅ Created index with primaryKey: "id"');
      }
    } catch (err) {
      console.error('❌ Failed to get/create index:', err.message);
      throw err;
    }

    // Check if sync needed
    let stats = null;
    try {
      stats = await index.getStats();
    } catch (err) {
      console.log('📊 Could not get index stats, will sync anyway');
    }

    if (stats?.numberOfDocuments > 0 && !force) {
      console.log(`🔍 Search index already has ${stats.numberOfDocuments} documents. Skipping sync.`);
      return {
        success: true,
        message: 'Already synced',
        productsCount: 0,
        categoriesCount: 0,
        existingDocuments: stats.numberOfDocuments
      };
    }

    console.log('🔄 Starting data sync to Meilisearch...');

    // Fetch active products
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name')
      .populate('vendorId', 'name')
      .lean();

    const searchableProducts = products.map(p => ({
      id: p._id.toString(),
      type: 'product',
      name_en: p.name.en,
      name_ar: p.name.ar,
      description_en: p.description?.en,
      description_ar: p.description?.ar,
      category_id: p.categoryId?._id.toString(),
      vendor_id: p.vendorId?._id.toString(),
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      isOnSale: p.isOnSale,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      tags: Array.isArray(p.tags) ? p.tags : [],
      slug: p.slug,
      // ✅ Include category & vendor names in searchable text
      searchable: [
        p.name.en,
        p.name.ar,
        p.description?.en,
        p.description?.ar,
        ...(Array.isArray(p.tags) ? p.tags : []),
        p.categoryId?.name?.en,
        p.categoryId?.name?.ar,
        typeof p.vendorId?.name === 'string' ? p.vendorId.name : ''
      ].filter(Boolean).join(' ').toLowerCase(),
      image: p.image ? `/api/images/product/${p.image}` : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    // Fetch categories
    const categories = await Category.find().lean();

    const searchableCategories = categories.map(c => ({
      id: c._id.toString(),
      type: 'category',
      name_en: c.name.en,
      name_ar: c.name.ar,
      image: c.image ? `/api/images/category/${c.image}` : null,
      slug: c.slug,
      searchable: [c.name.en, c.name.ar].filter(Boolean).join(' ').toLowerCase(),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    console.log(`📦 Syncing ${searchableProducts.length} products and ${searchableCategories.length} categories`);

    if (force) {
      try {
        // ✅ Correct method: deleteAllDocuments()
        const task = await index.deleteAllDocuments();
        console.log(`🗑️ Deletion task started with UID: ${task.taskUid}`);

        // ✅ Wait for deletion to complete
        await client.tasks.waitForTask(task.taskUid);
        console.log('✅ Old documents cleared');
      } catch (err) {
        console.warn('⚠️ Delete failed:', err.message);
      }
    }

    const allDocuments = [...searchableProducts, ...searchableCategories];

    if (allDocuments.length === 0) {
      console.log('⚠️ No documents to sync');
      return { success: true, productsCount: 0, categoriesCount: 0 };
    }

    // ✅ Now add documents
    const task = await index.addDocuments(allDocuments);
    console.log(`📋 Task created with UID: ${task.taskUid}`);

    // ✅ Wait for indexing to complete
    await client.tasks.waitForTask(task.taskUid);
    console.log('✅ All documents successfully indexed');

    // Configure settings
    await index.updateSettings({
      searchableAttributes: ['searchable', 'name_en', 'name_ar'],
      displayedAttributes: ['*'],
      filterableAttributes: ['type', 'isActive'],
      sortableAttributes: ['type', 'price', 'createdAt'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 }
      },
      // ✅ Correct tokenization for Arabic
      nonSeparatorTokens: ["\u0600-\u06FF"],
      separatorTokens: [" ", "،", "؛", "؟"]
    });

    console.log('✅ Search settings configured');

    return {
      success: true,
      productsCount: searchableProducts.length,
      categoriesCount: searchableCategories.length
    };

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    syncInProgress = false;
  }
};