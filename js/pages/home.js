import { initNavbar } from '../components/navbar.js';
import { productService } from '../api/productService.js';
import { createProductCardHTML, attachProductGridEvents } from '../components/productCard.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();
  await loadPopularDishes();
});

async function loadPopularDishes() {
  const grid = document.getElementById('popular-dishes-grid');
  if (!grid) return;

  attachProductGridEvents(grid);
  grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b;">Loading popular dishes...</p>`;

  try {
    const { products } = await productService.getProducts(1, 6);
    if (products.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">No dishes available right now.</p>`;
      return;
    }
    grid.innerHTML = products.slice(0, 6).map(createProductCardHTML).join('');
  } catch (error) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#dc2626;">Failed to load dishes: ${error.message}</p>`;
  }
}