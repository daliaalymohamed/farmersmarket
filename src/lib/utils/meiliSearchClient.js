// lib/searchClient.js
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey123' // Only for dev!
});

export const searchIndex = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ALL: 'all_search' // Unified index
};

export default client;