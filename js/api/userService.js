import { API_CONFIG } from '../config/constants.js';
import { httpClient } from './httpClient.js';

export const userService = {
  getMe() {
    return httpClient(API_CONFIG.ENDPOINTS.USER_ME, { requireAuth: true });
  },

  getProfile() {
    return httpClient(API_CONFIG.ENDPOINTS.USER_PROFILE, { requireAuth: true });
  },

  updateProfile({ firstName, lastName, phoneNumber = '', picture = '', address = '', age = 0 }) {
    return httpClient(API_CONFIG.ENDPOINTS.USER_EDIT, {
      method: 'PUT',
      body: { firstName, lastName, phoneNumber, picture, address, age: Number(age) || 0 },
      requireAuth: true
    });
  },

  changePassword(oldPassword, newPassword, confirmPassword) {
    return httpClient(API_CONFIG.ENDPOINTS.USER_CHANGE_PASS, {
      method: 'PUT',
      body: { oldPassword, newPassword, confirmPassword },
      requireAuth: true
    });
  },

  deleteAccount() {
    return httpClient(API_CONFIG.ENDPOINTS.USER_DELETE, {
      method: 'DELETE',
      requireAuth: true
    });
  }
};