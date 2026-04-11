/**
 * app.js — Entry point de Replog
 * Inicializa el router, el tema y los listeners globales.
 */

import { router }        from './router.js';
import { TodayView }     from './views/today.js';
import { HistoryView }   from './views/history.js';
import { ProgressView }  from './views/progress.js';
import { ExercisesView } from './views/exercises.js';
import { getSettings, saveSettings } from './store.js';

// ── Init ───────────────────────────────────────────────────

function init() {
  // 1. Aplicar tema guardado
  applyTheme(getSettings().theme);

  // 2. Registrar vistas en el router
  router
    .register('today',     TodayView)
    .register('history',   HistoryView)
    .register('progress',  ProgressView)
    .register('exercises', ExercisesView);

  // 3. Iniciar router (renderiza la vista actual)
  const container = document.getElementById('view-container');
  router.init(container);

  // 4. Toggle de tema
  document.getElementById('theme-toggle')
    .addEventListener('click', toggleTheme);

  // 5. Si no hay hash, navegar a /today
  if (!window.location.hash) {
    router.navigate('#/today');
  }
}

// ── Tema ───────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveSettings({ theme: next });
}

// ── Arrancar cuando el DOM esté listo ─────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
