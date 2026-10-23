import { initNavbar } from '../components/navbar.js';
import { authService } from '../api/authService.js';
import { showToast } from '../utils/toast.js';
import { resolvePath } from '../utils/helpers.js';

let pendingVerificationEmail = '';

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();
  bindPasswordEyeButtons();
  bindLoginForm();
  bindRegisterForm();
  bindForgotPasswordModal();
});

function bindPasswordEyeButtons() {
  document.querySelectorAll('.eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  });
}

function bindLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('remember-me')?.checked ?? true;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      await authService.login(email, password, remember);
      showToast('Welcome Back!', 'Signed in successfully.', 'success');
      setTimeout(() => {
        window.location.href = resolvePath('menu.html');
      }, 600);
    } catch (err) {
      showToast('Sign In Failed', err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}

function bindRegisterForm() {
  const regForm = document.getElementById('register-form');
  if (!regForm) return;

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    const isStrongPassword =
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password);

    if (!isStrongPassword) {
      showToast(
        'Weak Password',
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
        'warning'
      );
      return;
    }

    const submitBtn = regForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      await authService.register({ firstName, lastName, email, password });
      pendingVerificationEmail = email;
      showToast('Code Sent', 'Please check your email for the verification code.', 'success');

      const verifyModal = document.getElementById('verify-modal');
      if (verifyModal) verifyModal.style.display = 'flex';
    } catch (err) {
      showToast('Registration Failed', err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });

  document.getElementById('verify-submit-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('verify-code-input')?.value.trim();
    if (!code) {
      showToast('Missing Code', 'Please enter the verification code.', 'warning');
      return;
    }

    try {
      await authService.verifyEmail(pendingVerificationEmail, code);
      showToast('Email Verified!', 'Redirecting to menu...', 'success');
      setTimeout(() => {
        window.location.href = resolvePath('menu.html');
      }, 1000);
    } catch (err) {
      showToast('Verification Failed', err.message, 'error');
    }
  });

  document.getElementById('verify-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('verify-modal').style.display = 'none';
  });
}

function bindForgotPasswordModal() {
  const modal = document.getElementById('forgot-modal');
  if (!modal) return;

  document.getElementById('open-forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'flex';
  });

  document.getElementById('close-forgot-btn')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('send-forgot-code-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) {
      showToast('Email Required', 'Please enter your email address first.', 'warning');
      return;
    }

    try {
      const res = await authService.forgotPassword(email);
      const tokenValue = typeof res === 'string' ? res : (res?.data || '');
      if (tokenValue && document.getElementById('reset-token')) {
        document.getElementById('reset-token').value = tokenValue;
      }
      showToast('Code Sent', 'Reset token generated and filled automatically.', 'success');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });

  document.getElementById('submit-reset-btn')?.addEventListener('click', async () => {
    const token = document.getElementById('reset-token').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;

    if (!token || !newPassword) {
      showToast('Missing Fields', 'Please fill out all fields to reset your password.', 'warning');
      return;
    }

    try {
      await authService.resetPassword(token, newPassword);
      showToast('Success', 'Your password has been updated! You can now sign in.', 'success');
      modal.style.display = 'none';
    } catch (err) {
      showToast('Reset Failed', err.message, 'error');
    }
  });
}