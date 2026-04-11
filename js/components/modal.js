/**
 * modal.js — Sistema de modales (bottom sheets)
 *
 * Uso:
 *   openModal({ title: 'Título', body: '<p>Contenido HTML</p>', onClose })
 *   closeModal()
 */

let _onClose = null;

export function openModal({ title, body, footer = '', onClose = null }) {
  const overlay   = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');

  _onClose = onClose;

  container.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">${title}</h2>
      <button class="icon-btn" id="modal-close-btn" aria-label="Cerrar">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="modal-body">${body}</div>
    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
  `;

  overlay.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons({ nodes: [container] });

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', _overlayClick);
  document.addEventListener('keydown', _escapeKey);

  // Devuelve el contenido del body para que el llamador pueda atar eventos
  return container.querySelector('.modal-body');
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  document.getElementById('modal-container').innerHTML = '';
  overlay.removeEventListener('click', _overlayClick);
  document.removeEventListener('keydown', _escapeKey);
  if (_onClose) { _onClose(); _onClose = null; }
}

function _overlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function _escapeKey(e) {
  if (e.key === 'Escape') closeModal();
}
