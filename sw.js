// ─────────────────────────────────────────────────────────────
// REPLOG — SERVICE WORKER
//
// Estrategia: Cache First para todos los assets estáticos y CDN.
//
// DEPLOY: al publicar una nueva versión, incrementar CACHE_NAME:
//   'replog-v2' → 'replog-v3' → 'replog-v4' ...
// Esto invalida la caché vieja y activa el flujo de actualización
// automática: el SW nuevo se instala, se activa con skipWaiting(),
// toma control con clients.claim() y notifica a la página vía
// postMessage para mostrar el toast "Nueva versión disponible".
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'replog-v6';

// Flag: true si había un SW activo antes → es una actualización, no la primera instalación.
let _isUpdate = false;

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
  './js/data/achievements.js',

  // JS — views
  './js/views/today.js',
  './js/views/history.js',
  './js/views/progress.js',
  './js/views/exercises.js',
  './js/views/settings.js',
  './js/views/planning.js',

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
  // Si ya hay un SW activo, esto es una actualización (no primera instalación)
  _isUpdate = !!self.registration.active;

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES)),
  );
  // Activar de inmediato sin esperar a que cierren los clientes existentes
  self.skipWaiting();
});

// ── Activate: limpiar cachés de versiones anteriores ──────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))),
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Notificar a todas las pestañas abiertas solo si es una actualización real
        if (!_isUpdate) return;
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
        });
      }),
  );
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
