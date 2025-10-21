// src/services/searchService.js
export const searchService = {
  async search(query, limit = 10) {
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add cache for better performance
          next: { revalidate: 60 } // Cache for 60 seconds
        }
      );

      if (!res.ok) {
        throw new Error(`Search failed with status: ${res.status}`);
      }

      const data = await res.json();
            
      return data;
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  },

  async quickSearch(query) {
    return this.search(query, 1);
  },

  async autocomplete(query, limit = 5) {
    return this.search(query, limit);
  }
};