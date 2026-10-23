const KEYS = {
  ACCESS_TOKEN: 'foodie_access_token',
  REFRESH_TOKEN: 'foodie_refresh_token'
};

export const storage = {
  getAccessToken() {
    return localStorage.getItem(KEYS.ACCESS_TOKEN) || sessionStorage.getItem(KEYS.ACCESS_TOKEN);
  },
  getRefreshToken() {
    return localStorage.getItem(KEYS.REFRESH_TOKEN) || sessionStorage.getItem(KEYS.REFRESH_TOKEN);
  },
  setTokens(accessToken, refreshToken, remember = null) {
    const isSession = sessionStorage.getItem(KEYS.ACCESS_TOKEN) !== null || sessionStorage.getItem(KEYS.REFRESH_TOKEN) !== null;
    const useLocal = remember !== null ? remember : !isSession;

    const targetStorage = useLocal ? localStorage : sessionStorage;
    const otherStorage = useLocal ? sessionStorage : localStorage;

    otherStorage.removeItem(KEYS.ACCESS_TOKEN);
    otherStorage.removeItem(KEYS.REFRESH_TOKEN);

    if (accessToken) targetStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) targetStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  },
  clearAuth() {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(KEYS.REFRESH_TOKEN);
  },
  isAuthenticated() {
    return Boolean(this.getAccessToken());
  }
};