/**
 * toast.js — Sistema de notificaciones tipo snackbar
 */

const container = () => document.getElementById('toast-container');

function _icon(type) {
  return type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : 'info';
}

function _dismiss(toast) {
  toast.classList.add('leaving');
  setTimeout(() => toast.remove(), 250);
}

/**
 * Muestra un toast con cierre automático.
 * @param {string} message
 * @param {'success'|'danger'|'info'} type
 * @param {number} duration  ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i data-lucide="${_icon(type)}"></i><span>${message}</span>`;
  container().appendChild(toast);

  if (window.lucide) window.lucide.createIcons({ nodes: [toast] });

  setTimeout(() => _dismiss(toast), duration);
}

/**
 * Muestra un toast persistente con un botón de acción y un botón de cierre.
 * No se cierra automáticamente.
 * @param {string} message
 * @param {'success'|'danger'|'info'} type
 * @param {string} actionLabel   Texto del botón de acción
 * @param {Function} onAction    Callback ejecutado al hacer clic en el botón
 */
export function showActionToast(message, type = 'info', actionLabel, onAction) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-persistent`;
  toast.innerHTML = `
    <i data-lucide="${_icon(type)}"></i>
    <span class="toast-msg">${message}</span>
    ${actionLabel ? `<button class="toast-action-btn">${actionLabel}</button>` : ''}
    <button class="toast-close-btn" aria-label="Cerrar">
      <i data-lucide="x" style="width:14px;height:14px"></i>
    </button>
  `;
  container().appendChild(toast);

  if (window.lucide) window.lucide.createIcons({ nodes: [toast] });

  if (actionLabel) {
    toast.querySelector('.toast-action-btn').addEventListener('click', () => {
      onAction?.();
      _dismiss(toast);
    });
  }
  toast.querySelector('.toast-close-btn').addEventListener('click', () => _dismiss(toast));
}
