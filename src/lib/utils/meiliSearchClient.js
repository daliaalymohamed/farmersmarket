// lib/utils/searchClient.js
import { MeiliSearch } from 'meilisearch';

console.log('🔧 Meilisearch config:', {
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY ? '✅ Set' : '❌ Missing'
});

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY // Only for dev!
});

export const searchIndex = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ALL: 'all_search' // Unified index
};

export default client;