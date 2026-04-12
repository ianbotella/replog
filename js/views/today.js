/**
 * today.js — Vista "Hoy"
 *
 * Flujo:
 *   1. Pantalla de inicio: "Sesión libre" + rutinas predefinidas.
 *   2. Sesión activa: agregar ejercicios + registrar sets.
 *
 * Funcionalidades de sesión activa:
 *   1. Temporizador de descanso entre series (60 / 90 / 120 s, persistido)
 *   2. Supersets / Circuitos (agrupación visual, timer solo en último del grupo)
 *   3. RPE / RIR por serie (campo opcional, colapsable por ejercicio)
 *   4. Referencia de última sesión inline por ejercicio
 */

import {
  getTodaySession, createSession, saveSession, getCustomExercises,
  todayISO, formatDateDisplay, currentWeekDays, getThisWeekSessions,
  getSettings, saveSettings, getLastExerciseSession, checkAndUpdatePRs,
} from '../store.js';
import {
  MUSCLE_GROUPS, GENERAL_GROUP, findExerciseById, getSessionGroupDisplay,
} from '../data/exercises.js';
import { fetchExternalExercises, IMG_BASE_URL } from '../data/freeExerciseDb.js';
import { ROUTINE_TEMPLATES } from '../data/routineTemplates.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { shareSession } from '../utils/share.js';

// ── Estado local ───────────────────────────────────────────

let _session       = null;
let _container     = null;
let _timerInterval = null;
let _extExercises  = []; // caché para imágenes de referencia

// Feature 1: Temporizador de descanso
let _restTimer = { active: false, remaining: 0, total: 0, paused: false, intervalId: null };

// Feature 3: modo RPE/RIR por índice de ejercicio (volátil, no persiste en LS)
let _rpeState = {}; // { [exIdx]: 'off' | 'rpe' | 'rir' }

const _uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

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
    _stopRestTimer();
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

      <div class="section-header" style="margin-bottom:var(--space-3)">
        <span class="section-title">Rutinas</span>
      </div>
      <div id="routine-templates-list" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-5)">
        ${ROUTINE_TEMPLATES.map(_routineTemplateCardHTML).join('')}
      </div>

      <button class="btn btn-secondary btn-full" id="start-free-btn">
        <i data-lucide="shuffle"></i>
        Sesión libre
      </button>
    </div>
  `;

  _container.querySelector('#start-free-btn').addEventListener('click', _startFreeSession);
  _container.querySelector('#routine-templates-list').addEventListener('click', async e => {
    const card = e.target.closest('[data-template-id]');
    if (!card) return;
    const template = ROUTINE_TEMPLATES.find(t => t.id === card.dataset.templateId);
    if (template) await _startFromTemplate(template);
  });
}

function _routineTemplateCardHTML(t) {
  const group      = MUSCLE_GROUPS.find(g => g.id === t.muscleGroup);
  const badgeClass = group?.badgeClass ?? 'badge-neutral';
  return `
    <div class="exercise-item" data-template-id="${t.id}" style="cursor:pointer">
      <div class="exercise-item-info">
        <div class="exercise-item-name">${t.name}</div>
        <div class="exercise-item-meta">${t.description}</div>
      </div>
      <div class="exercise-item-actions">
        <span class="badge ${badgeClass}" style="flex-shrink:0">${t.exercises.length} ejercicios</span>
        <i data-lucide="chevron-right" style="width:14px;height:14px;color:var(--text-tertiary);flex-shrink:0"></i>
      </div>
    </div>
  `;
}

async function _startFromTemplate(template) {
  const external = await fetchExternalExercises();
  _session  = createSession();
  _rpeState = {};

  for (const ex of template.exercises) {
    const apiEx    = external.find(e => e.id === ex.exerciseId);
    const sessionEx = {
      exerciseId:  ex.exerciseId,
      name:        apiEx?.name ?? ex.displayName,
      muscleGroup: apiEx?.muscleGroup ?? ex.muscleGroup,
      tip:         ex.tip,
      sets:        [],
    };
    if (apiEx?.type)   sessionEx.type   = apiEx.type;
    if (apiEx?.metric) sessionEx.metric = apiEx.metric;

    for (let i = 0; i < ex.sets; i++) {
      sessionEx.sets.push({ weight: 0, reps: ex.repsMin });
    }
    _session.exercises.push(sessionEx);
  }

  saveSession(_session);
  _render();
}

// ── Sesión activa ──────────────────────────────────────────

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

      <div id="exercises-list">
        ${_buildExercisesListHTML()}
      </div>

      <button id="add-exercise-btn" class="exercise-block"
        style="display:flex;align-items:center;justify-content:center;gap:var(--space-3);
               padding:var(--space-4) var(--space-5);cursor:pointer;border-style:dashed;
               color:var(--accent-primary);font-weight:var(--weight-semibold);
               font-size:var(--text-sm);background:var(--accent-subtle);">
        <i data-lucide="plus-circle"></i>
        Agregar ejercicio
      </button>

      <div style="margin-top:var(--space-4)">
        <label class="label" for="session-notes">Notas</label>
        <textarea id="session-notes" class="input-field notes-area"
          placeholder="Cómo fue el entreno...">${_session.notes || ''}</textarea>
      </div>

      <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);align-items:center">
        <button class="btn btn-secondary" id="cancel-session-btn" style="flex:1">Cancelar</button>
        <button class="icon-btn" id="share-session-btn" title="Compartir sesión" aria-label="Compartir sesión">
          <i data-lucide="share-2"></i>
        </button>
        <button class="btn btn-primary btn-lg" id="finish-session-btn" style="flex:2">
          <i data-lucide="check"></i>
          Finalizar sesión
        </button>
      </div>
    </div>
  `;

  _bindActiveSessionEvents();
  _startTimer();
  _loadExtForSession();
}

// ── Exercise block HTML ────────────────────────────────────

function _exerciseBlockHTML(ex, idx) {
  const libEx   = findExerciseById(ex.exerciseId, getCustomExercises());
  const type    = libEx?.type   ?? ex.type   ?? 'strength';
  const metric  = libEx?.metric ?? ex.metric ?? 'reps';
  const apiEx   = _extExercises.find(e => e.id === ex.exerciseId);
  const hasImgs = apiEx?.images?.length > 0;
  const rpeMode = _rpeState[idx] || 'off';

  // Feature 4: referencia de última sesión
  const lastData = getLastExerciseSession(ex.exerciseId);
  const lastRef  = lastData ? _formatLastSession(lastData, type, metric) : null;

  const emptyMsg = `<div style="padding:var(--space-3) var(--space-5);color:var(--text-tertiary);font-size:var(--text-sm)">Sin series todavía</div>`;
  const setsHTML = ex.sets.length === 0
    ? emptyMsg
    : _setsHeaderHTML(type, metric, rpeMode) +
      ex.sets.map((set, si) => _setRowHTML(idx, set, si, type, metric, rpeMode)).join('');

  const addLabel  = type === 'cardio' ? 'Agregar vuelta' : 'Agregar serie';
  const typeBadge = type !== 'strength'
    ? `<span class="badge badge-general" style="margin-left:var(--space-2)">${_typeBadgeLabel(type, metric)}</span>`
    : '';

  // Feature 3: botón RPE/RIR (solo fuerza)
  const rpeBtn = type === 'strength' ? `
    <button class="btn btn-ghost btn-sm rpe-toggle-btn" data-ex="${idx}"
      style="font-size:var(--text-xs);color:${rpeMode !== 'off' ? 'var(--accent-primary)' : 'var(--text-tertiary)'}">
      <i data-lucide="gauge" style="width:12px;height:12px"></i>
      ${_rpeModeLabel(rpeMode)}
    </button>` : '';

  return `
    <div class="exercise-block" data-ex-idx="${idx}" data-ex-type="${type}" data-rpe-mode="${rpeMode}">
      <div class="exercise-block-header">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:var(--space-1)">
            <span class="exercise-name">${ex.name}</span>
            ${typeBadge}
          </div>
          ${ex.tip ? `<div class="exercise-tip">${ex.tip}</div>` : ''}
          ${lastRef ? `<div class="exercise-last-ref">${lastRef}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-1);flex-shrink:0">
          <button class="icon-btn superset-btn" data-ex="${idx}"
            title="${ex.supersetId ? 'Quitar de superserie' : 'Agrupar en superserie'}"
            style="color:${ex.supersetId ? 'var(--accent-primary)' : 'var(--text-tertiary)'}">
            <i data-lucide="${ex.supersetId ? 'link-2-off' : 'link-2'}" style="width:15px;height:15px"></i>
          </button>
          ${hasImgs ? `<button class="icon-btn view-images-btn" data-ex="${idx}" aria-label="Ver referencia">
            <i data-lucide="image" style="width:15px;height:15px;color:var(--text-tertiary)"></i>
          </button>` : ''}
          <button class="icon-btn delete-exercise-btn" data-ex="${idx}" aria-label="Eliminar ejercicio">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="sets-table" id="sets-table-${idx}">
        ${setsHTML}
      </div>
      <div class="sets-footer">
        <button class="btn btn-ghost btn-sm add-set-btn" data-ex="${idx}">
          <i data-lucide="plus"></i> ${addLabel}
        </button>
        ${rpeBtn}
      </div>
    </div>
  `;
}

function _setsHeaderHTML(type, metric, rpeMode = 'off') {
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
  // Strength
  const rpeCol   = rpeMode !== 'off' ? `<span>${rpeMode.toUpperCase()}</span>` : '';
  const colClass = rpeMode !== 'off' ? 'sets-header sets-header-rpe' : 'sets-header';
  return `<div class="${colClass}">
    <span>Serie</span><span>Peso (kg)</span><span>Reps</span>${rpeCol}<span></span>
  </div>`;
}

function _setRowHTML(exIdx, set, setIdx, type, metric, rpeMode = 'off') {
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

  // Strength — con columna RPE/RIR opcional
  const rpeField = rpeMode === 'rir' ? 'rir' : 'rpe';
  const rpeMax   = rpeMode === 'rir' ? 5 : 10;
  const rpeMin   = rpeMode === 'rir' ? 0 : 1;
  const rpePh    = rpeMode === 'rir' ? '2' : '8';
  const rpeInput = rpeMode !== 'off' ? `
    <input type="number" class="set-input set-input-rpe" data-field="${rpeField}" data-ex="${exIdx}" data-set="${setIdx}"
      value="${set[rpeField] ?? ''}" placeholder="${rpePh}" min="${rpeMin}" max="${rpeMax}" step="1">
  ` : '';
  const rowClass = rpeMode !== 'off' ? 'set-row set-row-rpe' : 'set-row';

  return `
    <div class="${rowClass}" data-ex="${exIdx}" data-set="${setIdx}">
      <span class="set-number">${n}</span>
      <div class="set-input-wrap">
        <input type="number" class="set-input" data-field="weight" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.weight || ''}" placeholder="0" min="0" step="0.5">
      </div>
      <div class="set-input-wrap">
        <input type="number" class="set-input" data-field="reps" data-ex="${exIdx}" data-set="${setIdx}"
          value="${set.reps || ''}" placeholder="0" min="0" step="1">
      </div>
      ${rpeInput}
      ${del}
    </div>`;
}

function _typeBadgeLabel(type, metric) {
  if (type === 'cardio')   return 'Cardio';
  if (type === 'stretch')  return 'Estiramiento';
  if (type === 'mobility') return metric === 'time' ? 'Movilidad · tiempo' : 'Movilidad · reps';
  return '';
}

// Feature 3: etiqueta del botón RPE/RIR
function _rpeModeLabel(mode) {
  if (mode === 'rpe') return 'RPE';
  if (mode === 'rir') return 'RIR';
  return 'RPE/RIR';
}

// Feature 4: formato "Última vez: ..."
function _formatLastSession(lastData, type, metric) {
  const { sets } = lastData;
  if (!sets || sets.length === 0) return null;

  if (type === 'cardio') {
    const s     = sets[0];
    const parts = [];
    if (s.durationMin) parts.push(`${s.durationMin} min`);
    if (s.speedKmh)    parts.push(`${s.speedKmh} km/h`);
    return parts.length ? `Última: ${parts.join(' · ')}` : null;
  }

  if (type === 'mobility' || type === 'stretch') {
    const field = (metric === 'time' || type === 'stretch') ? 'durationSec' : 'reps';
    const unit  = field === 'durationSec' ? 's' : ' reps';
    const val   = sets[0]?.[field];
    return val ? `Última: ${sets.length} × ${val}${unit}` : null;
  }

  // Strength
  const validSets = sets.filter(s => s.reps > 0);
  if (!validSets.length) return null;

  const maxWeight = Math.max(...validSets.map(s => s.weight || 0));
  const allSameR  = validSets.every(s => s.reps === validSets[0].reps);
  const setsStr   = allSameR
    ? `${validSets.length} × ${validSets[0].reps}`
    : validSets.map(s => s.reps).join('/') + ' reps';

  return maxWeight > 0
    ? `Última: ${setsStr} @ ${maxWeight} kg`
    : `Última: ${setsStr}`;
}

// ── Feature 2: Supersets — list builder ───────────────────

function _buildExercisesListHTML() {
  const exercises = _session.exercises;
  if (!exercises.length) return '';

  const rendered = new Set();
  const parts    = [];

  for (let i = 0; i < exercises.length; i++) {
    if (rendered.has(i)) continue;
    const ex = exercises[i];

    if (!ex.supersetId) {
      parts.push(_exerciseBlockHTML(ex, i));
      rendered.add(i);
    } else {
      // Agrupar todos los ejercicios con el mismo supersetId
      const groupIdxs = exercises
        .map((e, idx) => e.supersetId === ex.supersetId ? idx : -1)
        .filter(idx => idx >= 0);

      const groupHTML = groupIdxs.map(idx => {
        rendered.add(idx);
        return _exerciseBlockHTML(exercises[idx], idx);
      }).join('');

      parts.push(`
        <div class="superset-group">
          <div class="superset-label">
            <i data-lucide="link" style="width:11px;height:11px"></i>
            Superserie
          </div>
          ${groupHTML}
        </div>
      `);
    }
  }

  return parts.join('');
}

// ── Imágenes de referencia ─────────────────────────────────

async function _loadExtForSession() {
  if (_extExercises.length > 0) return;
  const exercises = await fetchExternalExercises();
  if (!_container) return;
  _extExercises = exercises;
  _reRenderExercisesList();
}

function _openExerciseDetailModal(ex, apiEx) {
  const imagesHTML = apiEx.images?.length
    ? `<div style="display:grid;grid-template-columns:${apiEx.images.length > 1 ? '1fr 1fr' : '1fr'};gap:var(--space-3);margin-bottom:var(--space-4)">
        ${apiEx.images.map(img => `
          <img src="${IMG_BASE_URL}${img}" alt="${ex.name}"
               style="width:100%;border-radius:var(--radius-md);background:var(--bg-elevated);display:block"
               onerror="this.style.display='none'">
        `).join('')}
      </div>`
    : '';

  const infoRows = [
    apiEx.equipment ? `
      <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--border-subtle);font-size:var(--text-sm)">
        <span style="color:var(--text-secondary)">Equipamiento</span>
        <span>${apiEx.equipment}</span>
      </div>` : '',
    apiEx.level ? `
      <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;font-size:var(--text-sm)">
        <span style="color:var(--text-secondary)">Nivel</span>
        <span>${apiEx.level.charAt(0).toUpperCase() + apiEx.level.slice(1)}</span>
      </div>` : '',
  ].filter(Boolean).join('');

  const body = openModal({
    title: ex.name,
    body: `
      ${imagesHTML}
      ${infoRows ? `<div>${infoRows}</div>` : ''}
      ${ex.tip ? `<div style="margin-top:var(--space-4);padding:var(--space-3);background:var(--bg-elevated);border-radius:var(--radius-md);font-size:var(--text-sm);color:var(--text-secondary)">
        <strong style="color:var(--text-primary)">Indicación: </strong>${ex.tip}
      </div>` : ''}
    `,
    footer: `<button class="btn btn-primary" id="detail-close-btn" style="flex:1">Cerrar</button>`,
  });

  body.closest('.modal-container').querySelector('#detail-close-btn')
    .addEventListener('click', closeModal);
}

// ── Event binding ──────────────────────────────────────────

function _bindActiveSessionEvents() {
  _container.querySelector('#add-exercise-btn').addEventListener('click', _openAddExerciseModal);
  _container.querySelector('#finish-session-btn').addEventListener('click', _finishSession);
  _container.querySelector('#cancel-session-btn').addEventListener('click', _cancelSession);
  _container.querySelector('#share-session-btn').addEventListener('click', () => shareSession(_session));
  _container.querySelector('#session-notes')
    .addEventListener('input', e => { _session.notes = e.target.value; });

  _container.addEventListener('click',  _handleExerciseListClick);
  _container.addEventListener('change', _handleSetInputChange);
  _container.addEventListener('input',  _handleSetInputChange);
}

function _handleExerciseListClick(e) {
  // Ver imágenes de referencia
  const imgBtn = e.target.closest('.view-images-btn');
  if (imgBtn) {
    const exIdx = parseInt(imgBtn.dataset.ex, 10);
    const ex    = _session.exercises[exIdx];
    const apiEx = _extExercises.find(a => a.id === ex.exerciseId);
    if (apiEx) _openExerciseDetailModal(ex, apiEx);
    return;
  }

  // Superset
  const supersetBtn = e.target.closest('.superset-btn');
  if (supersetBtn) {
    const exIdx = parseInt(supersetBtn.dataset.ex, 10);
    const ex    = _session.exercises[exIdx];
    if (ex.supersetId) {
      if (confirm('¿Quitar este ejercicio de la superserie?')) _removeFromSuperset(exIdx);
    } else {
      _openSupersetModal(exIdx);
    }
    return;
  }

  // RPE / RIR toggle: off → rpe → rir → off
  const rpeToggleBtn = e.target.closest('.rpe-toggle-btn');
  if (rpeToggleBtn) {
    const exIdx   = parseInt(rpeToggleBtn.dataset.ex, 10);
    const current = _rpeState[exIdx] || 'off';
    _rpeState[exIdx] = current === 'off' ? 'rpe' : current === 'rpe' ? 'rir' : 'off';
    _reRenderExercisesList();
    return;
  }

  // Agregar serie
  const addSetBtn = e.target.closest('.add-set-btn');
  if (addSetBtn) { _addSet(parseInt(addSetBtn.dataset.ex, 10)); return; }

  // Eliminar serie
  const delSetBtn = e.target.closest('.set-delete-btn');
  if (delSetBtn) {
    _deleteSet(parseInt(delSetBtn.dataset.ex, 10), parseInt(delSetBtn.dataset.set, 10));
    return;
  }

  // Eliminar ejercicio
  const delExBtn = e.target.closest('.delete-exercise-btn');
  if (delExBtn) { _deleteExercise(parseInt(delExBtn.dataset.ex, 10)); return; }
}

function _handleSetInputChange(e) {
  const input = e.target.closest('.set-input');
  if (!input) return;
  const exIdx  = parseInt(input.dataset.ex, 10);
  const setIdx = parseInt(input.dataset.set, 10);
  const value  = parseFloat(input.value);
  _session.exercises[exIdx].sets[setIdx][input.dataset.field] = isNaN(value) ? 0 : value;
  saveSession(_session);
}

// ── Acciones de sesión ─────────────────────────────────────

function _startFreeSession() {
  _session  = createSession();
  _rpeState = {};
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
  _stopRestTimer();

  // Detectar nuevos PRs y celebrar
  const newPRs = checkAndUpdatePRs(_session);
  if (newPRs.length) {
    newPRs.forEach((pr, i) => {
      setTimeout(() => {
        showToast(`🏆 Nuevo PR: ${pr.name} — ${pr.weight} kg`, 'success', 4500);
      }, i * 600);
    });
    setTimeout(() => { window.location.hash = '#/history'; }, 400 + newPRs.length * 600);
  } else {
    showToast('Sesión guardada correctamente.', 'success');
    setTimeout(() => { window.location.hash = '#/history'; }, 400);
  }

  if (_timerInterval) clearInterval(_timerInterval);
}

function _cancelSession() {
  if (!confirm('¿Cancelar la sesión de hoy? Se perderán los datos.')) return;
  import('../store.js').then(({ deleteSession }) => {
    deleteSession(_session.id);
    _session  = null;
    _rpeState = {};
    if (_timerInterval) clearInterval(_timerInterval);
    _stopRestTimer();
    _render();
  });
}

// ── Modal agregar ejercicio ────────────────────────────────

async function _openAddExerciseModal() {
  const custom   = getCustomExercises();
  const external = await fetchExternalExercises();
  const all      = [...custom, ...external];

  const CAT_ORDER = [
    'Pecho', 'Tríceps', 'Espalda', 'Bíceps', 'Hombros', 'Piernas',
    'Abdominales', 'Antebrazos', 'Cuello',
  ];
  const strengthAll = all.filter(e => e.type !== 'cardio' && e.type !== 'stretch' && e.type !== 'mobility');
  const availCats   = new Set(strengthAll.map(e => e.category));
  const orderedCats = [
    ...CAT_ORDER.filter(c => availCats.has(c)),
    ...[...availCats].filter(c => !CAT_ORDER.includes(c)).sort(),
  ];
  const filterSections = [
    { id: 'all',     label: 'Todos' },
    ...orderedCats.map(cat => ({ id: cat, label: cat })),
    { id: 'cardio',  label: 'Cardio' },
    { id: 'stretch', label: 'Estiramiento' },
  ];

  let currentFilter = 'all';
  let currentSearch = '';

  const getFiltered = () => {
    let list = all;
    if      (currentFilter === 'cardio')  list = all.filter(e => e.type === 'cardio' || e.type === 'mobility');
    else if (currentFilter === 'stretch') list = all.filter(e => e.type === 'stretch');
    else if (currentFilter !== 'all')     list = all.filter(e => e.category === currentFilter);
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
      <div class="chip-group" id="modal-filter-chips"
           style="margin-bottom:var(--space-4);flex-wrap:nowrap;overflow-x:auto;padding-bottom:var(--space-1)">
        ${filterSections.map(f => `
          <button class="chip${f.id === 'all' ? ' active' : ''}" data-filter="${f.id}" style="flex-shrink:0">${f.label}</button>
        `).join('')}
      </div>
      <div id="exercise-modal-list">
        ${buildListHTML(getFiltered())}
      </div>
    `,
  });

  body.querySelector('#modal-filter-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    body.querySelectorAll('#modal-filter-chips .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.filter === currentFilter));
    refreshList(body);
  });

  body.querySelector('#exercise-search').addEventListener('input', e => {
    currentSearch = e.target.value;
    refreshList(body);
  });

  body.querySelector('#exercise-modal-list').addEventListener('click', e => {
    const item = e.target.closest('.selectable-exercise');
    if (!item || item.classList.contains('ex-already-added')) return;

    const libEx = all.find(ex => ex.id === item.dataset.id);
    const extra = {};
    if (libEx?.muscleGroup) extra.muscleGroup = libEx.muscleGroup;
    if (libEx?.type)        extra.type        = libEx.type;
    if (libEx?.metric)      extra.metric      = libEx.metric;

    _addExercise(item.dataset.id, item.dataset.name, extra);
    item.classList.add('ex-already-added');
    item.querySelector('[data-lucide]').setAttribute('data-lucide', 'check');
    if (window.lucide) window.lucide.createIcons({ nodes: [item] });
    showToast(`${item.dataset.name} agregado.`, 'success');
  });
}

// ── Ejercicios en sesión ───────────────────────────────────

function _addExercise(exerciseId, name, extra = {}) {
  if (_session.exercises.some(e => e.exerciseId === exerciseId)) return;
  _session.exercises.push({ exerciseId, name, sets: [], ...extra });
  saveSession(_session);
  _reRenderExercisesList();
}

function _deleteExercise(idx) {
  _session.exercises.splice(idx, 1);
  // Reconstruir _rpeState ajustando índices
  const newState = {};
  Object.entries(_rpeState).forEach(([key, val]) => {
    const k = parseInt(key, 10);
    if (k < idx)      newState[k]     = val;
    else if (k > idx) newState[k - 1] = val;
  });
  _rpeState = newState;
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

  // Feature 1: disparar timer de descanso (respeta regla de superserie)
  if (_shouldFireRestTimer(exIdx)) {
    _startRestTimer(_getRestDuration());
  }
}

function _deleteSet(exIdx, setIdx) {
  _session.exercises[exIdx].sets.splice(setIdx, 1);
  saveSession(_session);
  _reRenderExercisesList();
}

function _reRenderExercisesList() {
  const list = _container.querySelector('#exercises-list');
  if (!list) return;
  list.innerHTML = _buildExercisesListHTML();
  if (window.lucide) window.lucide.createIcons({ nodes: [list] });
  _updateSessionBadge();
}

function _updateSessionBadge() {
  const badge = document.getElementById('session-group-badge');
  if (!badge) return;
  const { name, badgeClass } = getSessionGroupDisplay(_session, getCustomExercises());
  badge.textContent = name;
  badge.className   = `badge ${badgeClass}`;
}

// ── Feature 2: Supersets ───────────────────────────────────

/** El timer solo dispara en el último ejercicio del grupo (por posición en array). */
function _shouldFireRestTimer(exIdx) {
  const ex = _session.exercises[exIdx];
  if (!ex.supersetId) return true;

  const groupIdxs = _session.exercises
    .map((e, i) => e.supersetId === ex.supersetId ? i : -1)
    .filter(i => i >= 0);

  return exIdx === Math.max(...groupIdxs);
}

function _openSupersetModal(exIdx) {
  const ex     = _session.exercises[exIdx];
  const others = _session.exercises
    .map((e, i) => ({ e, i }))
    .filter(({ e, i }) => i !== exIdx && !(e.supersetId && e.supersetId === ex.supersetId));

  if (others.length === 0) {
    showToast('Agregá más ejercicios para crear una superserie.', 'info');
    return;
  }

  const body = openModal({
    title: 'Crear superserie',
    body: `
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
        ¿Con qué ejercicio querés vincular <strong>${ex.name}</strong>?
      </p>
      <div style="display:flex;flex-direction:column;gap:var(--space-2)">
        ${others.map(({ e, i }) => `
          <div class="exercise-item superset-pick-item" data-target-idx="${i}" style="cursor:pointer">
            <div class="exercise-item-info">
              <div class="exercise-item-name">${e.name}</div>
              ${e.supersetId ? `<div class="exercise-item-meta" style="color:var(--accent-primary)">Ya en una superserie</div>` : ''}
            </div>
            <i data-lucide="link-2" style="width:16px;height:16px;color:var(--accent-primary)"></i>
          </div>
        `).join('')}
      </div>
    `,
  });

  if (window.lucide) window.lucide.createIcons({ nodes: [body] });

  body.querySelectorAll('.superset-pick-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetIdx = parseInt(item.dataset.targetIdx, 10);
      _createOrJoinSuperset(exIdx, targetIdx);
    });
  });
}

function _createOrJoinSuperset(exIdx, targetIdx) {
  const ex1 = _session.exercises[exIdx];
  const ex2 = _session.exercises[targetIdx];
  const id  = ex1.supersetId ?? ex2.supersetId ?? _uid();
  ex1.supersetId = id;
  ex2.supersetId = id;
  saveSession(_session);
  closeModal();
  _reRenderExercisesList();
}

function _removeFromSuperset(exIdx) {
  const ex      = _session.exercises[exIdx];
  const groupId = ex.supersetId;
  delete ex.supersetId;

  // Si queda solo uno en el grupo, también lo desvinculamos
  const remaining = _session.exercises.filter(e => e.supersetId === groupId);
  if (remaining.length === 1) delete remaining[0].supersetId;

  saveSession(_session);
  _reRenderExercisesList();
}

// ── Feature 1: Temporizador de descanso ───────────────────

function _getRestDuration() {
  return getSettings().restTimerDuration ?? 90;
}

function _saveRestDuration(sec) {
  saveSettings({ restTimerDuration: sec });
}

function _startRestTimer(duration) {
  _stopRestTimer();
  _restTimer = { active: true, remaining: duration, total: duration, paused: false, intervalId: null };
  _showRestTimerOverlay();
  _updateRestTimerDisplay();
  _restTimer.intervalId = setInterval(() => {
    if (_restTimer.paused) return;
    _restTimer.remaining--;
    if (_restTimer.remaining <= 0) {
      _stopRestTimer();
      _onRestTimerEnd();
    } else {
      _updateRestTimerDisplay();
    }
  }, 1000);
}

function _stopRestTimer() {
  if (_restTimer.intervalId) clearInterval(_restTimer.intervalId);
  _restTimer = { active: false, remaining: 0, total: 0, paused: false, intervalId: null };
  _hideRestTimerOverlay();
}

function _onRestTimerEnd() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  _playBeep();
  showToast('Fin del descanso. Siguiente serie.', 'success', 2500);
}

function _togglePauseRestTimer() {
  _restTimer.paused = !_restTimer.paused;
  const btn = document.getElementById('rest-pause-btn');
  if (!btn) return;
  btn.innerHTML = _restTimer.paused
    ? `<i data-lucide="play" style="width:14px;height:14px"></i>`
    : `<i data-lucide="pause" style="width:14px;height:14px"></i>`;
  btn.title = _restTimer.paused ? 'Reanudar' : 'Pausar';
  if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
}

function _showRestTimerOverlay() {
  let overlay = document.getElementById('rest-timer-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id        = 'rest-timer-overlay';
    overlay.className = 'rest-timer-overlay';
    (document.getElementById('app') || document.body).appendChild(overlay);
  }

  const duration = _restTimer.total;
  overlay.innerHTML = `
    <div class="rest-timer-progress-track">
      <div id="rest-timer-progress" class="rest-timer-progress-fill" style="width:100%"></div>
    </div>
    <div class="rest-timer-body">
      <div class="rest-timer-info">
        <i data-lucide="timer" style="width:15px;height:15px;color:var(--accent-primary)"></i>
        <span class="rest-timer-label">Descanso</span>
        <div class="rest-timer-duration-chips">
          ${[60, 90, 120].map(s => `
            <button class="chip${s === duration ? ' active' : ''} rest-duration-chip"
                    data-sec="${s}" style="padding:2px 8px;font-size:10px">${s}s</button>
          `).join('')}
        </div>
      </div>
      <span class="rest-timer-count" id="rest-timer-count">--</span>
      <div class="rest-timer-actions">
        <button id="rest-pause-btn" class="icon-btn" title="Pausar">
          <i data-lucide="pause" style="width:14px;height:14px"></i>
        </button>
        <button id="rest-skip-btn" class="btn btn-secondary btn-sm">Saltear</button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  if (window.lucide) window.lucide.createIcons({ nodes: [overlay] });

  overlay.querySelector('#rest-skip-btn').addEventListener('click', _stopRestTimer);
  overlay.querySelector('#rest-pause-btn').addEventListener('click', _togglePauseRestTimer);
  overlay.querySelectorAll('.rest-duration-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseInt(btn.dataset.sec, 10);
      _saveRestDuration(sec);
      _startRestTimer(sec);
    });
  });
}

function _hideRestTimerOverlay() {
  const overlay = document.getElementById('rest-timer-overlay');
  if (overlay) overlay.classList.remove('active');
}

function _updateRestTimerDisplay() {
  const { remaining, total } = _restTimer;

  const countEl = document.getElementById('rest-timer-count');
  if (countEl) {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    countEl.textContent = m > 0
      ? `${m}:${String(s).padStart(2, '0')}`
      : `${s}s`;
  }

  const progressEl = document.getElementById('rest-timer-progress');
  if (progressEl) progressEl.style.width = `${(remaining / total) * 100}%`;
}

function _playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(880,  0,    0.12);
    play(880,  0.15, 0.12);
    play(1047, 0.30, 0.40);
  } catch {
    // Web Audio API no disponible
  }
}

// ── Timer de sesión ────────────────────────────────────────

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
