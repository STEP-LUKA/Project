import { initNavbar, updateCartBadge } from '../components/navbar.js';
import { storage } from '../utils/storage.js';
import { cartService } from '../api/cartService.js';
import { userService } from '../api/userService.js';
import { showToast } from '../utils/toast.js';
import { resolvePath } from '../utils/helpers.js';

let currentUserPicture = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!storage.isAuthenticated()) {
    window.location.href = resolvePath('login.html');
    return;
  }

  await initNavbar();
  bindCartEvents();
  bindProfileEvents();

  await Promise.all([
    loadCartItems(),
    loadUserProfile()
  ]);
});

async function loadCartItems() {
  const container = document.getElementById('cart-items-container');
  const totalEl = document.getElementById('cart-total-price');
  if (!container) return;

  container.innerHTML = `<p style="color:#64748b; padding: 16px 0;">Loading your cart...</p>`;

  try {
    const { items, totalPrice } = await cartService.getCart();

    if (items.length === 0) {
      container.innerHTML = `<p style="color:#64748b; padding: 16px 0;">Your shopping cart is empty.</p>`;
      if (totalEl) totalEl.textContent = '$0.00';
      return;
    }

    container.innerHTML = items.map(item => {
      const subtotal = item.product.price * item.quantity;
      return `
        <div class="cart-item-row" data-item-id="${item.id}">
          <div class="cart-item-info">
            <h4>${item.product.name}</h4>
            <p>$${item.product.price.toFixed(2)} × ${item.quantity} = <strong>$${subtotal.toFixed(2)}</strong></p>
          </div>
          <div class="cart-item-actions">
            <button type="button" class="btn-clear qty-change-btn" data-new-qty="${item.quantity - 1}" style="width:auto;">-</button>
            <span>${item.quantity}</span>
            <button type="button" class="btn-clear qty-change-btn" data-new-qty="${item.quantity + 1}" style="width:auto;">+</button>
            <button type="button" class="btn-clear remove-item-btn" style="width:auto; color:#d93025;">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = `$${totalPrice.toFixed(2)}`;
  } catch (error) {
    container.innerHTML = `<p style="color:#dc2626; padding: 16px 0;">Failed to load cart: ${error.message}</p>`;
  }
}

function bindCartEvents() {
  const container = document.getElementById('cart-items-container');
  const checkoutBtn = document.getElementById('checkout-btn');

  container?.addEventListener('click', async (e) => {
    const row = e.target.closest('.cart-item-row');
    if (!row) return;

    const itemId = Number(row.dataset.itemId);
    const qtyBtn = e.target.closest('.qty-change-btn');
    
    if (qtyBtn) {
      const newQty = Number(qtyBtn.dataset.newQty);
      if (newQty < 1) return;

      try {
        await cartService.updateQuantity(itemId, newQty);
        await loadCartItems();
        await updateCartBadge();
      } catch (err) {
        showToast('Update Failed', err.message, 'error');
      }
      return;
    }

    const removeBtn = e.target.closest('.remove-item-btn');
    if (removeBtn) {
      try {
        await cartService.removeItem(itemId);
        showToast('Removed', 'Item removed from your cart.', 'info');
        await loadCartItems();
        await updateCartBadge();
      } catch (err) {
        showToast('Remove Failed', err.message, 'error');
      }
    }
  });

  checkoutBtn?.addEventListener('click', async () => {
    try {
      const cartData = await cartService.getCart();
      if (!cartData.items || cartData.items.length === 0) {
        showToast('Empty Cart', 'Please add some items before checking out.', 'warning');
        return;
      }

      const originalText = checkoutBtn.textContent;
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing...';

      await cartService.checkout();
      
      await loadCartItems();
      await updateCartBadge();
      
      showCheckoutSuccessModal();

    } catch (err) {
      showToast('Checkout Failed', err.message, 'error');
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Checkout Order';
    }
  });
}

function showCheckoutSuccessModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '9999';
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popModal {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes floatingIcon {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
      100% { transform: translateY(0px); }
    }
  `;
  document.head.appendChild(style);

  overlay.innerHTML = `
    <div class="modal-box" style="text-align: center; padding: 48px 32px; animation: popModal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
      <div style="font-size: 72px; margin-bottom: 24px; animation: floatingIcon 2.5s ease-in-out infinite;">🛵</div>
      <h2 style="font-size: 26px; font-weight: 800; color: var(--text-dark); margin-bottom: 12px;">Order Placed!</h2>
      <p style="color: var(--text-muted); margin-bottom: 32px; font-size: 15px; line-height: 1.6;">
        Your delicious food is being prepared and will be delivered shortly.
      </p>
      <button class="btn-orange full-btn" id="success-continue-btn" style="padding: 14px; font-size: 16px;">
        Continue Exploring
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);

  document.getElementById('success-continue-btn').addEventListener('click', () => {
    window.location.href = resolvePath('menu.html');
  });
}

async function loadUserProfile() {
  try {
    const profile = await userService.getProfile();
    if (!profile) return;

    currentUserPicture = profile.picture || '';
    document.getElementById('prof-firstname').value = profile.firstName || '';
    document.getElementById('prof-lastname').value = profile.lastName || '';
    document.getElementById('prof-email').value = profile.email || '';
    if (document.getElementById('prof-phone')) {
      document.getElementById('prof-phone').value = profile.phoneNumber || '';
    }
    document.getElementById('prof-address').value = profile.address || '';
    document.getElementById('prof-age').value = profile.age || '';
  } catch {}
}

function bindProfileEvents() {
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      firstName: document.getElementById('prof-firstname').value.trim(),
      lastName: document.getElementById('prof-lastname').value.trim(),
      phoneNumber: document.getElementById('prof-phone')?.value.trim() || '',
      picture: currentUserPicture,
      address: document.getElementById('prof-address').value.trim(),
      age: Number(document.getElementById('prof-age').value) || 0
    };

    try {
      await userService.updateProfile(payload);
      showToast('Profile Saved', 'Your personal details have been updated.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  document.getElementById('change-pass-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password')?.value || newPassword;

    if (newPassword !== confirmPassword) {
      showToast('Password Mismatch', 'New password and confirm password do not match.', 'warning');
      return;
    }

    try {
      await userService.changePassword(oldPassword, newPassword, confirmPassword);
      showToast('Password Updated', 'Your password has been changed successfully.', 'success');
      e.target.reset();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    storage.clearAuth();
    window.location.href = resolvePath('index.html');
  });

  document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to permanently delete your account?')) return;
    try {
      await userService.deleteAccount();
      storage.clearAuth();
      window.location.href = resolvePath('index.html');
    } catch (err) {
      showToast('Delete Failed', err.message, 'error');
    }
  });
}