/**
 * progress.js — Vista "Progreso"
 * Muestra un gráfico de evolución de peso máximo por ejercicio.
 */

import { getExerciseHistory, getSessions, getCustomExercises } from '../store.js';
import { MUSCLE_GROUPS } from '../data/exercises.js';

let _container  = null;
let _chart      = null;
let _selectedEx = null;

export const ProgressView = {
  render(container) {
    _container = container;
    _chart     = null;

    // Ejercicio seleccionado por defecto: el primero con historial
    _selectedEx = _getDefaultExercise();
    _render();
  },
  destroy() {
    if (_chart) { _chart.destroy(); _chart = null; }
  },
};

// ── Render ─────────────────────────────────────────────────

function _render() {
  const allExercisesWithData = _getExercisesWithHistory();

  // Stats globales
  const sessions  = getSessions();
  const totalSess = sessions.length;
  const totalVol  = sessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) =>
      es + ex.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0);
  const totalSets = sessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) => es + ex.sets.length, 0), 0);

  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Progreso</h1>
      <p class="page-subtitle">Seguí tu evolución por ejercicio</p>

      <!-- Stats globales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalSess}</div>
          <div class="stat-label">Sesiones</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalSets}</div>
          <div class="stat-label">Series totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + 'k' : totalVol.toLocaleString('es-AR')}</div>
          <div class="stat-label">Vol. total (kg)</div>
        </div>
      </div>

      ${allExercisesWithData.length === 0 ? _noDataHTML() : _chartSectionHTML(allExercisesWithData)}
    </div>
  `;

  if (allExercisesWithData.length > 0) {
    _bindEvents(allExercisesWithData);
    _renderChart();
  }

  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
}

function _chartSectionHTML(exercises) {
  const group = _selectedEx
    ? MUSCLE_GROUPS.find(g => g.id === exercises.find(e => e.id === _selectedEx)?.muscleGroup)
    : null;

  const history = _selectedEx ? getExerciseHistory(_selectedEx) : [];
  const maxWeight = history.length ? Math.max(...history.map(h => h.maxWeight)) : 0;
  const firstDate = history.length ? history[0].date : '';
  const progress  = history.length >= 2
    ? (history[history.length - 1].maxWeight - history[0].maxWeight).toFixed(1)
    : null;

  return `
    <!-- Selector de ejercicio -->
    <div class="section-header">
      <span class="section-title">Ejercicio</span>
    </div>
    <div class="search-bar" style="margin-bottom:var(--space-3)">
      <i data-lucide="search"></i>
      <input type="text" class="input-field" id="progress-search" placeholder="Buscar ejercicio...">
    </div>
    <div class="chip-group" id="exercise-chips" style="margin-bottom:var(--space-5)">
      ${exercises.map(ex => {
        const g = MUSCLE_GROUPS.find(m => m.id === ex.muscleGroup);
        return `
          <button class="chip ${ex.id === _selectedEx ? 'active' : ''}" data-exercise-id="${ex.id}">
            ${ex.name}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Gráfico -->
    <div class="chart-card">
      <div class="chart-title" id="chart-title">${_selectedEx ? exercises.find(e => e.id === _selectedEx)?.name : ''}</div>
      <div class="chart-subtitle">
        ${history.length} registro${history.length !== 1 ? 's' : ''}
        ${maxWeight ? ` · Mejor: ${maxWeight} kg` : ''}
        ${progress !== null ? ` · ${parseFloat(progress) >= 0 ? '+' : ''}${progress} kg` : ''}
      </div>
      <div class="chart-wrapper">
        <canvas id="progress-chart"></canvas>
      </div>
    </div>

    <!-- Tabla de historial -->
    ${history.length > 0 ? _historyTableHTML(history) : ''}
  `;
}

function _historyTableHTML(history) {
  const rows = [...history].reverse().slice(0, 10).map(h => `
    <div style="display:grid;grid-template-columns:1fr 80px 80px 80px;gap:var(--space-2);padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);font-size:var(--text-sm);align-items:center">
      <span style="color:var(--text-secondary)">${h.date.split('-').reverse().join('/')}</span>
      <span style="text-align:center;font-weight:var(--weight-semibold);font-variant-numeric:tabular-nums">${h.maxWeight}</span>
      <span style="text-align:center;color:var(--text-secondary);font-variant-numeric:tabular-nums">${h.sets}</span>
      <span style="text-align:center;color:var(--text-secondary);font-variant-numeric:tabular-nums">${h.totalReps}</span>
    </div>
  `).join('');

  return `
    <div class="chart-card" style="padding-bottom:0">
      <div style="display:grid;grid-template-columns:1fr 80px 80px 80px;gap:var(--space-2);margin-bottom:var(--space-2)">
        <span style="font-size:var(--text-xs);font-weight:var(--weight-semibold);text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary)">Fecha</span>
        <span style="font-size:var(--text-xs);font-weight:var(--weight-semibold);text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary);text-align:center">Máx kg</span>
        <span style="font-size:var(--text-xs);font-weight:var(--weight-semibold);text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary);text-align:center">Series</span>
        <span style="font-size:var(--text-xs);font-weight:var(--weight-semibold);text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary);text-align:center">Reps</span>
      </div>
      ${rows}
      <div style="height:var(--space-5)"></div>
    </div>
  `;
}

function _noDataHTML() {
  return `
    <div class="empty-state">
      <i data-lucide="bar-chart-3" style="width:48px;height:48px;color:var(--text-tertiary)"></i>
      <h3>Sin datos todavía</h3>
      <p>Registrá al menos una sesión para ver tu evolución aquí.</p>
    </div>
  `;
}

// ── Chart ──────────────────────────────────────────────────

function _renderChart() {
  if (!_selectedEx) return;

  const canvas = document.getElementById('progress-chart');
  if (!canvas) return;

  const history = getExerciseHistory(_selectedEx);
  if (!history.length) return;

  const labels = history.map(h => {
    const [, m, d] = h.date.split('-');
    return `${d}/${m}`;
  });
  const weights = history.map(h => h.maxWeight);
  const isDark  = document.documentElement.dataset.theme === 'dark';

  const gridColor  = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor  = isDark ? '#606060' : '#999999';
  const accentColor = isDark ? '#4ade80' : '#16a34a';

  if (_chart) _chart.destroy();

  _chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso máximo (kg)',
        data:  weights,
        borderColor:     accentColor,
        backgroundColor: isDark ? 'rgba(74,222,128,.1)' : 'rgba(22,163,74,.1)',
        pointBackgroundColor: accentColor,
        pointBorderColor:    'transparent',
        pointRadius:      4,
        pointHoverRadius: 6,
        fill:  true,
        tension: 0.3,
        borderWidth: 2,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#242424' : '#ffffff',
          borderColor:     isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)',
          borderWidth:     1,
          titleColor:      isDark ? '#f2f2f2' : '#111111',
          bodyColor:       isDark ? '#9a9a9a' : '#555555',
          padding:         10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} kg`,
          },
        },
      },
      scales: {
        x: {
          grid:  { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
        },
        y: {
          grid:  { color: gridColor },
          ticks: { color: textColor, font: { size: 11 }, callback: v => `${v} kg` },
          beginAtZero: false,
        },
      },
    },
  });
}

// ── Events ─────────────────────────────────────────────────

function _bindEvents(exercises) {
  const chips = _container.querySelector('#exercise-chips');
  const search = _container.querySelector('#progress-search');

  chips?.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    _selectedEx = chip.dataset.exerciseId;
    _render();
  });

  search?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    _container.querySelectorAll('.chip').forEach(chip => {
      chip.style.display = chip.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ── Utils ──────────────────────────────────────────────────

function _getExercisesWithHistory() {
  const sessions = getSessions();
  const custom   = getCustomExercises();

  // Derivar la lista directamente desde las sesiones: incluye ejercicios
  // predefinidos, externos y custom sin depender de la biblioteca local.
  const byId = new Map();
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      if (ex.sets.some(set => set.weight > 0) && !byId.has(ex.exerciseId)) {
        const customEx = custom.find(c => c.id === ex.exerciseId);
        byId.set(ex.exerciseId, {
          id:          ex.exerciseId,
          name:        customEx?.name ?? ex.name,
          muscleGroup: customEx?.muscleGroup ?? ex.muscleGroup ?? 'general',
        });
      }
    });
  });

  return [...byId.values()];
}

function _getDefaultExercise() {
  const withData = _getExercisesWithHistory();
  return withData.length ? withData[0].id : null;
}
