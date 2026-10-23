export function unwrapApiResponse(response) {
  if (!response) return null;
  if (response.data !== undefined && response.meta !== undefined) {
    return response.data;
  }
  return response;
}

export function normalizeProduct(raw) {
  if (!raw) return null;
  return {
    id: Number(raw.id),
    name: raw.name || 'Unnamed Dish',
    description: raw.description || '',
    vegetarian: Boolean(raw.vegetarian ?? raw.vegeterian ?? false),
    spiciness: Number(raw.spiciness ?? 0),
    rating: Number(raw.rate ?? raw.rating ?? 0),
    price: Number(raw.price ?? 0),
    image: raw.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    categoryId: raw.categoryId ? Number(raw.categoryId) : null,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
    method: raw.method || raw.preparationMethod || 'Prepared fresh using authentic ingredients.'
  };
}

export function resolvePath(pageName) {
  const isInsidePagesFolder = window.location.pathname.includes('/pages/');
  if (pageName === 'index.html') {
    return isInsidePagesFolder ? '../index.html' : 'index.html';
  }
  return isInsidePagesFolder ? pageName : `pages/${pageName}`;
}