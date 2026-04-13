/**
 * progress.js — Vista "Progreso"
 *
 * Tabs:
 *   1. Ejercicio  — gráfico de línea (peso máx. o volumen) por ejercicio
 *   2. Grupos     — gráfico de barras de sesiones por grupo muscular
 *   3. Récords    — lista de PRs personales
 *   4. Estadísticas — métricas semanales/mensuales, racha, distribución
 */

import {
  getExerciseHistory, getSessions, getCustomExercises, getPRs,
  getProfile, getBestOneRM, getAchievements,
  calcCurrentStreak, calcMaxStreak, calcTotalVolume,
} from '../store.js';
import { MUSCLE_GROUPS } from '../data/exercises.js';
import { ACHIEVEMENT_DEFS, ACHIEVEMENT_CATEGORY_LABELS } from '../data/achievements.js';

// Hex fijos de los grupos musculares (mirror de variables.css)
const GROUP_COLORS = {
  'chest-triceps':  '#f97316',
  'back-biceps':    '#3b82f6',
  'shoulders-legs': '#a855f7',
  'general':        '#14b8a6',
};

// ── Estado del módulo ──────────────────────────────────────

let _container    = null;
let _chart        = null;
let _groupChart   = null;
let _weightChart  = null;
let _activeTab    = 'ejercicio';  // 'ejercicio' | 'grupos' | 'records' | 'stats' | 'logros'
let _selectedEx   = null;
let _chartMetric  = 'weight';     // 'weight' | 'volume'
let _groupPeriod  = '1m';         // '1w' | '1m' | '3m'
let _statsPeriod  = '1m';         // '1w' | '1m' | '3m' | 'all'

let _clickHandler = null;
let _inputHandler = null;

// ── Entry point ────────────────────────────────────────────

export const ProgressView = {
  render(container) {
    _container  = container;
    _selectedEx = _getDefaultExercise();
    _bindEvents();
    _render();
  },
  destroy() {
    _destroyCharts();
    if (_clickHandler) { _container?.removeEventListener('click', _clickHandler); _clickHandler = null; }
    if (_inputHandler) { _container?.removeEventListener('input', _inputHandler); _inputHandler = null; }
  },
};

// ── Main render ────────────────────────────────────────────

function _render() {
  _destroyCharts();

  const sessions  = getSessions();
  const totalVol  = calcTotalVolume(sessions);
  const totalSets = sessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) => es + ex.sets.length, 0), 0);

  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Progreso</h1>
      <p class="page-subtitle">Seguí tu evolución</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${sessions.length}</div>
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

      <div class="progress-tabs">
        ${['ejercicio', 'grupos', 'records', 'stats', 'logros'].map(t => `
          <button class="progress-tab${_activeTab === t ? ' active' : ''}" data-tab="${t}">
            ${_tabLabel(t)}
          </button>
        `).join('')}
      </div>

      <div id="progress-tab-content">
        ${_renderTabContent()}
      </div>
    </div>
  `;

  _renderCharts();
  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
}

function _tabLabel(tab) {
  return {
    ejercicio: 'Ejercicio',
    grupos:    'Grupos',
    records:   'Récords',
    stats:     'Estadísticas',
    logros:    'Logros',
  }[tab];
}

function _renderTabContent() {
  switch (_activeTab) {
    case 'ejercicio': return _ejercicioTabHTML();
    case 'grupos':    return _gruposTabHTML();
    case 'records':   return _recordsTabHTML();
    case 'stats':     return _statsTabHTML();
    case 'logros':    return _logrosTabHTML();
    default:          return '';
  }
}

// ── Tab: Ejercicio ─────────────────────────────────────────

function _ejercicioTabHTML() {
  const exercises = _getExercisesWithHistory();
  if (!exercises.length) return _noDataHTML();

  const history   = _selectedEx ? getExerciseHistory(_selectedEx) : [];
  const exName    = exercises.find(e => e.id === _selectedEx)?.name ?? '';
  const maxWeight = history.length ? Math.max(...history.map(h => h.maxWeight)) : 0;
  const maxVol    = history.length ? Math.max(...history.map(h => h.totalVolume)) : 0;

  let subtitleExtra = '';
  if (history.length >= 2) {
    const delta = _chartMetric === 'weight'
      ? (history[history.length - 1].maxWeight - history[0].maxWeight).toFixed(1)
      : (history[history.length - 1].totalVolume - history[0].totalVolume).toFixed(0);
    subtitleExtra = ` · ${parseFloat(delta) >= 0 ? '+' : ''}${delta}${_chartMetric === 'weight' ? ' kg' : ' kg vol.'}`;
  }

  const subtitle = _chartMetric === 'weight'
    ? `${history.length} registro${history.length !== 1 ? 's' : ''}${maxWeight ? ` · Mejor: ${maxWeight} kg` : ''}${subtitleExtra}`
    : `${history.length} registro${history.length !== 1 ? 's' : ''}${maxVol ? ` · Máx: ${maxVol.toLocaleString('es-AR')} kg` : ''}${subtitleExtra}`;

  return `
    <div class="search-bar" style="margin-bottom:var(--space-3)">
      <i data-lucide="search"></i>
      <input type="text" class="input-field" id="progress-search" placeholder="Buscar ejercicio...">
    </div>
    <div class="chip-group" id="exercise-chips" style="margin-bottom:var(--space-4)">
      ${exercises.map(ex => `
        <button class="chip${ex.id === _selectedEx ? ' active' : ''}" data-exercise-id="${ex.id}">${ex.name}</button>
      `).join('')}
    </div>

    <div class="chart-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-2)">
        <div>
          <div class="chart-title">${exName}</div>
          <div class="chart-subtitle">${subtitle}</div>
        </div>
        <div class="metric-toggle">
          <button class="metric-btn${_chartMetric === 'weight' ? ' active' : ''}" data-metric="weight">Peso máx.</button>
          <button class="metric-btn${_chartMetric === 'volume' ? ' active' : ''}" data-metric="volume">Volumen</button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas id="progress-chart"></canvas>
      </div>
    </div>

    ${history.length > 0 ? _historyTableHTML(history) : ''}
    ${_selectedEx ? _oneRMHTML(_selectedEx) : ''}
  `;
}

function _oneRMHTML(exerciseId) {
  const best = getBestOneRM(exerciseId);
  if (!best) return '';
  return `
    <div class="chart-card" style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-4)">
      <div>
        <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:2px">1RM estimado (Epley)</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Basado en ${best.weight} kg × ${best.reps} reps</div>
      </div>
      <div style="font-size:var(--text-xl);font-weight:var(--weight-bold);color:var(--accent-primary);white-space:nowrap">
        ${best.rm} kg
      </div>
    </div>
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

// ── Tab: Grupos ────────────────────────────────────────────

function _gruposTabHTML() {
  const periodSessions = _filterSessionsByPeriod(getSessions(), _groupPeriod);
  const counts         = _getMuscleGroupCounts(periodSessions);
  const hasData        = Object.values(counts).some(v => v > 0);

  const PERIOD_LABELS = { '1w': 'Semana', '1m': 'Mes', '3m': '3 meses' };

  const sorted = [...MUSCLE_GROUPS].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  const maxCount = Math.max(...sorted.map(g => counts[g.id] || 0), 1);

  return `
    <div class="chip-group" style="margin-bottom:var(--space-4)">
      ${Object.entries(PERIOD_LABELS).map(([k, l]) => `
        <button class="chip${_groupPeriod === k ? ' active' : ''}" data-group-period="${k}">${l}</button>
      `).join('')}
    </div>

    <div class="chart-card">
      <div class="chart-title">Sesiones por grupo muscular</div>
      <div class="chart-subtitle">${_periodLabel(_groupPeriod)}</div>
      <div class="chart-wrapper" style="height:200px">
        <canvas id="group-chart"></canvas>
      </div>
    </div>

    ${hasData ? `
      <div class="chart-card">
        ${sorted.map(g => {
          const count = counts[g.id] || 0;
          const pct   = (count / maxCount) * 100;
          const color = GROUP_COLORS[g.id] ?? 'var(--accent-primary)';
          return `
            <div style="margin-bottom:var(--space-4)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-1)">
                <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${g.shortName}</span>
                <span style="font-size:var(--text-sm);color:var(--text-secondary);font-variant-numeric:tabular-nums">${count} sesión${count !== 1 ? 'es' : ''}</span>
              </div>
              <div style="height:6px;background:var(--bg-hover);border-radius:var(--radius-full);overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:var(--radius-full);transition:width .4s ease"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `<div class="empty-state"><h3>Sin datos en este período</h3><p>Registrá sesiones para ver la distribución por grupo.</p></div>`}
  `;
}

// ── Tab: Récords ───────────────────────────────────────────

function _recordsTabHTML() {
  const prs     = getPRs();
  const entries = Object.values(prs).sort((a, b) => b.weight - a.weight);

  if (!entries.length) {
    return `
      <div class="empty-state">
        <i data-lucide="trophy" style="width:48px;height:48px;color:var(--text-tertiary)"></i>
        <h3>Sin récords todavía</h3>
        <p>Completá sesiones con ejercicios de fuerza para registrar tus PRs.</p>
      </div>
    `;
  }

  return `
    <div class="chart-card" style="padding:0;overflow:hidden">
      ${entries.map((pr, i) => `
        <div class="pr-item${i < entries.length - 1 ? ' pr-item-border' : ''}">
          <div style="min-width:0">
            <div class="pr-item-name">${pr.name}</div>
            <div class="pr-item-date">${pr.date ? pr.date.split('-').reverse().join('/') : ''}</div>
          </div>
          <div class="pr-item-weight">
            <span style="font-size:var(--text-base)">🏆</span>
            <span class="pr-item-kg">${pr.weight} kg</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Tab: Estadísticas ──────────────────────────────────────

function _statsTabHTML() {
  const PERIOD_LABELS  = { '1w': 'Semana', '1m': 'Mes', '3m': '3 meses', 'all': 'Todo' };
  const allSessions    = getSessions();
  const periodSessions = _filterSessionsByPeriod(allSessions, _statsPeriod);
  const stats          = _calcStats(periodSessions, allSessions);

  const weightHistory  = (getProfile().weightHistory ?? []).sort((a, b) => a.date.localeCompare(b.date));
  const hasWeightChart = weightHistory.length >= 2;

  return `
    <div class="chip-group" style="margin-bottom:var(--space-4)">
      ${Object.entries(PERIOD_LABELS).map(([k, l]) => `
        <button class="chip${_statsPeriod === k ? ' active' : ''}" data-stats-period="${k}">${l}</button>
      `).join('')}
    </div>

    <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-3)">
      <div class="stat-card">
        <div class="stat-value">${stats.avgPerWeek}</div>
        <div class="stat-label">Sesiones / semana</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${periodSessions.length}</div>
        <div class="stat-label">En el período</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.currentStreak}</div>
        <div class="stat-label">Racha actual (días)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.maxStreak}</div>
        <div class="stat-label">Racha máxima (días)</div>
      </div>
    </div>

    ${stats.topDays.length ? `
      <div class="chart-card" style="margin-bottom:var(--space-3)">
        <div class="chart-title" style="margin-bottom:var(--space-2)">Días más frecuentes</div>
        <p style="font-size:var(--text-base);color:var(--text-secondary);margin:0">
          Entrenás más los <strong style="color:var(--accent-primary)">${stats.topDays.join(' y ')}</strong>
        </p>
      </div>
    ` : ''}

    <div class="chart-card">
      <div class="chart-title" style="margin-bottom:var(--space-4)">Distribución por día</div>
      ${_weekdayDistHTML(periodSessions)}
    </div>

    ${hasWeightChart ? `
      <div class="chart-card" style="margin-top:var(--space-3)">
        <div class="chart-title">Evolución de peso corporal</div>
        <div class="chart-subtitle">${weightHistory.length} registros · Último: ${weightHistory.slice(-1)[0].weightKg} kg</div>
        <div class="chart-wrapper">
          <canvas id="weight-chart"></canvas>
        </div>
      </div>
    ` : ''}
  `;
}

function _weekdayDistHTML(sessions) {
  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const counts     = [0, 0, 0, 0, 0, 0, 0];
  sessions.forEach(s => {
    const [y, m, d] = s.date.split('-').map(Number);
    counts[new Date(y, m - 1, d).getDay()]++;
  });
  const maxC = Math.max(...counts, 1);

  return `
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:var(--space-2);height:72px;align-items:end">
      ${counts.map((c, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;justify-content:flex-end">
          <span style="font-size:9px;color:var(--text-tertiary);font-variant-numeric:tabular-nums;min-height:12px">${c || ''}</span>
          <div style="width:100%;background:var(--accent-primary);border-radius:3px 3px 0 0;height:${Math.max((c / maxC) * 100, c > 0 ? 8 : 0)}%;opacity:${c > 0 ? 0.85 : 0.12}"></div>
        </div>
      `).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:var(--space-2);margin-top:var(--space-2)">
      ${DAY_LABELS.map(l => `
        <span style="text-align:center;font-size:var(--text-xs);color:var(--text-tertiary)">${l}</span>
      `).join('')}
    </div>
  `;
}

// ── Charts ─────────────────────────────────────────────────

function _renderCharts() {
  if (_activeTab === 'ejercicio') _renderExerciseChart();
  if (_activeTab === 'grupos')    _renderGroupChart();
  if (_activeTab === 'stats')     _renderWeightChart();
}

function _renderExerciseChart() {
  if (!_selectedEx) return;
  const canvas = document.getElementById('progress-chart');
  if (!canvas) return;

  const history = getExerciseHistory(_selectedEx);
  if (!history.length) return;

  const isDark    = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor = isDark ? '#606060' : '#999999';

  const isVolume  = _chartMetric === 'volume';
  const color     = isVolume ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#4ade80' : '#16a34a');
  const bgColor   = isVolume
    ? (isDark ? 'rgba(96,165,250,.1)' : 'rgba(37,99,235,.1)')
    : (isDark ? 'rgba(74,222,128,.1)' : 'rgba(22,163,74,.1)');

  const labels = history.map(h => h.date.split('-').slice(1).reverse().join('/'));
  const data   = isVolume ? history.map(h => h.totalVolume) : history.map(h => h.maxWeight);

  if (_chart) _chart.destroy();
  _chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:               isVolume ? 'Volumen (kg)' : 'Peso máximo (kg)',
        data,
        borderColor:         color,
        backgroundColor:     bgColor,
        pointBackgroundColor: color,
        pointBorderColor:    'transparent',
        pointRadius:         4,
        pointHoverRadius:    6,
        fill:                true,
        tension:             0.3,
        borderWidth:         2,
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
            label: ctx => isVolume
              ? ` ${ctx.parsed.y.toLocaleString('es-AR')} kg vol.`
              : ` ${ctx.parsed.y} kg`,
          },
        },
      },
      scales: {
        x: {
          grid:  { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
        },
        y: {
          grid:        { color: gridColor },
          ticks:       {
            color: textColor,
            font:  { size: 11 },
            callback: v => isVolume
              ? (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)
              : `${v} kg`,
          },
          beginAtZero: false,
        },
      },
    },
  });
}

function _renderGroupChart() {
  const canvas = document.getElementById('group-chart');
  if (!canvas) return;

  const sessions = _filterSessionsByPeriod(getSessions(), _groupPeriod);
  const counts   = _getMuscleGroupCounts(sessions);

  const isDark    = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor = isDark ? '#606060' : '#999999';

  const labels = MUSCLE_GROUPS.map(g => g.shortName);
  const data   = MUSCLE_GROUPS.map(g => counts[g.id] || 0);
  const colors = MUSCLE_GROUPS.map(g => GROUP_COLORS[g.id] ?? '#888');

  if (_groupChart) _groupChart.destroy();
  _groupChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor:     colors,
        borderWidth:     1.5,
        borderRadius:    5,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
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
            label: ctx => ` ${ctx.parsed.y} sesión${ctx.parsed.y !== 1 ? 'es' : ''}`,
          },
        },
      },
      scales: {
        x: {
          grid:  { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
        },
        y: {
          grid:        { color: gridColor },
          ticks:       { color: textColor, font: { size: 11 }, precision: 0 },
          beginAtZero: true,
        },
      },
    },
  });
}

function _renderWeightChart() {
  const canvas = document.getElementById('weight-chart');
  if (!canvas) return;

  const history = (getProfile().weightHistory ?? []).sort((a, b) => a.date.localeCompare(b.date));
  if (history.length < 2) return;

  const isDark    = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textColor = isDark ? '#606060' : '#999999';
  const color     = isDark ? '#a78bfa' : '#7c3aed';   // púrpura
  const bgColor   = isDark ? 'rgba(167,139,250,.1)' : 'rgba(124,58,237,.1)';

  const labels = history.map(h => h.date.split('-').slice(1).reverse().join('/'));
  const data   = history.map(h => h.weightKg);

  if (_weightChart) _weightChart.destroy();
  _weightChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:                'Peso (kg)',
        data,
        borderColor:          color,
        backgroundColor:      bgColor,
        pointBackgroundColor: color,
        pointBorderColor:     'transparent',
        pointRadius:          4,
        pointHoverRadius:     6,
        fill:                 true,
        tension:              0.3,
        borderWidth:          2,
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
          callbacks: { label: ctx => ` ${ctx.parsed.y} kg` },
        },
      },
      scales: {
        x: {
          grid:  { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
        },
        y: {
          grid:        { color: gridColor },
          ticks:       { color: textColor, font: { size: 11 }, callback: v => `${v} kg` },
          beginAtZero: false,
        },
      },
    },
  });
}

function _destroyCharts() {
  if (_chart)       { _chart.destroy();       _chart = null; }
  if (_groupChart)  { _groupChart.destroy();  _groupChart = null; }
  if (_weightChart) { _weightChart.destroy(); _weightChart = null; }
}

// ── Events ─────────────────────────────────────────────────

function _bindEvents() {
  _clickHandler = e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { _activeTab = tab.dataset.tab; _render(); return; }

    const exChip = e.target.closest('[data-exercise-id]');
    if (exChip) { _selectedEx = exChip.dataset.exerciseId; _render(); return; }

    const metricBtn = e.target.closest('[data-metric]');
    if (metricBtn) { _chartMetric = metricBtn.dataset.metric; _render(); return; }

    const gpBtn = e.target.closest('[data-group-period]');
    if (gpBtn) { _groupPeriod = gpBtn.dataset.groupPeriod; _render(); return; }

    const spBtn = e.target.closest('[data-stats-period]');
    if (spBtn) { _statsPeriod = spBtn.dataset.statsPeriod; _render(); return; }
  };

  _inputHandler = e => {
    if (e.target.id === 'progress-search') {
      const q = e.target.value.toLowerCase();
      _container.querySelectorAll('[data-exercise-id]').forEach(chip => {
        chip.style.display = chip.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
  };

  _container.addEventListener('click', _clickHandler);
  _container.addEventListener('input', _inputHandler);
}

// ── Tab: Logros ────────────────────────────────────────────

function _logrosTabHTML() {
  const allSessions   = getSessions();
  const prs           = getPRs();
  const prCount       = Object.keys(prs).length;
  const totalVolume   = calcTotalVolume(allSessions);
  const currentStreak = calcCurrentStreak(allSessions);
  const maxStreak     = calcMaxStreak(allSessions);
  const sessionCount  = allSessions.length;
  const ctx           = { sessionCount, prCount, totalVolume, currentStreak, maxStreak };

  const unlocked    = getAchievements();
  const unlockedMap = new Map(unlocked.map(a => [a.id, a]));

  const categories = ['sessions', 'streak', 'prs', 'volume'];

  if (!allSessions.length) {
    return `
      <div class="empty-state">
        <i data-lucide="award" style="width:48px;height:48px;color:var(--text-tertiary)"></i>
        <h3>Sin logros todavía</h3>
        <p>Completá tu primera sesión para comenzar a desbloquear logros.</p>
      </div>
    `;
  }

  return categories.map(cat => {
    const defs = ACHIEVEMENT_DEFS.filter(d => d.category === cat);
    return `
      <div style="margin-bottom:var(--space-5)">
        <div class="exercise-group-header" style="margin-bottom:var(--space-3)">${ACHIEVEMENT_CATEGORY_LABELS[cat]}</div>
        <div class="achievements-grid">
          ${defs.map(def => _achievementCardHTML(def, unlockedMap.get(def.id), ctx)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function _achievementCardHTML(def, unlockData, ctx) {
  const isUnlocked = !!unlockData;
  const progress   = def.progress ? def.progress(ctx) : null;
  const pct        = progress
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : 0;
  const dateLabel  = unlockData?.unlockedAt
    ? unlockData.unlockedAt.split('-').reverse().join('/')
    : null;

  return `
    <div class="achievement-card${isUnlocked ? ' unlocked' : ' locked'}">
      <div class="achievement-name">${def.name}</div>
      <div class="achievement-desc">${isUnlocked ? def.description : def.hint}</div>
      ${dateLabel ? `<div class="achievement-date">${dateLabel}</div>` : ''}
      ${!isUnlocked && progress ? `
        <div class="achievement-progress-bar">
          <div style="width:${pct}%"></div>
        </div>
        <div class="achievement-progress-text">${_fmtProgress(progress.current, progress.target)}</div>
      ` : ''}
    </div>
  `;
}

function _fmtProgress(current, target) {
  const cur = current >= 1000
    ? `${(current / 1000).toFixed(1)}k`
    : Math.min(current, target).toLocaleString('es-AR');
  const tgt = target >= 1000
    ? `${(target / 1000).toFixed(0)}k`
    : target.toLocaleString('es-AR');
  return `${cur} / ${tgt}`;
}

// ── Utils ──────────────────────────────────────────────────

function _noDataHTML() {
  return `
    <div class="empty-state">
      <i data-lucide="bar-chart-3" style="width:48px;height:48px;color:var(--text-tertiary)"></i>
      <h3>Sin datos todavía</h3>
      <p>Registrá al menos una sesión para ver tu evolución aquí.</p>
    </div>
  `;
}

function _getExercisesWithHistory() {
  const sessions = getSessions();
  const custom   = getCustomExercises();
  const byId     = new Map();

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

function _filterSessionsByPeriod(sessions, period) {
  if (period === 'all') return sessions;
  const days    = { '1w': 7, '1m': 30, '3m': 90 }[period] ?? 30;
  const cutoff  = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffISO = _dateToISO(cutoff);
  return sessions.filter(s => s.date >= cutoffISO);
}

function _getMuscleGroupCounts(sessions) {
  const counts = {};
  MUSCLE_GROUPS.forEach(g => { counts[g.id] = 0; });

  sessions.forEach(s => {
    const groupIds = [...new Set(
      s.exercises.map(ex => ex.muscleGroup).filter(g => g && g !== 'general'),
    )];
    groupIds.forEach(gId => { if (counts[gId] !== undefined) counts[gId]++; });
  });

  return counts;
}

function _periodLabel(period) {
  return {
    '1w':  'Última semana',
    '1m':  'Último mes',
    '3m':  'Últimos 3 meses',
    'all': 'Todo el tiempo',
  }[period] ?? '';
}

function _calcStats(periodSessions, allSessions) {
  // Promedio sesiones/semana en el período
  const days = { '1w': 7, '1m': 30, '3m': 90, 'all': null }[_statsPeriod];
  let avgPerWeek;
  if (days) {
    avgPerWeek = (periodSessions.length / (days / 7)).toFixed(1);
  } else {
    const span = _weekSpan(allSessions);
    avgPerWeek = span > 0 ? (allSessions.length / span).toFixed(1) : allSessions.length.toFixed(1);
  }

  // Días más frecuentes
  const dayCount = [0, 0, 0, 0, 0, 0, 0];
  periodSessions.forEach(s => {
    const [y, m, d] = s.date.split('-').map(Number);
    dayCount[new Date(y, m - 1, d).getDay()]++;
  });
  const DAY_NAMES = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
  const maxCount  = Math.max(...dayCount);
  const topDays   = maxCount > 0
    ? dayCount
        .map((c, i) => ({ c, name: DAY_NAMES[i] }))
        .filter(d => d.c === maxCount)
        .map(d => d.name)
    : [];

  // Rachas (siempre sobre todos los datos históricos)
  const currentStreak = calcCurrentStreak(allSessions);
  const maxStreak     = calcMaxStreak(allSessions);

  return { avgPerWeek, topDays, currentStreak, maxStreak };
}

function _weekSpan(sessions) {
  if (!sessions.length) return 0;
  const dates = sessions.map(s => s.date).sort();
  const first = new Date(dates[0] + 'T00:00:00');
  const last  = new Date(dates[dates.length - 1] + 'T00:00:00');
  return Math.max(1, Math.round((last - first) / (7 * 86400000)) + 1);
}

function _dateToISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
