/**
 * toast.js — Sistema de notificaciones tipo snackbar
 */

const container = () => document.getElementById('toast-container');

/**
 * Muestra un toast.
 * @param {string} message
 * @param {'success'|'danger'|'info'} type
 * @param {number} duration  ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? 'check-circle'
             : type === 'danger'  ? 'x-circle'
             : 'info';

  toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  container().appendChild(toast);

  if (window.lucide) window.lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 250); // duración de la animación toast-out
  }, duration);
}
