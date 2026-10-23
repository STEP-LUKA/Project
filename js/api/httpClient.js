import { API_CONFIG } from '../config/constants.js';
import { storage } from '../utils/storage.js';
import { resolvePath } from '../utils/helpers.js';

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'X-STEP-KEY': API_CONFIG.STEP_KEY
    },
    body: JSON.stringify({ refreshToken })
  });

  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}

  if (!response.ok) {
    throw new Error(parsed?.error?.message || parsed?.message || 'Session expired');
  }

  const payload = parsed && parsed.data !== undefined ? parsed.data : parsed;
  const newAccessToken = payload?.accessToken || payload?.token || (typeof payload === 'string' ? payload : null);
  const newRefreshToken = payload?.refreshToken || refreshToken;

  if (!newAccessToken) {
    throw new Error('Invalid token response during refresh');
  }

  storage.setTokens(newAccessToken, newRefreshToken);
  return newAccessToken;
}

export async function httpClient(endpoint, options = {}) {
  const headers = {
    'accept': 'application/json',
    'X-STEP-KEY': API_CONFIG.STEP_KEY,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const token = storage.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  };

  let response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, fetchOptions);

  const isAuthEndpoint = endpoint === API_CONFIG.ENDPOINTS.LOGIN || endpoint === API_CONFIG.ENDPOINTS.REFRESH_TOKEN;

  if (response.status === 401 && !options._retry && !isAuthEndpoint && storage.getRefreshToken()) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return httpClient(endpoint, { ...options, _retry: true });
      });
    }

    options._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      isRefreshing = false;
      return await httpClient(endpoint, options);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      storage.clearAuth();

      if (options.requireAuth && !window.location.pathname.includes('login.html')) {
        window.location.href = resolvePath('login.html');
      }
      throw refreshErr;
    }
  }

  const text = await response.text();
  let parsed = text;
  try { parsed = JSON.parse(text); } catch (_) {}

  if (!response.ok) {
    const errorMsg =
      parsed?.error?.message ||
      parsed?.message ||
      parsed?.detail ||
      parsed?.title ||
      (typeof parsed === 'string' && parsed.trim() ? parsed : `Error ${response.status}`);
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return parsed && parsed.data !== undefined ? parsed.data : parsed;
}