/**
 * pwa.js — Registro del Service Worker y manejo del prompt de instalación.
 *
 * API pública:
 *   initPWA()                — llamar una vez desde app.js
 *   getInstallPrompt()       — devuelve el BeforeInstallPromptEvent capturado, o null
 *   isStandalone()           — true si la app ya está instalada y corriendo como standalone
 *   triggerInstall()         — muestra el prompt nativo; devuelve true si el usuario aceptó
 *   onInstallPromptChange(fn)  — registra un callback que se llama cuando el estado cambia
 *   offInstallPromptChange(fn) — elimina un callback registrado
 */

let _deferredPrompt = null;
const _listeners = [];

function _notify() {
  _listeners.forEach(fn => fn(_deferredPrompt));
}

// ── Registro del Service Worker ───────────────────────────

export function initPWA() {
  // Registrar SW con ruta relativa (compatible con GitHub Pages en subdirectorio)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('[Replog SW] Registration failed:', err);
      });
    });
  }

  // Capturar el prompt de instalación antes de que el browser lo muestre por defecto
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    _notify();
  });

  // Limpiar prompt cuando la app ya fue instalada
  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    _notify();
  });
}

// ── API pública ───────────────────────────────────────────

/** Devuelve el BeforeInstallPromptEvent capturado, o null si no está disponible. */
export function getInstallPrompt() {
  return _deferredPrompt;
}

/** True si la app corre en modo standalone (ya instalada). */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Dispara el prompt de instalación nativo.
 * @returns {Promise<boolean>} true si el usuario aceptó instalar.
 */
export async function triggerInstall() {
  if (!_deferredPrompt) return false;
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  _notify();
  return outcome === 'accepted';
}

/** Registra un callback invocado cada vez que cambia el estado del install prompt. */
export function onInstallPromptChange(fn) {
  if (!_listeners.includes(fn)) _listeners.push(fn);
}

/** Elimina un callback previamente registrado. */
export function offInstallPromptChange(fn) {
  const i = _listeners.indexOf(fn);
  if (i !== -1) _listeners.splice(i, 1);
}
