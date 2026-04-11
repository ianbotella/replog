/**
 * exercises.js — Vista "Ejercicios"
 * Biblioteca de ejercicios: predefinidos + custom.
 * Permite buscar, filtrar por grupo y agregar ejercicios personalizados.
 */

import {
  getCustomExercises, saveCustomExercise, deleteCustomExercise,
} from '../store.js';
import { PREDEFINED_EXERCISES, MUSCLE_GROUPS, GENERAL_GROUP } from '../data/exercises.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _container    = null;
let _filterGroup  = 'all';
let _searchQuery  = '';

export const ExercisesView = {
  render(container) {
    _container   = container;
    _filterGroup = 'all';
    _searchQuery = '';
    _render();
  },
  destroy() {},
};

// ── Render ─────────────────────────────────────────────────

function _render() {
  const custom = getCustomExercises();
  const all    = [...PREDEFINED_EXERCISES, ...custom];
  const total  = all.length;

  _container.innerHTML = `
    <div class="view">
      <div class="section-header">
        <div>
          <h1 class="page-title">Ejercicios</h1>
          <p class="page-subtitle">${total} en la biblioteca</p>
        </div>
        <button class="btn btn-primary btn-sm" id="add-custom-btn">
          <i data-lucide="plus"></i> Nuevo
        </button>
      </div>

      <!-- Búsqueda -->
      <div class="search-bar" style="margin-bottom:var(--space-4)">
        <i data-lucide="search"></i>
        <input type="text" class="input-field" id="ex-search"
          placeholder="Buscar ejercicio..." value="${_searchQuery}">
      </div>

      <!-- Filtro por grupo muscular -->
      <div class="chip-group" id="group-filter" style="margin-bottom:var(--space-5)">
        <button class="chip ${_filterGroup === 'all' ? 'active' : ''}" data-group="all">Todos</button>
        ${MUSCLE_GROUPS.map(g => `
          <button class="chip ${_filterGroup === g.id ? 'active' : ''}" data-group="${g.id}">
            ${g.shortName}
          </button>
        `).join('')}
        <button class="chip ${_filterGroup === 'general' ? 'active' : ''}" data-group="general">
          ${GENERAL_GROUP.shortName}
        </button>
      </div>

      <!-- Lista de ejercicios -->
      <div id="exercises-list">
        ${_exerciseListHTML(all)}
      </div>
    </div>
  `;

  _bindEvents();
  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
}

function _exerciseListHTML(all) {
  // Aplicar filtros
  let filtered = all.filter(ex => {
    const matchGroup  = _filterGroup === 'all' || ex.muscleGroup === _filterGroup;
    const matchSearch = ex.name.toLowerCase().includes(_searchQuery.toLowerCase());
    return matchGroup && matchSearch;
  });

  if (filtered.length === 0) {
    return `
      <div class="empty-state" style="padding:var(--space-10) 0">
        <i data-lucide="search-x" style="width:36px;height:36px;color:var(--text-tertiary)"></i>
        <h3>Sin resultados</h3>
        <p>Probá con otra búsqueda o agregá un ejercicio personalizado.</p>
      </div>
    `;
  }

  // Agrupar por categoría
  const byCat = {};
  filtered.forEach(ex => {
    const key = ex.category;
    if (!byCat[key]) byCat[key] = [];
    byCat[key].push(ex);
  });

  return Object.entries(byCat).map(([cat, exs]) => `
    <div class="exercise-group-header">${cat}</div>
    <div class="exercise-list" style="margin-bottom:var(--space-4)">
      ${exs.map(ex => _exerciseItemHTML(ex)).join('')}
    </div>
  `).join('');
}

function _exerciseItemHTML(ex) {
  const group = ex.muscleGroup === 'general'
    ? GENERAL_GROUP
    : MUSCLE_GROUPS.find(g => g.id === ex.muscleGroup);

  const typeLabel = _typeLabel(ex.type, ex.metric);
  const metaText  = ex.custom
    ? `${group?.name ?? ex.muscleGroup} · <span style="color:var(--accent-primary)">Personalizado</span>`
    : typeLabel
      ? `${group?.name ?? ex.muscleGroup} · ${typeLabel}`
      : group?.name ?? ex.muscleGroup;

  return `
    <div class="exercise-item" data-id="${ex.id}">
      <div class="exercise-item-info">
        <div class="exercise-item-name">${ex.name}</div>
        <div class="exercise-item-meta">${metaText}</div>
      </div>
      <div class="exercise-item-actions">
        <span class="badge ${group?.badgeClass ?? 'badge-neutral'}">${ex.category}</span>
        ${ex.custom ? `
          <button class="icon-btn delete-ex-btn" data-id="${ex.id}" aria-label="Eliminar">
            <i data-lucide="trash-2"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/** Etiqueta legible del tipo de ejercicio para mostrar en la UI. */
function _typeLabel(type, metric) {
  if (type === 'cardio')   return 'Cardio';
  if (type === 'stretch')  return 'Estiramiento';
  if (type === 'mobility') return metric === 'time' ? 'Movilidad (tiempo)' : 'Movilidad (reps)';
  return '';
}

// ── Events ─────────────────────────────────────────────────

function _bindEvents() {
  // Búsqueda
  _container.querySelector('#ex-search').addEventListener('input', e => {
    _searchQuery = e.target.value;
    _reRenderList();
  });

  // Filtro por grupo
  _container.querySelector('#group-filter').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    _filterGroup = chip.dataset.group;
    _container.querySelectorAll('#group-filter .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.group === _filterGroup));
    _reRenderList();
  });

  // Eliminar ejercicio custom
  _container.addEventListener('click', e => {
    const btn = e.target.closest('.delete-ex-btn');
    if (!btn) return;
    if (!confirm('¿Eliminar este ejercicio personalizado?')) return;
    deleteCustomExercise(btn.dataset.id);
    showToast('Ejercicio eliminado.', 'info');
    _reRenderList();
  });

  // Agregar ejercicio custom
  _container.querySelector('#add-custom-btn').addEventListener('click', _openAddModal);
}

function _reRenderList() {
  const custom = getCustomExercises();
  const all    = [...PREDEFINED_EXERCISES, ...custom];
  const list   = _container.querySelector('#exercises-list');
  if (!list) return;
  list.innerHTML = _exerciseListHTML(all);
  if (window.lucide) window.lucide.createIcons({ nodes: [list] });
}

// ── Modal agregar ejercicio custom ─────────────────────────

function _openAddModal() {
  // Tipos de ejercicio disponibles para custom
  const typeOptions = [
    { value: 'strength', label: 'Fuerza (peso + reps)' },
    { value: 'cardio',   label: 'Cardio (tiempo + vel. + incl.)' },
    { value: 'mobility', label: 'Movilidad (reps)' },
    { value: 'mobility-time', label: 'Movilidad (tiempo en seg)' },
    { value: 'stretch',  label: 'Estiramiento (duración en seg)' },
  ];

  const allGroups = [
    ...MUSCLE_GROUPS,
    { id: 'general', name: GENERAL_GROUP.name },
  ];

  const body = openModal({
    title: 'Nuevo ejercicio',
    body: `
      <div class="form-group">
        <label class="label" for="new-ex-name">Nombre *</label>
        <input type="text" id="new-ex-name" class="input-field"
          placeholder="Ej: Press Inclinado con Mancuernas" maxlength="60" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="label" for="new-ex-group">Grupo muscular *</label>
        <select id="new-ex-group" class="input-field" style="cursor:pointer">
          ${allGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="label" for="new-ex-type">Tipo de registro *</label>
        <select id="new-ex-type" class="input-field" style="cursor:pointer">
          ${typeOptions.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="label" for="new-ex-category">Categoría *</label>
        <input type="text" id="new-ex-category" class="input-field"
          placeholder="Ej: Pecho, Cardio, Estiramiento..." maxlength="40" autocomplete="off">
      </div>
    `,
    footer: `
      <button class="btn btn-secondary" id="modal-cancel-btn" style="flex:1">Cancelar</button>
      <button class="btn btn-primary" id="modal-save-btn" style="flex:2">
        <i data-lucide="plus"></i> Agregar
      </button>
    `,
  });

  const modalEl = body.closest('.modal-container');

  modalEl.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);

  modalEl.querySelector('#modal-save-btn').addEventListener('click', () => {
    const name     = body.querySelector('#new-ex-name').value.trim();
    const group    = body.querySelector('#new-ex-group').value;
    const typeRaw  = body.querySelector('#new-ex-type').value;
    const category = body.querySelector('#new-ex-category').value.trim();

    if (!name || !category) {
      showToast('Completá nombre y categoría.', 'danger');
      return;
    }

    // Mapear el valor del select al tipo + metric
    const type   = typeRaw === 'mobility-time' ? 'mobility' : typeRaw;
    const metric = typeRaw === 'mobility-time' ? 'time' : (typeRaw === 'mobility' ? 'reps' : undefined);

    const saved = saveCustomExercise({ name, muscleGroup: group, category, type, metric });
    closeModal();
    showToast(`"${saved.name}" agregado a la biblioteca.`, 'success');
    _reRenderList();
  });

  // Auto-sugerir categoría y tipo al cambiar grupo
  body.querySelector('#new-ex-group').addEventListener('change', e => {
    const gId  = e.target.value;
    const cat  = body.querySelector('#new-ex-category');
    const type = body.querySelector('#new-ex-type');
    if (!cat.value) {
      if (gId === 'general') {
        cat.placeholder = 'Ej: Calentamiento, Estiramiento';
      } else {
        const g = MUSCLE_GROUPS.find(m => m.id === gId);
        if (g) cat.placeholder = `Ej: ${g.name.split('+')[0].trim()}`;
      }
    }
    // Sugerir tipo según grupo
    if (gId === 'general' && type) type.value = 'mobility';
  });

  body.querySelector('#new-ex-name').focus();
}
