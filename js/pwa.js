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

import { showActionToast } from './components/toast.js';

let _deferredPrompt = null;
const _listeners = [];

function _notify() {
  _listeners.forEach(fn => fn(_deferredPrompt));
}

// ── Registro del Service Worker ───────────────────────────

export function initPWA() {
  // Registrar SW con ruta relativa (compatible con GitHub Pages en subdirectorio)
  if ('serviceWorker' in navigator) {
    // Registrar si había un controller antes de instalar el SW nuevo.
    // Si hadController es true y el controller cambia → es una actualización real.
    const hadController = !!navigator.serviceWorker.controller;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('[Replog SW] Registration failed:', err);
      });
    });

    // Vía 1: controllerchange — se dispara cuando skipWaiting + clients.claim() terminan.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) _showUpdateToast();
    });

    // Vía 2: postMessage desde el SW — fallback para casos donde controllerchange
    // se dispara antes de que pwa.js esté listo (ej: navegación desde caché).
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'SW_UPDATED') _showUpdateToast();
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

// ── Toast de actualización ────────────────────────────────

const _UPDATE_SESSION_KEY = 'replog_update_toast_shown';

function _showUpdateToast() {
  // Mostrar solo una vez por sesión de navegación
  if (sessionStorage.getItem(_UPDATE_SESSION_KEY)) return;
  sessionStorage.setItem(_UPDATE_SESSION_KEY, '1');

  showActionToast(
    'Nueva versión disponible 🎉',
    'success',
    'Actualizar',
    () => window.location.reload(),
  );
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
