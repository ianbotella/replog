/**
 * exercises.js — Vista "Ejercicios"
 * Biblioteca de ejercicios: predefinidos + custom + externos (free-exercise-db).
 * Filtra por categoría específica (Pecho, Tríceps, Espalda, etc.).
 */

import {
  getCustomExercises, saveCustomExercise, deleteCustomExercise,
} from '../store.js';
import { MUSCLE_GROUPS, GENERAL_GROUP } from '../data/exercises.js';
import { fetchExternalExercises, IMG_BASE_URL } from '../data/freeExerciseDb.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _container      = null;
let _filterCategory = 'all';
let _searchQuery    = '';
let _extExercises   = [];
let _extLoading     = false;

// Orden preferido de chips de filtro
const CATEGORY_ORDER = [
  'Pecho', 'Tríceps', 'Espalda', 'Bíceps', 'Hombros', 'Piernas',
  'Abdominales', 'Antebrazos', 'Cuello', 'Calentamiento', 'Estiramiento',
];

export const ExercisesView = {
  render(container) {
    _container      = container;
    _filterCategory = 'all';
    _searchQuery    = '';
    _render();
    _loadExternal();
  },
  destroy() {},
};

// ── Render ─────────────────────────────────────────────────

function _render() {
  const custom = getCustomExercises();
  const all    = [...custom, ..._extExercises];
  const total  = all.length;

  _container.innerHTML = `
    <div class="view">
      <div class="section-header">
        <div>
          <h1 class="page-title">Ejercicios</h1>
          <p class="page-subtitle" id="ex-subtitle">${_subtitleText(total)}</p>
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

      <!-- Filtro por categoría -->
      <div class="chip-group" id="cat-filter"
           style="margin-bottom:var(--space-5);flex-wrap:nowrap;overflow-x:auto;padding-bottom:var(--space-1)">
        <button class="chip ${_filterCategory === 'all' ? 'active' : ''}" data-cat="all" style="flex-shrink:0">Todos</button>
        ${_categoryChipsHTML(all)}
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

function _subtitleText(total) {
  return _extLoading
    ? `${total} en la biblioteca · <span style="color:var(--text-tertiary)">cargando más...</span>`
    : `${total} en la biblioteca`;
}

function _categoryChipsHTML(all) {
  const available = new Set(all.map(ex => ex.category));
  const ordered   = [
    ...CATEGORY_ORDER.filter(c => available.has(c)),
    ...[...available].filter(c => !CATEGORY_ORDER.includes(c)).sort(),
  ];
  return ordered.map(cat => `
    <button class="chip ${_filterCategory === cat ? 'active' : ''}" data-cat="${cat}" style="flex-shrink:0">${cat}</button>
  `).join('');
}

async function _loadExternal() {
  if (_extExercises.length > 0) return; // ya cargados
  _extLoading = true;
  _updateSubtitle();
  const exercises = await fetchExternalExercises();
  _extLoading  = false;
  if (!_container) return; // vista destruida mientras cargaba
  _extExercises = exercises;
  _render(); // re-render completo con los datos externos
}

function _updateSubtitle() {
  const sub = _container?.querySelector('#ex-subtitle');
  if (!sub) return;
  const custom = getCustomExercises();
  const total  = custom.length + _extExercises.length;
  sub.innerHTML = _subtitleText(total);
}

function _exerciseListHTML(all) {
  const filtered = all.filter(ex => {
    const matchCat    = _filterCategory === 'all' || ex.category === _filterCategory;
    const matchSearch = ex.name.toLowerCase().includes(_searchQuery.toLowerCase());
    return matchCat && matchSearch;
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

  // Agrupar por categoría en el orden definido
  const byCat = {};
  filtered.forEach(ex => {
    if (!byCat[ex.category]) byCat[ex.category] = [];
    byCat[ex.category].push(ex);
  });

  const orderedCats = [
    ...CATEGORY_ORDER.filter(c => byCat[c]),
    ...Object.keys(byCat).filter(c => !CATEGORY_ORDER.includes(c)).sort(),
  ];

  return orderedCats.map(cat => `
    <div class="exercise-group-header">${cat}</div>
    <div class="exercise-list" style="margin-bottom:var(--space-4)">
      ${byCat[cat].map(ex => _exerciseItemHTML(ex)).join('')}
    </div>
  `).join('');
}

function _exerciseItemHTML(ex) {
  const group     = ex.muscleGroup === 'general'
    ? GENERAL_GROUP
    : MUSCLE_GROUPS.find(g => g.id === ex.muscleGroup);
  const hasImages = ex.external && ex.images?.length > 0;

  let metaText = '';
  if (ex.custom) {
    metaText = `<span style="color:var(--accent-primary)">Personalizado</span>`;
  } else if (ex.external) {
    const parts = [ex.equipment, ex.level].filter(Boolean);
    metaText = parts.join(' · ');
  } else {
    metaText = _typeLabel(ex.type, ex.metric);
  }

  return `
    <div class="exercise-item${hasImages ? ' has-images' : ''}" data-id="${ex.id}"
         ${hasImages ? 'style="cursor:pointer"' : ''}>
      <div class="exercise-item-info">
        <div class="exercise-item-name">${ex.name}</div>
        ${metaText ? `<div class="exercise-item-meta">${metaText}</div>` : ''}
      </div>
      <div class="exercise-item-actions">
        ${hasImages ? `<i data-lucide="image" style="width:14px;height:14px;color:var(--text-tertiary);flex-shrink:0"></i>` : ''}
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

function _typeLabel(type, metric) {
  if (type === 'cardio')   return 'Cardio';
  if (type === 'stretch')  return 'Estiramiento';
  if (type === 'mobility') return metric === 'time' ? 'Movilidad (tiempo)' : 'Movilidad (reps)';
  return '';
}

// ── Events ─────────────────────────────────────────────────

function _bindEvents() {
  _container.querySelector('#ex-search').addEventListener('input', e => {
    _searchQuery = e.target.value;
    _reRenderList();
  });

  _container.querySelector('#cat-filter').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    _filterCategory = chip.dataset.cat;
    _container.querySelectorAll('#cat-filter .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.cat === _filterCategory));
    _reRenderList();
  });

  _container.addEventListener('click', e => {
    // Eliminar ejercicio custom
    const btn = e.target.closest('.delete-ex-btn');
    if (btn) {
      if (!confirm('¿Eliminar este ejercicio personalizado?')) return;
      deleteCustomExercise(btn.dataset.id);
      showToast('Ejercicio eliminado.', 'info');
      _reRenderList();
      return;
    }

    // Ver imágenes de ejercicio externo
    const item = e.target.closest('.exercise-item.has-images');
    if (item) {
      const custom = getCustomExercises();
      const all    = [...custom, ..._extExercises];
      const ex     = all.find(ex => ex.id === item.dataset.id);
      if (ex) _openDetailModal(ex);
    }
  });

  _container.querySelector('#add-custom-btn').addEventListener('click', _openAddModal);
}

function _reRenderList() {
  const custom = getCustomExercises();
  const all    = [...custom, ..._extExercises];
  const list   = _container.querySelector('#exercises-list');
  if (!list) return;
  list.innerHTML = _exerciseListHTML(all);
  if (window.lucide) window.lucide.createIcons({ nodes: [list] });
}

// ── Modal detalle con imágenes ─────────────────────────────

function _openDetailModal(ex) {
  const group = ex.muscleGroup === 'general'
    ? GENERAL_GROUP
    : MUSCLE_GROUPS.find(g => g.id === ex.muscleGroup);

  const imagesHTML = ex.images?.length
    ? `<div style="display:grid;grid-template-columns:${ex.images.length > 1 ? '1fr 1fr' : '1fr'};gap:var(--space-3);margin-bottom:var(--space-4)">
        ${ex.images.map(img => `
          <img src="${IMG_BASE_URL}${img}"
               alt="${ex.name}"
               style="width:100%;border-radius:var(--radius-md);background:var(--bg-elevated);display:block"
               onerror="this.style.display='none'">
        `).join('')}
      </div>`
    : '';

  const infoRows = [
    ex.equipment ? `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2) 0;border-bottom:1px solid var(--border-subtle);font-size:var(--text-sm)">
        <span style="color:var(--text-secondary)">Equipamiento</span>
        <span>${ex.equipment}</span>
      </div>` : '',
    ex.level ? `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2) 0;font-size:var(--text-sm)">
        <span style="color:var(--text-secondary)">Nivel</span>
        <span>${ex.level.charAt(0).toUpperCase() + ex.level.slice(1)}</span>
      </div>` : '',
  ].filter(Boolean).join('');

  const body = openModal({
    title: ex.name,
    body: `
      <div style="margin-bottom:var(--space-4)">
        <span class="badge ${group?.badgeClass ?? 'badge-neutral'}">${ex.category}</span>
      </div>
      ${imagesHTML}
      ${infoRows ? `<div>${infoRows}</div>` : ''}
    `,
    footer: `<button class="btn btn-primary" id="detail-close-btn" style="flex:1">Cerrar</button>`,
  });

  body.closest('.modal-container').querySelector('#detail-close-btn')
    .addEventListener('click', closeModal);
}

// ── Modal agregar ejercicio custom ─────────────────────────

function _openAddModal() {
  const typeOptions = [
    { value: 'strength',      label: 'Fuerza (peso + reps)' },
    { value: 'cardio',        label: 'Cardio (tiempo + vel. + incl.)' },
    { value: 'mobility',      label: 'Movilidad (reps)' },
    { value: 'mobility-time', label: 'Movilidad (tiempo en seg)' },
    { value: 'stretch',       label: 'Estiramiento (duración en seg)' },
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

    const type   = typeRaw === 'mobility-time' ? 'mobility' : typeRaw;
    const metric = typeRaw === 'mobility-time' ? 'time' : (typeRaw === 'mobility' ? 'reps' : undefined);

    const saved = saveCustomExercise({ name, muscleGroup: group, category, type, metric });
    closeModal();
    showToast(`"${saved.name}" agregado a la biblioteca.`, 'success');
    _reRenderList();
  });

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
    if (gId === 'general' && type) type.value = 'mobility';
  });

  body.querySelector('#new-ex-name').focus();
}
