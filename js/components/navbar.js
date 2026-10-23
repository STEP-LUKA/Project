import { storage } from '../utils/storage.js';
import { userService } from '../api/userService.js';
import { cartService } from '../api/cartService.js';
import { showToast } from '../utils/toast.js';
import { resolvePath } from '../utils/helpers.js';

export async function initNavbar() {
  setupMobileNavigation();
  setupCartButton();
  await updateNavbarAuthUI();
  await updateCartBadge();
}

function setupMobileNavigation() {
  const navbar = document.querySelector('.navbar');
  const navLeft = document.querySelector('.nav-left');

  if (navbar && navLeft && !document.querySelector('.mobile-menu-toggle')) {
    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'mobile-menu-toggle';
    menuBtn.setAttribute('aria-label', 'Toggle navigation');
    menuBtn.textContent = '☰';

    menuBtn.addEventListener('click', () => {
      const isOpen = navbar.classList.toggle('mobile-open');
      menuBtn.textContent = isOpen ? '✕' : '☰';
    });

    navLeft.appendChild(menuBtn);
  }
}

function setupCartButton() {
  const cartBtn = document.querySelector('.cart-btn');
  if (!cartBtn) return;

  cartBtn.addEventListener('click', () => {
    if (!storage.isAuthenticated()) {
      showToast('Authentication Required', 'Please sign in to view your shopping cart.', 'warning');
      return;
    }
    window.location.href = resolvePath('cart.html');
  });
}

async function updateNavbarAuthUI() {
  const authArea = document.getElementById('nav-auth-area');
  const loginLink = document.getElementById('nav-login-link');
  const signupLink = document.getElementById('nav-signup-link');

  if (!storage.isAuthenticated()) return;

  try {
    const user = await userService.getMe();
    
    if (loginLink) loginLink.style.display = 'none';
    if (signupLink) signupLink.style.display = 'none';

    if (authArea && !document.querySelector('.user-menu-container')) {
      const userName = user?.firstName || 'Foodie';
      
      const dropdownHTML = `
        <div class="user-menu-container">
          <div class="user-menu-btn" id="user-dropdown-toggle">
            <span class="user-avatar">🧑‍🍳</span>
            <span class="user-name-text">${userName}</span>
            <span class="dropdown-arrow">▾</span>
          </div>
          <div class="user-dropdown" id="user-dropdown-menu">
            <a href="${resolvePath('cart.html')}">🛒 My Cart</a>
            <a href="${resolvePath('cart.html')}#profile-section">⚙️ Profile Settings</a>
            <div class="dropdown-divider"></div>
            <button type="button" id="dropdown-logout-btn">🚪 Logout</button>
          </div>
        </div>
      `;
      
      authArea.insertAdjacentHTML('beforeend', dropdownHTML);

      const toggleBtn = document.getElementById('user-dropdown-toggle');
      const dropdownMenu = document.getElementById('user-dropdown-menu');

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!toggleBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.classList.remove('show');
        }
      });

      document.getElementById('dropdown-logout-btn').addEventListener('click', () => {
        storage.clearAuth();
        window.location.href = resolvePath('index.html');
      });
    }
  } catch (error) {
    //
  }
}

export async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  if (!storage.isAuthenticated()) {
    badge.style.display = 'none';
    return;
  }

  try {
    const cartData = await cartService.getCart();
    const totalCount = cartData.totalItems || 0;

    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}