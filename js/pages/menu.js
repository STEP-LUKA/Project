import { initNavbar } from '../components/navbar.js';
import { productService } from '../api/productService.js';
import { createProductCardHTML, attachProductGridEvents } from '../components/productCard.js';

const filterState = {
  Query: '',
  CategoryId: null,
  Vegetarian: false,
  Spiciness: null,
  Rate: 0,
  MinPrice: null,
  MaxPrice: null,
  SortBy: '',
  SortOrder: '',
  Page: 1,
  Take: 9
};

function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();
  setupMobileFilterToggle();
  readInitialUrlParams();

  const menuGrid = document.getElementById('menu-products-grid');
  attachProductGridEvents(menuGrid);

  await renderCategories();
  bindFilterEvents();
  await fetchAndRenderProducts();
});

function setupMobileFilterToggle() {
  const menuContainer = document.querySelector('.menu-page-container');
  const sidebar = document.querySelector('.filters-sidebar');

  if (menuContainer && sidebar && !document.querySelector('.mobile-filter-btn')) {
    const filterBtn = document.createElement('button');
    filterBtn.type = 'button';
    filterBtn.className = 'mobile-filter-btn';
    filterBtn.innerHTML = '<span>Filters</span><span id="filter-arrow">▾</span>';

    filterBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      document.getElementById('filter-arrow').textContent = isOpen ? '▴' : '▾';
    });

    menuContainer.insertBefore(filterBtn, sidebar);
  }
}

function readInitialUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = parseInt(urlParams.get('page'), 10);
  if (!isNaN(pageParam) && pageParam > 0) {
    filterState.Page = pageParam;
  }
}

function syncUrlWithPage() {
  const url = new URL(window.location);
  if (filterState.Page > 1) {
    url.searchParams.set('page', filterState.Page);
  } else {
    url.searchParams.delete('page');
  }
  window.history.pushState({}, '', url);
}

async function renderCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  try {
    const categories = await productService.getCategories();
    
    const validCategories = categories.filter(cat => cat.name.toLowerCase() !== 'string');

    container.innerHTML = validCategories.map(cat => `
      <label>
        <input type="checkbox" name="category-checkbox" value="${cat.id}" />
        ${cat.name}
      </label>
    `).join('');

    container.addEventListener('change', (e) => {
      if (e.target.name !== 'category-checkbox') return;

      container.querySelectorAll('input[name="category-checkbox"]').forEach(cb => {
        if (cb !== e.target) cb.checked = false;
      });

      filterState.CategoryId = e.target.checked ? Number(e.target.value) : null;
      filterState.Page = 1;
      syncUrlWithPage();
      fetchAndRenderProducts();
    });
  } catch {
    container.innerHTML = `<p style="color:#64748b; font-size:13px;">Could not load categories</p>`;
  }
}

async function fetchAndRenderProducts() {
  const menuGrid = document.getElementById('menu-products-grid');
  const countEl = document.getElementById('showing-count');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');

  if (!menuGrid) return;
  menuGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b; padding: 40px 0;">Loading dishes...</p>`;

  try {
    const { products, hasMore } = await productService.filterProducts(filterState);

    if (countEl) {
      countEl.textContent = `Showing ${products.length} products (Page ${filterState.Page})`;
    }

    if (products.length === 0) {
      menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 48px 0;">
          <h3 style="margin-bottom:8px;">No dishes match your filters</h3>
          <p style="color:#64748b;">Try adjusting your price range, spiciness, or search query.</p>
        </div>
      `;
    } else {
      menuGrid.innerHTML = products.map(createProductCardHTML).join('');
    }

    if (prevBtn) prevBtn.style.display = filterState.Page > 1 ? 'inline-block' : 'none';
    if (nextBtn) nextBtn.style.display = hasMore ? 'inline-block' : 'none';
  } catch (error) {
    menuGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#dc2626;">Error: ${error.message}</p>`;
  }
}

function bindFilterEvents() {
  const debouncedReload = debounce(() => {
    filterState.Page = 1;
    syncUrlWithPage();
    fetchAndRenderProducts();
  }, 300);

  document.getElementById('filter-search')?.addEventListener('input', (e) => {
    filterState.Query = e.target.value.trim();
    debouncedReload();
  });

  document.getElementById('filter-vegetarian')?.addEventListener('change', (e) => {
    filterState.Vegetarian = e.target.checked;
    filterState.Page = 1;
    syncUrlWithPage();
    fetchAndRenderProducts();
  });

  document.getElementById('filter-spiciness')?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    filterState.Spiciness = val >= 0 ? val : null;
    document.getElementById('spiciness-label').textContent = val >= 0 ? `Level: ${val}` : 'Level: not selected';
    debouncedReload();
  });

  document.getElementById('filter-rating')?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    filterState.Rate = val;
    document.getElementById('rating-label').textContent = `⭐ ${val.toFixed(1)}+`;
    debouncedReload();
  });

  document.getElementById('filter-min-price')?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    filterState.MinPrice = val > 0 ? val : null;
    document.getElementById('min-price-label').textContent = `$ ${val}`;
    debouncedReload();
  });

  document.getElementById('filter-max-price')?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    filterState.MaxPrice = val < 500 ? val : null;
    document.getElementById('max-price-label').textContent = val < 500 ? `$ ${val}` : '$ 500+';
    debouncedReload();
  });

  document.getElementById('filter-sort')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      const [by, order] = val.split('-');
      filterState.SortBy = by || '';
      filterState.SortOrder = order || '';
    } else {
      filterState.SortBy = '';
      filterState.SortOrder = '';
    }
    debouncedReload();
  });

  document.getElementById('clear-filters-btn')?.addEventListener('click', resetAllFilters);

  document.getElementById('prev-page-btn')?.addEventListener('click', () => changePage(-1));
  document.getElementById('next-page-btn')?.addEventListener('click', () => changePage(1));
}

function resetAllFilters() {
  filterState.Query = '';
  filterState.CategoryId = null;
  filterState.Vegetarian = false;
  filterState.Spiciness = null;
  filterState.Rate = 0;
  filterState.MinPrice = null;
  filterState.MaxPrice = null;
  filterState.SortBy = '';
  filterState.SortOrder = '';
  filterState.Page = 1;

  document.getElementById('filter-search').value = '';
  document.getElementById('filter-vegetarian').checked = false;
  document.getElementById('filter-spiciness').value = -1;
  document.getElementById('spiciness-label').textContent = 'Level: not selected';
  document.getElementById('filter-rating').value = 0;
  document.getElementById('rating-label').textContent = '⭐ 0.0+';
  document.getElementById('filter-min-price').value = 0;
  document.getElementById('min-price-label').textContent = '$ 0';
  document.getElementById('filter-max-price').value = 500;
  document.getElementById('max-price-label').textContent = '$ 500+';
  document.querySelectorAll('input[name="category-checkbox"]').forEach(cb => (cb.checked = false));
  
  const sortEl = document.getElementById('filter-sort');
  if (sortEl) sortEl.value = '';

  syncUrlWithPage();
  fetchAndRenderProducts();
}

function changePage(step) {
  const nextPage = filterState.Page + step;
  if (nextPage < 1) return;
  filterState.Page = nextPage;
  syncUrlWithPage();
  fetchAndRenderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}