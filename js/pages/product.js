import { initNavbar } from '../components/navbar.js';
import { productService } from '../api/productService.js';
import { createProductCardHTML, attachProductGridEvents, handleAddToCart } from '../components/productCard.js';
import { showToast } from '../utils/toast.js';
import { storage } from '../utils/storage.js';

let selectedQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();

  const relatedGrid = document.getElementById('related-products-grid');
  attachProductGridEvents(relatedGrid);

  await loadProductDetails();
});

async function loadProductDetails() {
  const container = document.getElementById('product-details-container');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get('id'));

  if (!productId) {
    container.innerHTML = `<p style="color:#dc2626;">Invalid product ID.</p>`;
    return;
  }

  container.innerHTML = `<p style="color:#64748b; padding: 40px 0;">Loading dish details...</p>`;

  try {
    const product = await productService.getProductById(productId);
    renderProductDetailHTML(container, product);
    await loadRelatedProducts(product.categoryId, product.id);
  } catch (error) {
    container.innerHTML = `<p style="color:#dc2626;">Could not load product details: ${error.message}</p>`;
  }
}

function renderProductDetailHTML(container, product) {
  const ingredientsHTML = product.ingredients.length > 0
    ? product.ingredients.map(item => `<li>${item}</li>`).join('')
    : `<li>Fresh seasonal ingredients</li>`;

  container.innerHTML = `
    <div class="product-detail-grid">
      <img class="product-detail-img" src="${product.image}" alt="${product.name}" />
      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <div class="detail-rating">
          <span>★★★★★</span> (${product.rating.toFixed(1)} rating)
        </div>
        
        <div class="interactive-rating" style="margin-bottom: 16px; font-size: 26px; cursor: pointer; color: #cbd5e1;">
          <span style="font-size: 14px; font-weight: bold; color: #334155; margin-right: 8px; vertical-align: middle;">Rate Dish:</span>
          <span class="rate-star" data-val="1">★</span>
          <span class="rate-star" data-val="2">★</span>
          <span class="rate-star" data-val="3">★</span>
          <span class="rate-star" data-val="4">★</span>
          <span class="rate-star" data-val="5">★</span>
        </div>

        <div class="detail-price">$${product.price.toFixed(2)}</div>
        <div class="badges-row">
          ${product.vegetarian ? `<span class="veg-badge">🌱 Vegetarian</span>` : ''}
          ${product.spiciness > 0 ? `<span class="spicy-level-badge">🔥 Spicy Level ${product.spiciness}</span>` : `<span class="veg-badge" style="background:#f1f5f9; color:#475569;">Mild (Not Spicy)</span>`}
        </div>
        <p class="detail-desc">${product.description}</p>

        <div class="detail-section-title">Ingredients:</div>
        <ul class="ingredients-list">${ingredientsHTML}</ul>

        <div class="detail-section-title">Preparation Method:</div>
        <p class="prep-text">${product.method}</p>

        <div class="purchase-row">
          <div class="qty-control">
            <button type="button" id="qty-minus-btn" aria-label="Decrease quantity">-</button>
            <span id="detail-qty-value">1</span>
            <button type="button" id="qty-plus-btn" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" id="detail-add-cart-btn" class="btn-orange" style="flex: 1; padding: 12px;">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  selectedQuantity = 1;
  const qtyValEl = document.getElementById('detail-qty-value');

  document.getElementById('qty-minus-btn')?.addEventListener('click', () => {
    selectedQuantity = Math.max(1, selectedQuantity - 1);
    qtyValEl.textContent = selectedQuantity;
  });

  document.getElementById('qty-plus-btn')?.addEventListener('click', () => {
    selectedQuantity += 1;
    qtyValEl.textContent = selectedQuantity;
  });

  const addBtn = document.getElementById('detail-add-cart-btn');
  addBtn?.addEventListener('click', () => {
    handleAddToCart(product.id, selectedQuantity, addBtn);
  });

  const rateStars = container.querySelectorAll('.rate-star');
  rateStars.forEach(star => {
    star.addEventListener('click', async (e) => {
      if (!storage.isAuthenticated()) {
        showToast('Auth Required', 'Please sign in to rate this dish.', 'warning');
        return;
      }
      const rateValue = Number(e.target.dataset.val);
      try {
        await productService.rateProduct(product.id, rateValue);
        showToast('Success', `You rated this dish ${rateValue} stars!`, 'success');
        rateStars.forEach(s => {
          s.style.color = Number(s.dataset.val) <= rateValue ? '#f59e0b' : '#cbd5e1';
        });
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    });
  });
}

async function loadRelatedProducts(categoryId, currentProductId) {
  const relatedGrid = document.getElementById('related-products-grid');
  if (!relatedGrid) return;

  try {
    const { products } = await productService.filterProducts({
      CategoryId: categoryId,
      Page: 1,
      Take: 6
    });

    const related = products.filter(p => p.id !== currentProductId).slice(0, 3);
    if (related.length > 0) {
      relatedGrid.innerHTML = related.map(createProductCardHTML).join('');
    } else {
      relatedGrid.innerHTML = `<p style="color:#64748b;">No similar dishes found in this category.</p>`;
    }
  } catch {
    relatedGrid.innerHTML = '';
  }
}