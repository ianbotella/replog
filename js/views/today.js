/**
 * today.js — Vista "Hoy"
 *
 * Flujo:
 *   1. Pantalla de inicio: botón "Sesión libre" + rutinas sugeridas.
 *   2. Sesión activa: agregar ejercicios de cualquier grupo + registrar sets.
 *      El badge del encabezado se detecta automáticamente de los ejercicios agregados.
 */

import {
  getTodaySession, createSession, saveSession, getCustomExercises,
  todayISO, formatDateDisplay, currentWeekDays, getThisWeekSessions,
} from '../store.js';
import {
  MUSCLE_GROUPS, GENERAL_GROUP, findExerciseById, getSessionGroupDisplay,
} from '../data/exercises.js';
import { fetchExternalExercises } from '../data/freeExerciseDb.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

// Estado local de la vista
let _session       = null;
let _container     = null;
let _timerInterval = null;

// ── Entry point ────────────────────────────────────────────

export const TodayView = {
  render(container) {
    _container = container;
    _session   = getTodaySession();
    _render();
  },
  destroy() {
    if (_timerInterval) clearInterval(_timerInterval);
    _timerInterval = null;
  },
};

// ── Render principal ───────────────────────────────────────

function _render() {
  if (!_session) {
    _renderStartScreen();
  } else {
    _renderActiveSession();
  }
  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
}

// ── Pantalla de inicio ─────────────────────────────────────

function _renderStartScreen() {
  const today          = formatDateDisplay(todayISO());
  const weekDays       = currentWeekDays();
  const completedDates = new Set(getThisWeekSessions().map(s => s.date));

  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Hoy</h1>
      <p class="page-subtitle">${_capitalize(today)}</p>

      ${_weekStripHTML(weekDays, completedDates)}

      <button class="btn btn-primary btn-lg btn-full" id="start-free-btn">
        <i data-lucide="play"></i>
        Iniciar sesión
      </button>
    </div>
  `;

  _container.querySelector('#start-free-btn').addEventListener('click', _startFreeSession);
}

// ── Sesión activa ─────────────────────────────────────────

function _renderActiveSession() {
  const custom    = getCustomExercises();
  const groupInfo = getSessionGroupDisplay(_session, custom);
  const weekDays  = currentWeekDays();
  const completedDates = new Set(getThisWeekSessions().map(s => s.date));

  _container.innerHTML = `
    <div class="view">
      ${_weekStripHTML(weekDays, completedDates)}

      <div class="active-session-header">
        <div>
          <span id="session-group-badge" class="badge ${groupInfo.badgeClass}">${groupInfo.name}</span>
          <h2 class="page-title" style="margin-top:var(--space-2)">Sesión activa</h2>
        </div>
        <div class="session-timer">
          <i data-lucide="timer"></i>
          <span id="timer-display">00:00</span>
        </div>
      </div>

      <!-- Bloques de ejercicios -->
      <div id="exercises-list">
        ${_session.exercises.map((ex, idx) => _exerciseBlockHTML(ex, idx)).join('')}
      </div>

      <!-- Botón agregar ejercicio -->
      <button id="add-exercise-btn" class="exercise-block" style="display:flex;align-items:center;justify-content:center;gap:var(--space-3);padding:var(--space-4) var(--space-5);cursor:pointer;border-style:dashed;color:var(--accent-primary);font-weight:var(--weight-semibold);font-size:var(--text-sm);background:var(--accent-subtle);">
        <i data-lucide="plus-circle"></i>
        Agregar ejercicio
      </button>

      <!-- Notas -->
      <div style="margin-top:var(--space-4)">
        <label class="label" for="session-notes">Notas</label>
        <textarea id="session-notes" class="input-field notes-area"
          placeholder="Cómo fue el entreno...">${_session.notes || ''}</textarea>
      </div>

      <!-- Acciones -->
      <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="cancel-session-btn" style="flex:1">Cancelar</button>
        <button class="btn btn-primary btn-lg" id="finish-session-btn" style="flex:2">
          <i data-lucide="check"></i>
          Finalizar sesión
        </button>
      </div>
    </div>
  `;

  _bindActiveSessionEvents();
  _startTimer();
}

// ── Exercise block HTML ────────────────────────────────────

function _exerciseBlockHTML(ex, idx) {
  const libEx  = findExerciseById(ex.exerciseId, getCustomExercises());
  const type   = libEx?.type   ?? ex.type   ?? 'strength';
  const metric = libEx?.metric ?? ex.metric ?? 'reps';

  const emptyMsg  = `<div style="padding:var(--space-3) var(--space-5);color:var(--text-tertiary);font-size:var(--text-sm)">Sin series todavía</div>`;
  const setsHTML  = ex.sets.length === 0
    ? emptyMsg
    : _setsHeaderHTML(type, metric) + ex.sets.map((set, si) => _setRowHTML(idx, set, si, type, metric)).join('');

  const addLabel  = type === 'cardio' ? 'Agregar vuelta' : 'Agregar serie';
  const typeBadge = type !== 'strength'
    ? `<span class="badge badge-general" style="margin-left:var(--space-2)">${_typeBadgeLabel(type, metric)}</span>`
    : '';

  return `
    <div class="exercise-block" data-ex-idx="${idx}" data-ex-type="${type}">
      <div class="exercise-block-header">
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:var(--space-1)">
          <span class="exercise-name">${ex.name}</span>
          ${typeBadge}
        </div>
        <button class="icon-btn delete-exercise-btn" data-ex="${idx}" aria-label="Eliminar ejercicio">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
      <div class="sets-table" id="sets-table-${idx}">
        ${setsHTML}
      </div>
      <div class="sets-footer">
        <button class="btn btn-ghost btn-sm add-set-btn" data-ex="${idx}">
          <i data-lucide="plus"></i> ${addLabel}
        </button>
      </div>
    </div>
  `;
}

function _setsHeaderHTML(type, metric) {
  if (type === 'cardio') {
    return `<div class="sets-header sets-header-cardio">
      <span>Vuelta</span><span>Tiempo (min)</span><span>km/h</span><span>Incl. %</span><span></span>
    </div>`;
  }
  if (type === 'mobility' && metric === 'time') {
    return `<div class="sets-header sets-header-simple">
      <span>Serie</span><span>Tiempo (seg)</span><span></span>
    </div>`;
  }
  if (type === 'mobility') {
    return `<div class="sets-header sets-header-simple">
      <span>Serie</span><span>Repeticiones</span><span></span>
    </div>`;
  }
  if (type === 'stretch') {
    return `<div class="sets-header sets-header-simple">
      <span>Serie</span><span>Duración (seg)</span><span></span>
    </div>`;
  }
  return `<div class="sets-header">
    <span>Serie</span><span>Peso (kg)</span><span>Reps</span><span></span>
  </div>`;
}

function _setRowHTML(exIdx, set, setIdx, type, metric) {
  const del = `<button class="set-delete-btn" data-ex="${exIdx}" data-set="${setIdx}" aria-label="Eliminar serie"><i data-lucide="trash-2"></i></button>`;
  const n   = setIdx + 1;

  if (type === 'cardio') {
    return `
      <div class="set-row set-row-cardio" data-ex="${exIdx}" data-set="${setIdx}">
        <span class="set-number">${n}</span>
        <input type="number" class="set-input" data-field="durationMin" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.durationMin || ''}" placeholder="20" min="0" step="1">
        <input type="number" class="set-input" data-field="speedKmh" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.speedKmh || ''}" placeholder="5.0" min="0" step="0.1">
        <input type="number" class="set-input" data-field="inclinePct" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.inclinePct !== undefined ? set.inclinePct : ''}" placeholder="0" min="0" max="30" step="0.5">
        ${del}
      </div>`;
  }

  if (type === 'mobility' || type === 'stretch') {
    const field = (metric === 'time' || type === 'stretch') ? 'durationSec' : 'reps';
    const ph    = field === 'durationSec' ? '30' : '10';
    return `
      <div class="set-row set-row-simple" data-ex="${exIdx}" data-set="${setIdx}">
        <span class="set-number">${n}</span>
        <input type="number" class="set-input" data-field="${field}" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set[field] || ''}" placeholder="${ph}" min="0" step="${field === 'durationSec' ? '5' : '1'}">
        ${del}
      </div>`;
  }

  return `
    <div class="set-row" data-ex="${exIdx}" data-set="${setIdx}">
      <span class="set-number">${n}</span>
      <div class="set-input-wrap">
        <input type="number" class="set-input" data-field="weight" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.weight || ''}" placeholder="0" min="0" step="0.5">
      </div>
      <div class="set-input-wrap">
        <input type="number" class="set-input" data-field="reps" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.reps || ''}" placeholder="0" min="0" step="1">
      </div>
      ${del}
    </div>`;
}

function _typeBadgeLabel(type, metric) {
  if (type === 'cardio')   return 'Cardio';
  if (type === 'stretch')  return 'Estiramiento';
  if (type === 'mobility') return metric === 'time' ? 'Movilidad · tiempo' : 'Movilidad · reps';
  return '';
}

// ── Event binding ──────────────────────────────────────────

function _bindActiveSessionEvents() {
  _container.querySelector('#add-exercise-btn').addEventListener('click', _openAddExerciseModal);
  _container.querySelector('#finish-session-btn').addEventListener('click', _finishSession);
  _container.querySelector('#cancel-session-btn').addEventListener('click', _cancelSession);
  _container.querySelector('#session-notes')
    .addEventListener('input', e => { _session.notes = e.target.value; });

  _container.addEventListener('click',  _handleExerciseListClick);
  _container.addEventListener('change', _handleSetInputChange);
  _container.addEventListener('input',  _handleSetInputChange);
}

function _handleExerciseListClick(e) {
  const addSetBtn = e.target.closest('.add-set-btn');
  if (addSetBtn) { _addSet(parseInt(addSetBtn.dataset.ex, 10)); return; }

  const delSetBtn = e.target.closest('.set-delete-btn');
  if (delSetBtn) {
    _deleteSet(parseInt(delSetBtn.dataset.ex, 10), parseInt(delSetBtn.dataset.set, 10));
    return;
  }

  const delExBtn = e.target.closest('.delete-exercise-btn');
  if (delExBtn) { _deleteExercise(parseInt(delExBtn.dataset.ex, 10)); return; }
}

function _handleSetInputChange(e) {
  const input = e.target.closest('.set-input');
  if (!input) return;
  const exIdx  = parseInt(input.dataset.ex, 10);
  const setIdx = parseInt(input.dataset.set, 10);
  _session.exercises[exIdx].sets[setIdx][input.dataset.field] = parseFloat(input.value) || 0;
  saveSession(_session);
}

// ── Acciones de sesión ─────────────────────────────────────

function _startFreeSession() {
  _session = createSession();
  _render();
}


function _finishSession() {
  if (_session.exercises.length === 0) {
    showToast('Agregá al menos un ejercicio antes de finalizar.', 'danger');
    return;
  }
  const started = new Date(_session.startedAt);
  _session.durationMin = Math.round((Date.now() - started.getTime()) / 60000);
  const notesEl = _container.querySelector('#session-notes');
  if (notesEl) _session.notes = notesEl.value;
  saveSession(_session);
  showToast('Sesión guardada correctamente.', 'success');
  if (_timerInterval) clearInterval(_timerInterval);
  setTimeout(() => { window.location.hash = '#/history'; }, 400);
}

function _cancelSession() {
  if (!confirm('¿Cancelar la sesión de hoy? Se perderán los datos.')) return;
  import('../store.js').then(({ deleteSession }) => {
    deleteSession(_session.id);
    _session = null;
    if (_timerInterval) clearInterval(_timerInterval);
    _render();
  });
}

// ── Modal agregar ejercicio ────────────────────────────────

async function _openAddExerciseModal() {
  const custom   = getCustomExercises();
  const external = await fetchExternalExercises();
  const all      = [...custom, ...external];

  // Secciones del filtro
  const filterSections = [
    { id: 'all',            label: 'Todos' },
    { id: 'chest-triceps',  label: 'Pecho + Tríceps' },
    { id: 'back-biceps',    label: 'Espalda + Bíceps' },
    { id: 'shoulders-legs', label: 'Hombros + Piernas' },
    { id: 'cardio',         label: '🔥 Cardio' },
    { id: 'stretch',        label: '🧘 Estiramiento' },
  ];

  let currentFilter = 'all';
  let currentSearch = '';

  const getFiltered = () => {
    let list = all;
    if      (currentFilter === 'cardio')  list = all.filter(e => e.type === 'cardio' || e.type === 'mobility');
    else if (currentFilter === 'stretch') list = all.filter(e => e.type === 'stretch');
    else if (currentFilter !== 'all')     list = all.filter(e => e.muscleGroup === currentFilter);
    if (currentSearch) list = list.filter(e => e.name.toLowerCase().includes(currentSearch.toLowerCase()));
    return list;
  };

  const buildListHTML = (exercises) => {
    if (!exercises.length) {
      return `<div style="text-align:center;padding:var(--space-8) 0;color:var(--text-tertiary);font-size:var(--text-sm)">Sin resultados</div>`;
    }
    const byCategory = {};
    exercises.forEach(ex => {
      if (!byCategory[ex.category]) byCategory[ex.category] = [];
      byCategory[ex.category].push(ex);
    });
    return Object.entries(byCategory).map(([cat, exs]) => `
      <div class="exercise-group-header">${cat}</div>
      ${exs.map(ex => {
        const alreadyAdded = _session.exercises.some(se => se.exerciseId === ex.id);
        return `
          <div class="exercise-item selectable-exercise${alreadyAdded ? ' ex-already-added' : ''}"
               data-id="${ex.id}" data-name="${ex.name}" style="cursor:pointer">
            <div class="exercise-item-info">
              <div class="exercise-item-name">${ex.name}</div>
              <div class="exercise-item-meta">${ex.custom ? 'Personalizado' : (_typeBadgeLabel(ex.type, ex.metric) || _groupName(ex.muscleGroup))}</div>
            </div>
            ${alreadyAdded
              ? `<i data-lucide="check" style="color:var(--accent-primary);width:16px;height:16px"></i>`
              : `<i data-lucide="plus" style="color:var(--accent-primary);width:16px;height:16px"></i>`}
          </div>`;
      }).join('')}
    `).join('');
  };

  const refreshList = (bodyEl) => {
    const list = bodyEl.querySelector('#exercise-modal-list');
    list.innerHTML = buildListHTML(getFiltered());
    if (window.lucide) window.lucide.createIcons({ nodes: [list] });
  };

  const body = openModal({
    title: 'Agregar ejercicio',
    body: `
      <div class="search-bar" style="margin-bottom:var(--space-3)">
        <i data-lucide="search"></i>
        <input type="text" class="input-field" id="exercise-search" placeholder="Buscar ejercicio..." autocomplete="off">
      </div>
      <div class="chip-group" id="modal-filter-chips" style="margin-bottom:var(--space-4);flex-wrap:nowrap;overflow-x:auto;padding-bottom:var(--space-1)">
        ${filterSections.map(f => `
          <button class="chip${f.id === 'all' ? ' active' : ''}" data-filter="${f.id}" style="flex-shrink:0">${f.label}</button>
        `).join('')}
      </div>
      <div id="exercise-modal-list">
        ${buildListHTML(getFiltered())}
      </div>
    `,
  });

  // Chips de filtro
  body.querySelector('#modal-filter-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    body.querySelectorAll('#modal-filter-chips .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.filter === currentFilter));
    refreshList(body);
  });

  // Búsqueda
  body.querySelector('#exercise-search').addEventListener('input', e => {
    currentSearch = e.target.value;
    refreshList(body);
  });

  // Click para agregar
  body.querySelector('#exercise-modal-list').addEventListener('click', e => {
    const item = e.target.closest('.selectable-exercise');
    if (!item || item.classList.contains('ex-already-added')) return;

    // Recuperar campos extra para ejercicios externos
    const libEx = all.find(ex => ex.id === item.dataset.id);
    const extra = {};
    if (libEx?.muscleGroup) extra.muscleGroup = libEx.muscleGroup;
    if (libEx?.type)        extra.type        = libEx.type;
    if (libEx?.metric)      extra.metric      = libEx.metric;

    _addExercise(item.dataset.id, item.dataset.name, extra);
    // Marcar como agregado sin cerrar el modal (permite agregar varios)
    item.classList.add('ex-already-added');
    item.querySelector('[data-lucide]').setAttribute('data-lucide', 'check');
    if (window.lucide) window.lucide.createIcons({ nodes: [item] });
    showToast(`${item.dataset.name} agregado.`, 'success');
  });
}

// ── Ejercicios en sesión ───────────────────────────────────

function _addExercise(exerciseId, name, extra = {}) {
  if (_session.exercises.some(e => e.exerciseId === exerciseId)) return; // ya marcado en modal
  _session.exercises.push({ exerciseId, name, sets: [], ...extra });
  saveSession(_session);
  _reRenderExercisesList();
}

function _deleteExercise(idx) {
  _session.exercises.splice(idx, 1);
  saveSession(_session);
  _reRenderExercisesList();
}

function _addSet(exIdx) {
  const ex     = _session.exercises[exIdx];
  const libEx  = findExerciseById(ex.exerciseId, getCustomExercises());
  const type   = libEx?.type   ?? ex.type   ?? 'strength';
  const metric = libEx?.metric ?? ex.metric ?? 'reps';
  const last   = ex.sets[ex.sets.length - 1];

  let newSet;
  if (type === 'cardio') {
    newSet = { durationMin: last?.durationMin ?? 20, speedKmh: last?.speedKmh ?? 5, inclinePct: last?.inclinePct ?? 0 };
  } else if (type === 'mobility' && metric === 'time') {
    newSet = { durationSec: last?.durationSec ?? 30 };
  } else if (type === 'mobility') {
    newSet = { reps: last?.reps ?? 10 };
  } else if (type === 'stretch') {
    newSet = { durationSec: last?.durationSec ?? 30 };
  } else {
    newSet = { weight: last?.weight ?? 0, reps: last?.reps ?? 0 };
  }

  ex.sets.push(newSet);
  saveSession(_session);
  _reRenderExercisesList();
}

function _deleteSet(exIdx, setIdx) {
  _session.exercises[exIdx].sets.splice(setIdx, 1);
  saveSession(_session);
  _reRenderExercisesList();
}

function _reRenderExercisesList() {
  const list = _container.querySelector('#exercises-list');
  if (!list) return;
  list.innerHTML = _session.exercises.map((ex, i) => _exerciseBlockHTML(ex, i)).join('');
  if (window.lucide) window.lucide.createIcons({ nodes: [list] });
  _updateSessionBadge();
}

/** Actualiza el badge del encabezado en base a los ejercicios actuales. */
function _updateSessionBadge() {
  const badge = document.getElementById('session-group-badge');
  if (!badge) return;
  const { name, badgeClass } = getSessionGroupDisplay(_session, getCustomExercises());
  badge.textContent = name;
  badge.className   = `badge ${badgeClass}`;
}

// ── Timer ──────────────────────────────────────────────────

function _startTimer() {
  if (_timerInterval) clearInterval(_timerInterval);
  const started = new Date(_session.startedAt);
  const tick = () => {
    const el = document.getElementById('timer-display');
    if (!el) { clearInterval(_timerInterval); return; }
    const s = Math.floor((Date.now() - started.getTime()) / 1000);
    el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  tick();
  _timerInterval = setInterval(tick, 1000);
}

// ── Week strip ─────────────────────────────────────────────

function _weekStripHTML(weekDays, completedDates) {
  const todayStr = todayISO();
  return `
    <div class="week-strip" style="margin-bottom:var(--space-6)">
      ${weekDays.map(d => {
        const isToday     = d.iso === todayStr;
        const isCompleted = completedDates.has(d.iso);
        let dotClass = 'week-day-dot';
        if (isCompleted) dotClass += ' completed';
        if (isToday)     dotClass += ' today';
        return `
          <div class="week-day">
            <span class="week-day-label">${d.label}</span>
            <div class="${dotClass}">${d.dayNum}</div>
          </div>`;
      }).join('')}
    </div>`;
}

// ── Utils ──────────────────────────────────────────────────

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function _groupName(muscleGroupId) {
  if (muscleGroupId === 'general') return GENERAL_GROUP.shortName;
  return MUSCLE_GROUPS.find(g => g.id === muscleGroupId)?.shortName ?? muscleGroupId;
}
