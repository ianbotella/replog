/**
 * today.js — Vista "Hoy"
 * Permite iniciar una sesión, seleccionar grupo muscular,
 * agregar ejercicios y registrar sets.
 */

import {
  getTodaySession, createSession, saveSession, getCustomExercises,
  todayISO, formatDateDisplay, currentWeekDays, getThisWeekSessions,
} from '../store.js';
import { MUSCLE_GROUPS, PREDEFINED_EXERCISES, findExerciseById } from '../data/exercises.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

// Estado local de la vista
let _session   = null;  // sesión activa del día
let _container = null;
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

// ── Pantalla inicial (sin sesión) ─────────────────────────

function _renderStartScreen() {
  const today = formatDateDisplay(todayISO());
  const weekDays = currentWeekDays();
  const weekSessions = getThisWeekSessions();
  const completedDates = new Set(weekSessions.map(s => s.date));

  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Hoy</h1>
      <p class="page-subtitle">${_capitalize(today)}</p>

      <!-- Resumen semanal -->
      ${_weekStripHTML(weekDays, completedDates)}

      <!-- Selector de grupo muscular -->
      <div class="section-header">
        <span class="section-title">Empezar entrenamiento</span>
      </div>
      <div class="muscle-group-grid">
        ${MUSCLE_GROUPS.map(g => `
          <button class="muscle-group-card" data-group="${g.id}">
            <div class="muscle-group-icon ${g.iconClass}">${g.emoji}</div>
            <div class="muscle-group-info">
              <div class="muscle-group-name">${g.name}</div>
              <div class="muscle-group-sub">${_getGroupExerciseCount(g.id)} ejercicios disponibles</div>
            </div>
            <i data-lucide="chevron-right" style="color:var(--text-tertiary);width:16px;height:16px"></i>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Eventos
  _container.querySelectorAll('.muscle-group-card').forEach(card => {
    card.addEventListener('click', () => _startSession(card.dataset.group));
  });
}

// ── Sesión activa ─────────────────────────────────────────

function _renderActiveSession() {
  const group = MUSCLE_GROUPS.find(g => g.id === _session.muscleGroup);
  const weekDays = currentWeekDays();
  const weekSessions = getThisWeekSessions();
  const completedDates = new Set(weekSessions.map(s => s.date));

  _container.innerHTML = `
    <div class="view">
      <!-- Resumen semanal -->
      ${_weekStripHTML(weekDays, completedDates)}

      <!-- Header sesión activa -->
      <div class="active-session-header">
        <div>
          <span class="badge ${group.badgeClass}">${group.name}</span>
          <h2 class="page-title" style="margin-top:var(--space-2)">Sesión activa</h2>
        </div>
        <div class="session-timer" id="session-timer">
          <i data-lucide="timer"></i>
          <span id="timer-display">00:00</span>
        </div>
      </div>

      <!-- Bloques de ejercicios -->
      <div id="exercises-list">
        ${_session.exercises.map((ex, idx) => _exerciseBlockHTML(ex, idx)).join('')}
      </div>

      <!-- Botón agregar ejercicio -->
      <button class="exercise-block" id="add-exercise-btn" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4) var(--space-5);cursor:pointer;border-style:dashed;justify-content:center;color:var(--accent-primary);font-weight:var(--weight-semibold);font-size:var(--text-sm);background:var(--accent-subtle);">
        <i data-lucide="plus-circle"></i>
        Agregar ejercicio
      </button>

      <!-- Notas -->
      <div style="margin-top:var(--space-4)">
        <label class="label" for="session-notes">Notas</label>
        <textarea id="session-notes" class="input-field notes-area" placeholder="Cómo fue el entreno...">${_session.notes || ''}</textarea>
      </div>

      <!-- Finalizar -->
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

function _exerciseBlockHTML(ex, idx) {
  const libEx  = findExerciseById(ex.exerciseId, getCustomExercises());
  const type   = libEx?.type   ?? 'strength';
  const metric = libEx?.metric ?? 'reps';

  const emptyMsg = `<div style="padding:var(--space-3) var(--space-5);color:var(--text-tertiary);font-size:var(--text-sm)">Sin series todavía</div>`;
  const setsHTML = ex.sets.length === 0
    ? emptyMsg
    : _setsHeaderHTML(type, metric) + ex.sets.map((set, si) => _setRowHTML(idx, set, si, type, metric)).join('');

  const addLabel = type === 'cardio' ? 'Agregar vuelta' : 'Agregar serie';
  const typeBadge = type !== 'strength' ? `<span class="badge badge-general" style="margin-left:var(--space-2)">${_typeBadgeLabel(type, metric)}</span>` : '';

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

/** Encabezado de la tabla de series según tipo. */
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
  // Default: strength
  return `<div class="sets-header">
    <span>Serie</span><span>Peso (kg)</span><span>Reps</span><span></span>
  </div>`;
}

/** Fila de una serie según tipo. */
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
    const field = metric === 'time' || type === 'stretch' ? 'durationSec' : 'reps';
    const val   = set[field] || '';
    const ph    = field === 'durationSec' ? '30' : '10';
    const step  = field === 'durationSec' ? '5' : '1';
    return `
      <div class="set-row set-row-simple" data-ex="${exIdx}" data-set="${setIdx}">
        <span class="set-number">${n}</span>
        <input type="number" class="set-input" data-field="${field}" data-ex="${exIdx}" data-set="${setIdx}"
          value="${val}" placeholder="${ph}" min="0" step="${step}">
        ${del}
      </div>`;
  }

  // strength (default)
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

/** Etiqueta corta para el badge del tipo de ejercicio. */
function _typeBadgeLabel(type, metric) {
  if (type === 'cardio')    return 'Cardio';
  if (type === 'stretch')   return 'Estiramiento';
  if (type === 'mobility')  return metric === 'time' ? 'Movilidad · tiempo' : 'Movilidad · reps';
  return '';
}

// ── Event binding ──────────────────────────────────────────

function _bindActiveSessionEvents() {
  // Agregar ejercicio
  _container.querySelector('#add-exercise-btn')
    .addEventListener('click', _openAddExerciseModal);

  // Finalizar sesión
  _container.querySelector('#finish-session-btn')
    .addEventListener('click', _finishSession);

  // Cancelar sesión
  _container.querySelector('#cancel-session-btn')
    .addEventListener('click', _cancelSession);

  // Notas
  _container.querySelector('#session-notes')
    .addEventListener('input', e => { _session.notes = e.target.value; });

  // Delegación de eventos en la lista de ejercicios
  _container.addEventListener('click', _handleExerciseListClick);
  _container.addEventListener('change', _handleSetInputChange);
  _container.addEventListener('input',  _handleSetInputChange);
}

function _handleExerciseListClick(e) {
  // Agregar serie
  const addSetBtn = e.target.closest('.add-set-btn');
  if (addSetBtn) {
    const exIdx = parseInt(addSetBtn.dataset.ex, 10);
    _addSet(exIdx);
    return;
  }

  // Eliminar serie
  const delSetBtn = e.target.closest('.set-delete-btn');
  if (delSetBtn) {
    const exIdx = parseInt(delSetBtn.dataset.ex, 10);
    const setIdx = parseInt(delSetBtn.dataset.set, 10);
    _deleteSet(exIdx, setIdx);
    return;
  }

  // Eliminar ejercicio
  const delExBtn = e.target.closest('.delete-exercise-btn');
  if (delExBtn) {
    const exIdx = parseInt(delExBtn.dataset.ex, 10);
    _deleteExercise(exIdx);
    return;
  }
}

function _handleSetInputChange(e) {
  const input = e.target.closest('.set-input');
  if (!input) return;
  const exIdx  = parseInt(input.dataset.ex, 10);
  const setIdx = parseInt(input.dataset.set, 10);
  const field  = input.dataset.field;
  const val    = parseFloat(input.value) || 0;

  _session.exercises[exIdx].sets[setIdx][field] = val;
  saveSession(_session);
}

// ── Acciones de sesión ─────────────────────────────────────

function _startSession(muscleGroupId) {
  _session = createSession(muscleGroupId);
  _render();
}

function _finishSession() {
  if (_session.exercises.length === 0) {
    showToast('Agregá al menos un ejercicio antes de finalizar.', 'danger');
    return;
  }

  // Calcular duración
  const started = new Date(_session.startedAt);
  _session.durationMin = Math.round((Date.now() - started.getTime()) / 60000);

  // Guardar notas finales
  const notesEl = _container.querySelector('#session-notes');
  if (notesEl) _session.notes = notesEl.value;

  saveSession(_session);
  showToast('Sesión guardada correctamente.', 'success');

  if (_timerInterval) clearInterval(_timerInterval);

  // Navegar a historial
  setTimeout(() => { window.location.hash = '#/history'; }, 400);
}

function _cancelSession() {
  if (!confirm('¿Cancelar la sesión de hoy? Se perderán los datos.')) return;
  const { deleteSession } = window._replogStore ?? {};
  // Importar dinamicamente para evitar ciclos
  import('../store.js').then(({ deleteSession: del }) => {
    del(_session.id);
    _session = null;
    if (_timerInterval) clearInterval(_timerInterval);
    _render();
  });
}

// ── Ejercicios ─────────────────────────────────────────────

function _openAddExerciseModal() {
  const group  = MUSCLE_GROUPS.find(g => g.id === _session.muscleGroup);
  const custom = getCustomExercises();

  // Calentamiento + Estiramiento siempre disponibles (muscleGroup: 'general')
  const generalExs = [
    ...PREDEFINED_EXERCISES.filter(e => e.muscleGroup === 'general'),
    ...custom.filter(e => e.muscleGroup === 'general'),
  ];
  // Ejercicios del grupo de la sesión
  const groupExs = [
    ...PREDEFINED_EXERCISES.filter(e => e.muscleGroup === _session.muscleGroup),
    ...custom.filter(e => e.muscleGroup === _session.muscleGroup),
  ];

  // Orden en el modal: Calentamiento → ejercicios del grupo → Estiramiento
  const warmup  = generalExs.filter(e => e.category === 'Calentamiento');
  const stretch = generalExs.filter(e => e.category === 'Estiramiento');

  const buildSection = (exercises) => {
    const byCategory = {};
    exercises.forEach(ex => {
      if (!byCategory[ex.category]) byCategory[ex.category] = [];
      byCategory[ex.category].push(ex);
    });
    return Object.entries(byCategory).map(([cat, exs]) => `
      <div class="exercise-group-header">${cat}</div>
      ${exs.map(ex => `
        <div class="exercise-item selectable-exercise" data-id="${ex.id}" data-name="${ex.name}" style="cursor:pointer">
          <div class="exercise-item-info">
            <div class="exercise-item-name">${ex.name}</div>
            <div class="exercise-item-meta">${ex.custom ? 'Personalizado' : _typeBadgeLabel(ex.type, ex.metric)}</div>
          </div>
          <i data-lucide="plus" style="color:var(--accent-primary);width:16px;height:16px"></i>
        </div>
      `).join('')}
    `).join('');
  };

  const body = openModal({
    title: `Agregar ejercicio`,
    body: `
      <div class="search-bar" style="margin-bottom:var(--space-4)">
        <i data-lucide="search"></i>
        <input type="text" class="input-field" id="exercise-search" placeholder="Buscar ejercicio...">
      </div>
      <div id="exercise-modal-list">
        ${buildSection(warmup)}
        ${buildSection(groupExs)}
        ${buildSection(stretch)}
      </div>
    `,
  });

  // Búsqueda en tiempo real
  body.querySelector('#exercise-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    body.querySelectorAll('.selectable-exercise').forEach(el => {
      el.style.display = el.dataset.name.toLowerCase().includes(q) ? '' : 'none';
    });
    // Ocultar encabezados de categorías vacías
    body.querySelectorAll('.exercise-group-header').forEach(header => {
      let sibling = header.nextElementSibling;
      let visible = false;
      while (sibling && !sibling.classList.contains('exercise-group-header')) {
        if (sibling.style.display !== 'none') visible = true;
        sibling = sibling.nextElementSibling;
      }
      header.style.display = visible ? '' : 'none';
    });
  });

  // Click para agregar ejercicio
  body.querySelector('#exercise-modal-list').addEventListener('click', e => {
    const item = e.target.closest('.selectable-exercise');
    if (!item) return;
    _addExercise(item.dataset.id, item.dataset.name);
    closeModal();
  });
}

function _addExercise(exerciseId, name) {
  // Evitar duplicados
  if (_session.exercises.some(e => e.exerciseId === exerciseId)) {
    showToast('Este ejercicio ya está en la sesión.', 'danger');
    return;
  }
  _session.exercises.push({ exerciseId, name, sets: [] });
  saveSession(_session);

  // Re-renderizar solo la lista de ejercicios
  _reRenderExercisesList();
  showToast(`${name} agregado.`, 'success');
}

function _deleteExercise(idx) {
  _session.exercises.splice(idx, 1);
  saveSession(_session);
  _reRenderExercisesList();
}

function _addSet(exIdx) {
  const ex     = _session.exercises[exIdx];
  const libEx  = findExerciseById(ex.exerciseId, getCustomExercises());
  const type   = libEx?.type   ?? 'strength';
  const metric = libEx?.metric ?? 'reps';
  const sets   = ex.sets;
  const last   = sets[sets.length - 1];

  let newSet;
  if (type === 'cardio') {
    newSet = {
      durationMin: last?.durationMin ?? 20,
      speedKmh:    last?.speedKmh    ?? 5,
      inclinePct:  last?.inclinePct  ?? 0,
    };
  } else if (type === 'mobility' && metric === 'time') {
    newSet = { durationSec: last?.durationSec ?? 30 };
  } else if (type === 'mobility') {
    newSet = { reps: last?.reps ?? 10 };
  } else if (type === 'stretch') {
    newSet = { durationSec: last?.durationSec ?? 30 };
  } else {
    newSet = { weight: last?.weight ?? 0, reps: last?.reps ?? 0 };
  }

  sets.push(newSet);
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
}

// ── Timer ──────────────────────────────────────────────────

function _startTimer() {
  if (_timerInterval) clearInterval(_timerInterval);

  const started = new Date(_session.startedAt);
  const display = () => {
    const el = document.getElementById('timer-display');
    if (!el) { clearInterval(_timerInterval); return; }
    const elapsed = Math.floor((Date.now() - started.getTime()) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
  };

  display();
  _timerInterval = setInterval(display, 1000);
}

// ── Week strip HTML ────────────────────────────────────────

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
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Utils ──────────────────────────────────────────────────

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function _getGroupExerciseCount(groupId) {
  const custom = getCustomExercises().filter(e => e.muscleGroup === groupId).length;
  const pred   = PREDEFINED_EXERCISES.filter(e => e.muscleGroup === groupId).length;
  return pred + custom;
}
