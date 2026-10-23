export const API_CONFIG = {
  BASE_URL: 'https://restaurantapi.stepacademy.ge',
  STEP_KEY: 'c451ed7b-6526-4627-b7a0-3bd3358b9c31',
  ENDPOINTS: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-access-token',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CATEGORIES: '/api/categories',
    PRODUCTS: '/api/products',
    PRODUCTS_FILTER: '/api/products/filter',
    PRODUCT_RATE: '/api/products/rate',
    CART_GET: '/api/cart',
    CART_ADD: '/api/cart/add-to-cart',
    CART_EDIT: '/api/cart/edit-quantity',
    CART_REMOVE: '/api/cart/remove-from-cart',
    CART_CHECKOUT: '/api/cart/checkout',
    USER_ME: '/api/users/me',
    USER_PROFILE: '/api/users/profile',
    USER_EDIT: '/api/users/edit',
    USER_CHANGE_PASS: '/api/users/change-password',
    USER_DELETE: '/api/users/delete'
  }
};