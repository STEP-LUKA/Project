import { API_CONFIG } from '../config/constants.js';
import { httpClient } from './httpClient.js';
import { storage } from '../utils/storage.js';

function extractTokens(data) {
  if (!data) return { accessToken: null, refreshToken: null };
  if (typeof data === 'string') {
    return { accessToken: data, refreshToken: null };
  }
  const accessToken = data.accessToken || data.token || data.jwt || data.data?.accessToken || data.data?.token || null;
  const refreshToken = data.refreshToken || data.data?.refreshToken || null;
  return { accessToken, refreshToken };
}

export const authService = {
  async register(userData) {
    return await httpClient(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: userData
    });
  },

  async login(email, password, remember = true) {
    const data = await httpClient(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: { email, password }
    });
    const { accessToken, refreshToken } = extractTokens(data);
    if (accessToken) {
      storage.setTokens(accessToken, refreshToken, remember);
    }
    return data;
  },

  async verifyEmail(email, code, remember = true) {
    const data = await httpClient(API_CONFIG.ENDPOINTS.VERIFY_EMAIL, {
      method: 'PUT',
      body: { email, code }
    });
    const { accessToken, refreshToken } = extractTokens(data);
    if (accessToken) {
      storage.setTokens(accessToken, refreshToken, remember);
    }
    return data;
  },

  async forgotPassword(email) {
    return await httpClient(`${API_CONFIG.ENDPOINTS.FORGOT_PASSWORD}/${encodeURIComponent(email)}`, {
      method: 'POST'
    });
  },

  async resetPassword(token, newPassword) {
    return await httpClient(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
      method: 'PUT',
      body: { token, newPassword }
    });
  }
};