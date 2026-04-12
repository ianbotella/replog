/**
 * sw.js — Service Worker de Replog
 *
 * Estrategia: Cache First para todos los assets estáticos y CDN.
 * Bump CACHE_NAME para forzar refresco en cada deploy.
 */

const CACHE_NAME = 'replog-v1';

const CACHE_FILES = [
  // Shell
  './',
  './index.html',
  './manifest.json',

  // CSS
  './css/variables.css',
  './css/reset.css',
  './css/layout.css',
  './css/components.css',
  './css/views.css',

  // JS — core
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/pwa.js',

  // JS — data
  './js/data/exercises.js',
  './js/data/freeExerciseDb.js',
  './js/data/routineTemplates.js',

  // JS — views
  './js/views/today.js',
  './js/views/history.js',
  './js/views/progress.js',
  './js/views/exercises.js',
  './js/views/settings.js',

  // JS — utils & components
  './js/utils/share.js',
  './js/components/modal.js',
  './js/components/toast.js',

  // Assets
  './assets/favicon.svg',
  './assets/icon.svg',

  // CDN — cacheados para uso offline
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
];

// ── Install: pre-cachear todos los assets ─────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES)),
  );
  // Activar de inmediato sin esperar a que cierren los clientes existentes
  self.skipWaiting();
});

// ── Activate: limpiar cachés de versiones anteriores ──────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k)),
      ),
    ),
  );
  // Tomar control de todos los clientes abiertos sin recargar
  self.clients.claim();
});

// ── Fetch: Cache First con fallback a red ─────────────────
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // No está en caché: ir a la red y cachear la respuesta
      return fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Sin red y sin caché: para navegación devolver index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    }),
  );
});
