/**
 * planning.js — Vista "Planificación"
 *
 * Sub-pantallas:
 *   'routines' tab — Mis Rutinas (predefinidas + personalizadas)
 *   'plan'     tab — Plan Semanal (7 días + adherencia)
 *
 * Editor de rutinas:
 *   _screen = 'editor' — formulario en lugar del listado
 */

import {
  getCustomRoutines, saveCustomRoutine, deleteCustomRoutine,
  getWeeklyPlan, saveWeeklyPlan,
  getSessions, currentWeekDays, currentWeekRange, todayISO, getCustomExercises,
} from '../store.js';
import { MUSCLE_GROUPS } from '../data/exercises.js';
import { ROUTINE_TEMPLATES } from '../data/routineTemplates.js';
import { fetchExternalExercises } from '../data/freeExerciseDb.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

// ── Constantes ──────────────────────────────────────────────

const DAYS_KEYS    = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAYS_DISPLAY = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// ── Estado ──────────────────────────────────────────────────

let _container    = null;
let _tab          = 'routines'; // 'routines' | 'plan'
let _screen       = 'list';     // 'list' | 'editor'
let _draftRoutine = null;       // objeto mutable durante la edición

// ── Entry point ────────────────────────────────────────────

export const PlanningView = {
  render(container) {
    _container = container;
    _screen    = 'list';
    _draftRoutine = null;
    _render();
  },
  destroy() {},
};

function _render() {
  if (_screen === 'editor') {
    _renderEditor();
  } else {
    _renderList();
  }
  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
}

// ══════════════════════════════════════════════════════════════
// PANTALLA: LISTADO
// ══════════════════════════════════════════════════════════════

function _renderList() {
  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Planificación</h1>

      <div class="chip-group" style="margin-bottom:var(--space-5)">
        <button class="chip${_tab === 'routines' ? ' active' : ''}" data-tab="routines">Mis Rutinas</button>
        <button class="chip${_tab === 'plan'     ? ' active' : ''}" data-tab="plan">Plan Semanal</button>
      </div>

      ${_tab === 'routines' ? _buildRoutinesHTML() : _buildPlanHTML()}
    </div>
  `;

  _container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { _tab = btn.dataset.tab; _render(); });
  });

  if (_tab === 'routines') _bindRoutinesEvents();
  else                     _bindPlanEvents();
}

// ── Tab: Mis Rutinas ───────────────────────────────────────

function _buildRoutinesHTML() {
  const customs = getCustomRoutines();

  const predefinedHTML = ROUTINE_TEMPLATES.map(t => {
    const group      = MUSCLE_GROUPS.find(g => g.id === t.muscleGroup);
    const badgeClass = group?.badgeClass ?? 'badge-neutral';
    return `
      <div class="card predefined-routine-card" data-template-id="${t.id}"
           style="cursor:pointer;display:flex;align-items:center;gap:var(--space-3)">
        <div style="flex:1;min-width:0">
          <div style="font-weight:var(--weight-semibold)">${_esc(t.name)}</div>
          <div style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:2px">${_esc(t.description)}</div>
          <div style="margin-top:var(--space-2);display:flex;gap:var(--space-2);flex-wrap:wrap">
            <span class="badge ${badgeClass}">${t.exercises.length} ejercicios</span>
            <span class="badge badge-neutral">Predefinida</span>
          </div>
        </div>
        <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text-tertiary);flex-shrink:0"></i>
      </div>`;
  }).join('');

  const customHTML = customs.length === 0
    ? `<div class="empty-state" style="padding:var(--space-8) 0">
         <i data-lucide="clipboard-list"></i>
         <h3>Sin rutinas personalizadas</h3>
         <p>Creá tu primera rutina para adaptarla a tu entrenamiento.</p>
       </div>`
    : customs.map(r => {
        const group      = MUSCLE_GROUPS.find(g => g.id === r.muscleGroup);
        const badgeClass = group?.badgeClass ?? 'badge-neutral';
        const groupName  = group?.name ?? 'General';
        return `
          <div class="card" style="display:flex;align-items:center;gap:var(--space-3)">
            <div style="flex:1;min-width:0">
              <div style="font-weight:var(--weight-semibold)">${_esc(r.name)}</div>
              <div style="margin-top:var(--space-2);display:flex;gap:var(--space-2);flex-wrap:wrap">
                <span class="badge ${badgeClass}">${_esc(groupName)}</span>
                <span class="badge badge-neutral">${r.exercises.length} ejercicios</span>
              </div>
            </div>
            <div style="display:flex;gap:var(--space-1);flex-shrink:0">
              <button class="icon-btn edit-routine-btn" data-id="${r.id}" title="Editar">
                <i data-lucide="pencil"></i>
              </button>
              <button class="icon-btn duplicate-routine-btn" data-id="${r.id}" title="Duplicar">
                <i data-lucide="copy"></i>
              </button>
              <button class="icon-btn delete-routine-btn" data-id="${r.id}" title="Eliminar"
                      style="color:var(--danger)">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>`;
      }).join('');

  return `
    <div class="section-header" style="margin-top:0">
      <span class="section-title">Predefinidas</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-6)">
      ${predefinedHTML}
    </div>

    <div class="section-header">
      <span class="section-title">Mis rutinas</span>
      <button class="btn btn-secondary btn-sm" id="new-routine-btn">
        <i data-lucide="plus"></i> Nueva
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      ${customHTML}
    </div>`;
}

function _bindRoutinesEvents() {
  _container.querySelector('#new-routine-btn')?.addEventListener('click', () => {
    _draftRoutine = { id: null, name: '', muscleGroup: 'chest-triceps', exercises: [] };
    _screen = 'editor';
    _render();
  });

  _container.querySelectorAll('.edit-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = getCustomRoutines().find(x => x.id === btn.dataset.id);
      if (!r) return;
      _draftRoutine = JSON.parse(JSON.stringify(r));
      _screen = 'editor';
      _render();
    });
  });

  _container.querySelectorAll('.duplicate-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = getCustomRoutines().find(x => x.id === btn.dataset.id);
      if (!r) return;
      _draftRoutine = { ...JSON.parse(JSON.stringify(r)), id: null, name: `${r.name} (copia)` };
      _screen = 'editor';
      _render();
    });
  });

  _container.querySelectorAll('.delete-routine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = getCustomRoutines().find(x => x.id === btn.dataset.id);
      if (!r) return;
      if (!confirm(`¿Eliminar la rutina "${r.name}"? También se quitará del plan semanal.`)) return;
      deleteCustomRoutine(r.id);
      showToast(`"${r.name}" eliminada.`, 'success');
      _render();
    });
  });

  _container.querySelectorAll('.predefined-routine-card').forEach(card => {
    card.addEventListener('click', () => {
      const t = ROUTINE_TEMPLATES.find(x => x.id === card.dataset.templateId);
      if (!t) return;
      _openPredefinedDetail(t);
    });
  });
}

function _openPredefinedDetail(t) {
  const group      = MUSCLE_GROUPS.find(g => g.id === t.muscleGroup);
  const badgeClass = group?.badgeClass ?? 'badge-neutral';
  const groupName  = group?.name ?? '';

  const exercisesHTML = t.exercises.map(ex => {
    const typeLabel = ex.type === 'cardio'   ? 'Cardio'
                    : ex.type === 'mobility' ? 'Movilidad'
                    : ex.type === 'stretch'  ? 'Estiramiento'
                    : 'Fuerza';
    let setsInfo;
    if (ex.type === 'cardio') {
      setsInfo = `${ex.durationMin ?? 30} min`;
    } else if (ex.type === 'stretch') {
      setsInfo = `${ex.sets}×${ex.durationSec ?? 30}s`;
    } else if (ex.type === 'mobility') {
      setsInfo = ex.metric === 'time'
        ? `${ex.sets}×${ex.durationSec ?? 30}s`
        : `${ex.sets}×${ex.repsMin ?? 10} reps`;
    } else {
      setsInfo = (ex.repsMax && ex.repsMax !== ex.repsMin)
        ? `${ex.sets}×${ex.repsMin}–${ex.repsMax}`
        : `${ex.sets}×${ex.repsMin ?? '?'}`;
    }
    return `
      <div class="exercise-item" style="pointer-events:none">
        <div class="exercise-item-info">
          <div class="exercise-item-name">${_esc(ex.displayName)}</div>
          <div class="exercise-item-meta">${typeLabel}</div>
        </div>
        <div class="exercise-item-actions">
          <span class="badge badge-neutral" style="flex-shrink:0">${setsInfo}</span>
        </div>
      </div>`;
  }).join('');

  const body = openModal({
    title: _esc(t.name),
    body: `
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4)">
        <span class="badge ${badgeClass}">${_esc(groupName)}</span>
        <span class="badge badge-neutral">Predefinida · Solo lectura</span>
      </div>
      <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4)">${_esc(t.description)}</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-1)">
        ${exercisesHTML}
      </div>`,
  });
  if (window.lucide) window.lucide.createIcons({ nodes: [body] });
}

// ── Tab: Plan Semanal ──────────────────────────────────────

function _buildPlanHTML() {
  const plan    = getWeeklyPlan();
  const customs = getCustomRoutines();
  const { start, end } = currentWeekRange();
  const sessions = getSessions();
  const weekDays = currentWeekDays();

  const sessionDates = new Set(
    sessions.filter(s => s.date >= start && s.date <= end).map(s => s.date),
  );

  const cardsHTML = weekDays.map(({ iso }, i) => {
    const dayKey  = DAYS_KEYS[i];
    const dayName = DAYS_DISPLAY[i];
    const entry   = plan[dayKey];
    const hasSession = sessionDates.has(iso);

    const routineInfo = _resolveRoutineInfo(entry, customs);

    let statusHTML = '';
    if (hasSession) {
      statusHTML = `<span style="color:var(--accent-primary);font-size:var(--text-sm)">✅ Entrenado</span>`;
    } else if (entry && routineInfo) {
      statusHTML = `<span style="color:var(--text-tertiary);font-size:var(--text-sm)">⏳ Pendiente</span>`;
    }

    return `
      <div class="card" style="padding:var(--space-4)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-2)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:var(--weight-semibold);font-size:var(--text-base);margin-bottom:var(--space-1)">${dayName}</div>
            ${routineInfo
              ? `<div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
                   <span class="badge ${routineInfo.badgeClass}">${_esc(routineInfo.name)}</span>
                   ${statusHTML}
                 </div>`
              : `<span style="color:var(--text-tertiary);font-size:var(--text-sm)">Sin rutina asignada</span>`
            }
          </div>
          <div style="display:flex;gap:var(--space-2);flex-shrink:0;align-items:center">
            <button class="btn btn-secondary btn-sm assign-day-btn"
                    data-day="${dayKey}" data-day-name="${dayName}">
              ${entry ? 'Cambiar' : 'Asignar'}
            </button>
            ${entry
              ? `<button class="btn btn-secondary btn-sm clear-day-btn"
                         data-day="${dayKey}" style="color:var(--danger)">Quitar</button>`
              : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      ${cardsHTML}
    </div>`;
}

function _bindPlanEvents() {
  _container.querySelectorAll('.assign-day-btn').forEach(btn => {
    btn.addEventListener('click', () => _openAssignModal(btn.dataset.day, btn.dataset.dayName));
  });

  _container.querySelectorAll('.clear-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = getWeeklyPlan();
      plan[btn.dataset.day] = null;
      saveWeeklyPlan(plan);
      _render();
    });
  });
}

function _openAssignModal(dayKey, dayName) {
  const plan    = getWeeklyPlan();
  const customs = getCustomRoutines();
  const current = plan[dayKey];

  const buildItem = (id, name, meta, badgeClass) => {
    const isCurrent = current === id;
    return `
      <div class="exercise-item assign-routine-item${isCurrent ? ' ex-already-added' : ''}"
           data-routine-id="${id}" style="cursor:pointer">
        <div class="exercise-item-info">
          <div class="exercise-item-name">${_esc(name)}</div>
          <div class="exercise-item-meta">${_esc(meta)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="badge ${badgeClass}" style="flex-shrink:0">${_esc(badgeClass === 'badge-neutral' ? '' : '')}</span>
          ${isCurrent ? `<i data-lucide="check" style="color:var(--accent-primary);width:16px;height:16px"></i>` : ''}
        </div>
      </div>`;
  };

  const predefinedHTML = ROUTINE_TEMPLATES.map(t => {
    const group = MUSCLE_GROUPS.find(g => g.id === t.muscleGroup);
    return buildItem(t.id, t.name, t.description, group?.badgeClass ?? 'badge-neutral');
  }).join('');

  const customHTML = customs.length === 0
    ? `<div style="padding:var(--space-3) 0;color:var(--text-tertiary);font-size:var(--text-sm)">Sin rutinas personalizadas — creá una desde la pestaña "Mis Rutinas".</div>`
    : customs.map(r => {
        const group = MUSCLE_GROUPS.find(g => g.id === r.muscleGroup);
        return buildItem(r.id, r.name, `${r.exercises.length} ejercicios`, group?.badgeClass ?? 'badge-neutral');
      }).join('');

  const body = openModal({
    title: `Rutina para ${dayName}`,
    body: `
      <p style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-secondary);
                margin-bottom:var(--space-2)">Predefinidas</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-1);margin-bottom:var(--space-4)">
        ${predefinedHTML}
      </div>
      <p style="font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--text-secondary);
                margin-bottom:var(--space-2)">Personalizadas</p>
      <div style="display:flex;flex-direction:column;gap:var(--space-1)">
        ${customHTML}
      </div>`,
  });

  if (window.lucide) window.lucide.createIcons({ nodes: [body] });

  body.querySelectorAll('.assign-routine-item:not(.ex-already-added)').forEach(item => {
    item.addEventListener('click', () => {
      const p = getWeeklyPlan();
      p[dayKey] = item.dataset.routineId;
      saveWeeklyPlan(p);
      closeModal();
      _render();
    });
  });
}

// ── Helper: resolver info de una entrada del plan ──────────

function _resolveRoutineInfo(entry, customs) {
  if (!entry) return null;
  const template = ROUTINE_TEMPLATES.find(t => t.id === entry);
  if (template) {
    const g = MUSCLE_GROUPS.find(g => g.id === template.muscleGroup);
    return { name: template.name, badgeClass: g?.badgeClass ?? 'badge-neutral' };
  }
  const routine = customs.find(r => r.id === entry);
  if (routine) {
    const g = MUSCLE_GROUPS.find(g => g.id === routine.muscleGroup);
    return { name: routine.name, badgeClass: g?.badgeClass ?? 'badge-neutral' };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// PANTALLA: EDITOR DE RUTINA
// ══════════════════════════════════════════════════════════════

function _renderEditor() {
  const r = _draftRoutine;
  const total = r.exercises.length;

  _container.innerHTML = `
    <div class="view">
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5)">
        <button class="icon-btn" id="editor-back-btn"><i data-lucide="arrow-left"></i></button>
        <h1 class="page-title" style="margin:0">${r.id ? 'Editar rutina' : 'Nueva rutina'}</h1>
      </div>

      <div style="margin-bottom:var(--space-4)">
        <label class="label" for="routine-name">Nombre</label>
        <input id="routine-name" type="text" class="input-field"
               value="${_esc(r.name)}" placeholder="Ej: Push Day, Pull Day..." autocomplete="off">
      </div>

      <div style="margin-bottom:var(--space-5)">
        <label class="label">Grupo muscular</label>
        <div class="chip-group" id="mg-chips">
          ${MUSCLE_GROUPS.map(g => `
            <button class="chip${r.muscleGroup === g.id ? ' active' : ''}"
                    data-group-id="${g.id}">${_esc(g.name)}</button>
          `).join('')}
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Ejercicios <span id="editor-ex-count" style="color:var(--text-tertiary);font-weight:var(--weight-normal)">(${total})</span></span>
        <button class="btn btn-secondary btn-sm" id="add-ex-btn">
          <i data-lucide="plus"></i> Agregar
        </button>
      </div>

      <div id="routine-exercise-list" style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-5)">
        ${_buildEditorExercisesHTML()}
      </div>

      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="editor-cancel-btn" style="flex:1">Cancelar</button>
        <button class="btn btn-primary" id="editor-save-btn" style="flex:2">
          <i data-lucide="check"></i> Guardar rutina
        </button>
      </div>
    </div>
  `;

  _bindEditorEvents();
}

function _buildEditorExercisesHTML() {
  const exs   = _draftRoutine.exercises;
  const total = exs.length;
  if (total === 0) {
    return `<div style="text-align:center;padding:var(--space-6);color:var(--text-tertiary);
                        font-size:var(--text-sm);border:1px dashed var(--border-base);
                        border-radius:var(--radius-md)">
              Agregá ejercicios a la rutina
            </div>`;
  }
  return exs.map((ex, i) => _editorExerciseCardHTML(ex, i, total)).join('');
}

function _editorExerciseCardHTML(ex, idx, total) {
  const type   = ex.type   ?? 'strength';
  const metric = ex.metric ?? 'reps';

  const typeBadge = type !== 'strength'
    ? `<span class="badge badge-general" style="margin-left:var(--space-2)">${_typeLabel(type, metric)}</span>`
    : '';

  const setsHTML = ex.sets.length === 0
    ? `<div style="font-size:var(--text-sm);color:var(--text-tertiary);padding:var(--space-2) 0">Sin series</div>`
    : ex.sets.map((set, si) => _editorSetRowHTML(idx, si, set, type, metric)).join('');

  return `
    <div class="card editor-exercise-card" style="padding:var(--space-4)">
      <div style="display:flex;align-items:flex-start;gap:var(--space-2);margin-bottom:var(--space-3)">
        <div style="flex:1;min-width:0">
          <span style="font-weight:var(--weight-semibold)">${_esc(ex.name)}</span>${typeBadge}
        </div>
        <div style="display:flex;gap:2px;flex-shrink:0">
          <button class="icon-btn ex-move-up" data-idx="${idx}" title="Subir"
                  ${idx === 0 ? 'disabled style="opacity:.3"' : ''}>
            <i data-lucide="chevron-up"></i>
          </button>
          <button class="icon-btn ex-move-down" data-idx="${idx}" title="Bajar"
                  ${idx === total - 1 ? 'disabled style="opacity:.3"' : ''}>
            <i data-lucide="chevron-down"></i>
          </button>
          <button class="icon-btn ex-delete" data-idx="${idx}" title="Eliminar ejercicio"
                  style="color:var(--danger)">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>

      ${_editorSetsHeaderHTML(type, metric)}
      ${setsHTML}

      <button class="btn btn-ghost btn-sm add-set-btn" data-idx="${idx}"
              style="margin-top:var(--space-2);width:100%">
        <i data-lucide="plus" style="width:14px;height:14px"></i>
        Agregar serie
      </button>
    </div>`;
}

function _editorSetsHeaderHTML(type, metric) {
  if (type === 'cardio') {
    return `<div class="editor-sets-header"><span>#</span><span>Min</span></div>`;
  }
  if (type === 'stretch' || (type === 'mobility' && metric === 'time')) {
    return `<div class="editor-sets-header"><span>#</span><span>Seg</span></div>`;
  }
  if (type === 'mobility') {
    return `<div class="editor-sets-header"><span>#</span><span>Reps</span></div>`;
  }
  return `<div class="editor-sets-header"><span>#</span><span>Kg</span><span></span><span>Reps</span></div>`;
}

function _editorSetRowHTML(exIdx, setIdx, set, type, metric) {
  const num = `<span class="editor-set-num">${setIdx + 1}</span>`;
  const del = `<button class="icon-btn editor-del-set" data-ex="${exIdx}" data-set="${setIdx}" title="Quitar serie"
                        style="width:28px;height:28px;flex-shrink:0">
                 <i data-lucide="x" style="width:13px;height:13px"></i>
               </button>`;

  if (type === 'cardio') {
    return `<div class="editor-set-row">
      ${num}
      <input type="number" class="input-field input-number editor-set-input"
             data-ex="${exIdx}" data-set="${setIdx}" data-field="durationMin"
             value="${set.durationMin ?? 20}" min="1" max="999">
      ${del}
    </div>`;
  }

  if (type === 'stretch' || (type === 'mobility' && metric === 'time')) {
    return `<div class="editor-set-row">
      ${num}
      <input type="number" class="input-field input-number editor-set-input"
             data-ex="${exIdx}" data-set="${setIdx}" data-field="durationSec"
             value="${set.durationSec ?? 30}" min="1" max="999">
      ${del}
    </div>`;
  }

  if (type === 'mobility') {
    return `<div class="editor-set-row">
      ${num}
      <input type="number" class="input-field input-number editor-set-input"
             data-ex="${exIdx}" data-set="${setIdx}" data-field="reps"
             value="${set.reps ?? 10}" min="1" max="999">
      ${del}
    </div>`;
  }

  // strength (default)
  return `<div class="editor-set-row">
    ${num}
    <input type="number" class="input-field input-number editor-set-input"
           data-ex="${exIdx}" data-set="${setIdx}" data-field="weight"
           value="${set.weight ?? 0}" min="0" max="9999" step="2.5">
    <span style="color:var(--text-tertiary);font-size:var(--text-sm)">×</span>
    <input type="number" class="input-field input-number editor-set-input"
           data-ex="${exIdx}" data-set="${setIdx}" data-field="reps"
           value="${set.reps ?? 10}" min="1" max="999">
    ${del}
  </div>`;
}

function _reRenderEditorExercises() {
  const list = _container.querySelector('#routine-exercise-list');
  if (!list) return;
  list.innerHTML = _buildEditorExercisesHTML();
  if (window.lucide) window.lucide.createIcons({ nodes: [list] });

  const countEl = _container.querySelector('#editor-ex-count');
  if (countEl) countEl.textContent = `(${_draftRoutine.exercises.length})`;
}

// ── Editor — event binding ─────────────────────────────────

function _bindEditorEvents() {
  // Back / Cancel — volver al listado sin guardar
  const goBack = () => { _screen = 'list'; _draftRoutine = null; _render(); };
  _container.querySelector('#editor-back-btn').addEventListener('click', goBack);
  _container.querySelector('#editor-cancel-btn').addEventListener('click', goBack);

  // Save
  _container.querySelector('#editor-save-btn').addEventListener('click', _saveRoutine);

  // Muscle group chips
  _container.querySelector('#mg-chips').addEventListener('click', e => {
    const chip = e.target.closest('[data-group-id]');
    if (!chip) return;
    _draftRoutine.muscleGroup = chip.dataset.groupId;
    _container.querySelectorAll('#mg-chips .chip')
      .forEach(c => c.classList.toggle('active', c.dataset.groupId === _draftRoutine.muscleGroup));
  });

  // Add exercise
  _container.querySelector('#add-ex-btn').addEventListener('click', _openExercisePicker);

  // Exercise list — event delegation (persists across _reRenderEditorExercises)
  const list = _container.querySelector('#routine-exercise-list');

  list.addEventListener('click', e => {
    // Move up
    const upBtn = e.target.closest('.ex-move-up');
    if (upBtn && !upBtn.disabled) {
      const i = parseInt(upBtn.dataset.idx, 10);
      [_draftRoutine.exercises[i - 1], _draftRoutine.exercises[i]] =
      [_draftRoutine.exercises[i],     _draftRoutine.exercises[i - 1]];
      _reRenderEditorExercises();
      return;
    }

    // Move down
    const downBtn = e.target.closest('.ex-move-down');
    if (downBtn && !downBtn.disabled) {
      const i = parseInt(downBtn.dataset.idx, 10);
      [_draftRoutine.exercises[i], _draftRoutine.exercises[i + 1]] =
      [_draftRoutine.exercises[i + 1], _draftRoutine.exercises[i]];
      _reRenderEditorExercises();
      return;
    }

    // Delete exercise
    const delBtn = e.target.closest('.ex-delete');
    if (delBtn) {
      _draftRoutine.exercises.splice(parseInt(delBtn.dataset.idx, 10), 1);
      _reRenderEditorExercises();
      return;
    }

    // Delete set
    const delSet = e.target.closest('.editor-del-set');
    if (delSet) {
      const ex  = parseInt(delSet.dataset.ex,  10);
      const set = parseInt(delSet.dataset.set, 10);
      _draftRoutine.exercises[ex].sets.splice(set, 1);
      _reRenderEditorExercises();
      return;
    }

    // Add set
    const addSet = e.target.closest('.add-set-btn');
    if (addSet) {
      const idx  = parseInt(addSet.dataset.idx, 10);
      const ex   = _draftRoutine.exercises[idx];
      const type   = ex.type   ?? 'strength';
      const metric = ex.metric ?? 'reps';
      const last   = ex.sets[ex.sets.length - 1];

      let newSet;
      if (type === 'cardio') {
        newSet = { durationMin: last?.durationMin ?? 20, speedKmh: last?.speedKmh ?? 5, inclinePct: last?.inclinePct ?? 0 };
      } else if (type === 'stretch' || (type === 'mobility' && metric === 'time')) {
        newSet = { durationSec: last?.durationSec ?? 30 };
      } else if (type === 'mobility') {
        newSet = { reps: last?.reps ?? 10 };
      } else {
        newSet = { weight: last?.weight ?? 0, reps: last?.reps ?? 10 };
      }
      ex.sets.push(newSet);
      _reRenderEditorExercises();
      return;
    }
  });

  // Input changes — actualizar modelo sin re-renderizar
  list.addEventListener('input', e => {
    const input = e.target.closest('.editor-set-input');
    if (!input) return;
    const exIdx  = parseInt(input.dataset.ex,  10);
    const setIdx = parseInt(input.dataset.set, 10);
    const val    = parseFloat(input.value);
    _draftRoutine.exercises[exIdx].sets[setIdx][input.dataset.field] = isNaN(val) ? 0 : val;
  });
}

function _saveRoutine() {
  const nameInput = _container.querySelector('#routine-name');
  const name      = (nameInput?.value ?? '').trim();

  if (!name) {
    showToast('El nombre de la rutina es obligatorio.', 'danger');
    nameInput?.focus();
    return;
  }
  if (_draftRoutine.exercises.length === 0) {
    showToast('Agregá al menos un ejercicio antes de guardar.', 'danger');
    return;
  }

  const toSave  = { ..._draftRoutine, name };
  const saved   = saveCustomRoutine(toSave);
  showToast(`"${saved.name}" guardada.`, 'success');
  _screen = 'list';
  _draftRoutine = null;
  _render();
}

// ── Exercise picker (para agregar al editor) ───────────────

async function _openExercisePicker() {
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

  const buildListHTML = () => {
    const exercises = getFiltered();
    if (!exercises.length) {
      return `<div style="text-align:center;padding:var(--space-8) 0;color:var(--text-tertiary);font-size:var(--text-sm)">Sin resultados</div>`;
    }
    const alreadyAdded = new Set(_draftRoutine.exercises.map(e => e.exerciseId));
    const byCategory = {};
    exercises.forEach(ex => {
      const cat = ex.category ?? 'Otros';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(ex);
    });
    return Object.entries(byCategory).map(([cat, exs]) => `
      <div class="exercise-group-header">${_esc(cat)}</div>
      ${exs.map(ex => {
        const added = alreadyAdded.has(ex.id);
        return `
          <div class="exercise-item selectable-exercise${added ? ' ex-already-added' : ''}"
               data-id="${ex.id}" data-name="${_esc(ex.name)}" style="cursor:pointer">
            <div class="exercise-item-info">
              <div class="exercise-item-name">${_esc(ex.name)}</div>
              <div class="exercise-item-meta">${ex.custom ? 'Personalizado' : (_typeLabel(ex.type, ex.metric) || ex.category)}</div>
            </div>
            ${added
              ? `<i data-lucide="check" style="color:var(--accent-primary);width:16px;height:16px"></i>`
              : `<i data-lucide="plus"  style="color:var(--accent-primary);width:16px;height:16px"></i>`}
          </div>`;
      }).join('')}
    `).join('');
  };

  const body = openModal({
    title: 'Agregar ejercicio',
    body: `
      <div class="search-bar" style="margin-bottom:var(--space-3)">
        <i data-lucide="search"></i>
        <input type="text" class="input-field" id="ex-search" placeholder="Buscar ejercicio..." autocomplete="off">
      </div>
      <div class="chip-group" id="ex-filter-chips"
           style="margin-bottom:var(--space-4);flex-wrap:nowrap;overflow-x:auto;padding-bottom:var(--space-1)">
        ${filterSections.map(f => `
          <button class="chip${f.id === 'all' ? ' active' : ''}" data-filter="${f.id}" style="flex-shrink:0">${f.label}</button>
        `).join('')}
      </div>
      <div id="ex-modal-list">${buildListHTML()}</div>`,
  });

  const refreshList = () => {
    const listEl = body.querySelector('#ex-modal-list');
    listEl.innerHTML = buildListHTML();
    if (window.lucide) window.lucide.createIcons({ nodes: [listEl] });
  };

  body.querySelector('#ex-filter-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    currentFilter = chip.dataset.filter;
    body.querySelectorAll('#ex-filter-chips .chip')
      .forEach(c => c.classList.toggle('active', c.dataset.filter === currentFilter));
    refreshList();
  });

  body.querySelector('#ex-search').addEventListener('input', e => {
    currentSearch = e.target.value;
    refreshList();
  });

  body.querySelector('#ex-modal-list').addEventListener('click', e => {
    const item = e.target.closest('.selectable-exercise');
    if (!item || item.classList.contains('ex-already-added')) return;

    const libEx = all.find(ex => ex.id === item.dataset.id);
    const type   = libEx?.type   ?? 'strength';
    const metric = libEx?.metric ?? 'reps';

    // Series por defecto: 3
    const defaultSets = [];
    for (let i = 0; i < 3; i++) {
      if (type === 'cardio') {
        defaultSets.push({ durationMin: 20, speedKmh: 5, inclinePct: 0 });
      } else if (type === 'stretch' || (type === 'mobility' && metric === 'time')) {
        defaultSets.push({ durationSec: 30 });
      } else if (type === 'mobility') {
        defaultSets.push({ reps: 10 });
      } else {
        defaultSets.push({ weight: 0, reps: 10 });
      }
    }

    _draftRoutine.exercises.push({
      exerciseId: item.dataset.id,
      name:       item.dataset.name,
      type, metric,
      sets: defaultSets,
    });

    item.classList.add('ex-already-added');
    const icon = item.querySelector('[data-lucide]');
    if (icon) icon.setAttribute('data-lucide', 'check');
    if (window.lucide) window.lucide.createIcons({ nodes: [item] });

    showToast(`${item.dataset.name} agregado.`, 'success');
    _reRenderEditorExercises();
  });
}

// ── Utils ──────────────────────────────────────────────────

function _esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _typeLabel(type, metric) {
  if (type === 'cardio')                           return 'Cardio';
  if (type === 'stretch')                          return 'Estiramiento';
  if (type === 'mobility' && metric === 'time')    return 'Movilidad';
  if (type === 'mobility')                         return 'Movilidad';
  return '';
}
