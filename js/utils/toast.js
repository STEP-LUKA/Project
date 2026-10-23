export function showToast(title, message, type = 'info') {
  const existing = document.getElementById('app-toast-popup');
  if (existing) existing.remove();

  const colors = { success: '#16a34a', error: '#dc2626', warning: '#ff6b35', info: '#ff6b35' };
  const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
  const borderColor = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.id = 'app-toast-popup';
  toast.className = 'auth-toast';
  toast.style.borderLeftColor = borderColor;

  toast.innerHTML = `
    <button class="auth-toast-close" type="button">&times;</button>
    <div class="auth-toast-icon" style="color: ${borderColor};">${icons[type]}</div>
    <div class="auth-toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;

  toast.querySelector('.auth-toast-close').addEventListener('click', () => toast.remove());
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}