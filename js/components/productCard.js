import { storage } from '../utils/storage.js';
import { cartService } from '../api/cartService.js';
import { showToast } from '../utils/toast.js';
import { resolvePath } from '../utils/helpers.js';
import { updateCartBadge } from './navbar.js';

export function createProductCardHTML(product) {
  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="card-img-wrapper">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
        ${product.spiciness > 0 ? `<span class="spicy-badge" title="Spiciness: ${product.spiciness}">🔥 ${product.spiciness}</span>` : ''}
      </div>
      <div class="card-body">
        <h3>${product.name}</h3>
        <p class="desc">${product.description}</p>
        <div class="rating"><span>★</span> ${product.rating.toFixed(1)}</div>
        <div class="price">$${product.price.toFixed(2)}</div>
        
        <div class="card-action-row">
          <div class="card-qty-control">
            <button type="button" class="qty-btn minus">-</button>
            <span class="qty-val">1</span>
            <button type="button" class="qty-btn plus">+</button>
          </div>
          <button type="button" class="btn-orange add-to-cart-btn" data-add-id="${product.id}">
            Add
          </button>
        </div>
      </div>
    </article>
  `;
}

export function attachProductGridEvents(gridContainer) {
  if (!gridContainer) return;

  gridContainer.addEventListener('click', async (event) => {
    const minusBtn = event.target.closest('.qty-btn.minus');
    const plusBtn = event.target.closest('.qty-btn.plus');
    
    if (minusBtn || plusBtn) {
      event.stopPropagation();
      const qtyControl = event.target.closest('.card-qty-control');
      const qtyValEl = qtyControl.querySelector('.qty-val');
      let currentQty = parseInt(qtyValEl.textContent, 10) || 1;
      
      if (minusBtn) currentQty = Math.max(1, currentQty - 1);
      if (plusBtn) currentQty += 1;
      
      qtyValEl.textContent = currentQty;
      return;
    }

    const addBtn = event.target.closest('.add-to-cart-btn');
    if (addBtn) {
      event.stopPropagation();
      const productId = Number(addBtn.dataset.addId);
      const card = addBtn.closest('.product-card');
      const qtyValEl = card.querySelector('.qty-val');
      const quantity = qtyValEl ? parseInt(qtyValEl.textContent, 10) : 1;
      
      await handleAddToCart(productId, quantity, addBtn);
      
      if (qtyValEl) qtyValEl.textContent = '1';
      return;
    }

    const card = event.target.closest('.product-card');
    if (card) {
      const productId = card.dataset.productId;
      window.location.href = `${resolvePath('product.html')}?id=${productId}`;
    }
  });
}

export async function handleAddToCart(productId, quantity = 1, buttonEl = null) {
  if (!storage.isAuthenticated()) {
    showToast('Authentication Required', 'You need to be logged in to add items to your cart.', 'warning');
    return;
  }

  const originalText = buttonEl ? buttonEl.textContent : '';
  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = '...';
  }

  try {
    await cartService.addToCart(productId, quantity);
    showToast('Added to Cart', 'Dish has been added to your shopping cart.', 'success');
    await updateCartBadge();
  } catch (error) {
    if (error.status === 401) {
      showToast('Session Expired', 'Please sign in again to continue.', 'warning');
    } else {
      showToast('Error', error.message || 'Could not add item to cart.', 'error');
    }
  } finally {
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.textContent = originalText;
    }
  }
}