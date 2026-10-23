import { API_CONFIG } from '../config/constants.js';
import { httpClient } from './httpClient.js';
import { normalizeProduct } from '../utils/helpers.js';

export const cartService = {
  async getCart() {
    const data = await httpClient(API_CONFIG.ENDPOINTS.CART_GET, { requireAuth: true });
    const rawItems = Array.isArray(data) ? data : (data?.items || []);

    const items = rawItems.map(item => ({
      id: Number(item.id),
      quantity: Number(item.quantity || 1),
      product: normalizeProduct(item.product || item)
    }));

    const calculatedTotal = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
    const calculatedCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      totalItems: Number(data?.totalItems ?? calculatedCount),
      totalPrice: Number(data?.totalPrice ?? calculatedTotal),
      items
    };
  },

  async addToCart(productId, quantity = 1) {
    return await httpClient(API_CONFIG.ENDPOINTS.CART_ADD, {
      method: 'POST',
      body: { productId: Number(productId), quantity: Number(quantity) },
      requireAuth: true
    });
  },

  async updateQuantity(itemId, quantity) {
    return await httpClient(API_CONFIG.ENDPOINTS.CART_EDIT, {
      method: 'PUT',
      body: { itemId: Number(itemId), quantity: Number(quantity) },
      requireAuth: true
    });
  },

  async removeItem(itemId) {
    return await httpClient(`${API_CONFIG.ENDPOINTS.CART_REMOVE}/${itemId}`, {
      method: 'DELETE',
      requireAuth: true
    });
  },

  async checkout() {
    return await httpClient(API_CONFIG.ENDPOINTS.CART_CHECKOUT, {
      method: 'POST',
      requireAuth: true
    });
  }
};