import { API_CONFIG } from '../config/constants.js';
import { httpClient } from './httpClient.js';
import { normalizeProduct } from '../utils/helpers.js';

export const productService = {
  async getCategories() {
    const data = await httpClient(API_CONFIG.ENDPOINTS.CATEGORIES);
    if (Array.isArray(data)) return data;
    return data?.categories || data?.data || [];
  },

  async getProducts(page = 1, take = 9) {
    const query = new URLSearchParams({ Page: page, Take: take }).toString();
    const data = await httpClient(`${API_CONFIG.ENDPOINTS.PRODUCTS}?${query}`);
    
    const rawList = Array.isArray(data) 
      ? data 
      : (data?.products || data?.items || data?.data || []);

    return {
      products: rawList.map(normalizeProduct).filter(Boolean),
      hasMore: Boolean(data?.hasMore ?? (rawList.length === take))
    };
  },

  async getProductById(id) {
    const data = await httpClient(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`);
    return normalizeProduct(data);
  },

  async filterProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.Query) params.append('Query', filters.Query);
    if (filters.Vegetarian) params.append('Vegetarian', 'true');
    if (filters.Spiciness !== null && filters.Spiciness >= 0) params.append('Spiciness', filters.Spiciness);
    if (filters.Rate > 0) params.append('Rate', filters.Rate);
    if (filters.MinPrice !== null && filters.MinPrice > 0) params.append('MinPrice', filters.MinPrice);
    if (filters.MaxPrice !== null && filters.MaxPrice < 500) params.append('MaxPrice', filters.MaxPrice);
    if (filters.CategoryId !== null) params.append('CategoryId', filters.CategoryId);
    
    if (filters.SortBy) params.append('SortBy', filters.SortBy);
    if (filters.SortOrder) params.append('SortOrder', filters.SortOrder);

    params.append('Page', filters.Page || 1);
    params.append('Take', filters.Take || 9);

    const data = await httpClient(`${API_CONFIG.ENDPOINTS.PRODUCTS_FILTER}?${params.toString()}`);
    
    const rawList = Array.isArray(data) 
      ? data 
      : (data?.products || data?.items || data?.data || []);

    return {
      products: rawList.map(normalizeProduct).filter(Boolean),
      hasMore: Boolean(data?.hasMore ?? (rawList.length === (filters.Take || 9)))
    };
  },

  async rateProduct(productId, rate) {
    return await httpClient(API_CONFIG.ENDPOINTS.PRODUCT_RATE, {
      method: 'POST',
      body: { productId: Number(productId), rate: Number(rate) },
      requireAuth: true
    });
  }
};