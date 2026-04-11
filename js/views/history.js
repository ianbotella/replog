/**
 * history.js — Vista "Historial"
 * Muestra todas las sesiones ordenadas por fecha (más reciente primero).
 */

import {
  getSessionsSorted, deleteSession, formatDateDisplay, getCustomExercises,
} from '../store.js';
import { getSessionGroupDisplay } from '../data/exercises.js';
import { showToast } from '../components/toast.js';

let _container = null;

export const HistoryView = {
  render(container) {
    _container = container;
    _render();
  },
  destroy() {},
};

function _render() {
  const sessions = getSessionsSorted();

  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Historial</h1>
      <p class="page-subtitle">${sessions.length} sesión${sessions.length !== 1 ? 'es' : ''} registrada${sessions.length !== 1 ? 's' : ''}</p>

      ${sessions.length === 0 ? _emptyStateHTML() : _sessionListHTML(sessions)}
    </div>
  `;

  if (sessions.length > 0) _bindEvents();
  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
}

function _sessionListHTML(sessions) {
  // Agrupar por mes/año
  const grouped = {};
  sessions.forEach(s => {
    const [y, m] = s.date.split('-');
    const key = `${y}-${m}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return Object.entries(grouped).map(([key, sess]) => {
    const [y, m] = key.split('-');
    const monthLabel = new Date(parseInt(y), parseInt(m) - 1, 1)
      .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    return `
      <div class="exercise-group-header" style="margin-bottom:var(--space-3)">${_capitalize(monthLabel)}</div>
      <div class="history-list" style="margin-bottom:var(--space-5)">
        ${sess.map(s => _sessionCardHTML(s)).join('')}
      </div>
    `;
  }).join('');
}

function _sessionCardHTML(session) {
  const groupInfo = getSessionGroupDisplay(session, getCustomExercises());
  const dateLabel = _capitalize(formatDateDisplay(session.date));
  const exCount   = session.exercises.length;
  const setCount  = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVol  = _calcVolume(session);
  const dur       = session.durationMin ? `${session.durationMin} min` : '';

  const exerciseRows = session.exercises.map(ex => {
    const bestSet  = _bestSet(ex.sets);
    const setsText = `${ex.sets.length} serie${ex.sets.length !== 1 ? 's' : ''}${bestSet ? ` · ${bestSet.weight}kg × ${bestSet.reps}` : ''}`;
    return `
      <div class="history-exercise-item">
        <span>${ex.name}</span>
        <span class="history-sets-summary">${setsText}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="history-card" data-session-id="${session.id}">
      <div class="history-card-header">
        <div>
          <span class="badge ${groupInfo.badgeClass}">${groupInfo.name}</span>
          <div class="history-date" style="margin-top:var(--space-1)">${dateLabel}</div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <button class="icon-btn delete-session-btn" data-id="${session.id}" aria-label="Eliminar sesión">
            <i data-lucide="trash-2" style="width:15px;height:15px"></i>
          </button>
          <i data-lucide="chevron-down" class="expand-icon"></i>
        </div>
      </div>

      <div class="history-card-meta">
        <i data-lucide="dumbbell"></i>
        <span>${exCount} ejercicio${exCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <i data-lucide="layers"></i>
        <span>${setCount} series</span>
        ${totalVol > 0 ? `<span>·</span><span>${totalVol.toLocaleString('es-AR')} kg vol.</span>` : ''}
        ${dur ? `<span>·</span><i data-lucide="timer"></i><span>${dur}</span>` : ''}
      </div>

      <div class="history-exercises">
        ${exerciseRows}
        ${session.notes ? `<p style="margin-top:var(--space-3);font-size:var(--text-sm);color:var(--text-secondary);font-style:italic">"${session.notes}"</p>` : ''}
      </div>
    </div>
  `;
}

function _emptyStateHTML() {
  return `
    <div class="empty-state">
      <i data-lucide="calendar-x" style="width:48px;height:48px;color:var(--text-tertiary)"></i>
      <h3>Sin sesiones todavía</h3>
      <p>Registrá tu primer entrenamiento en la pestaña Hoy.</p>
    </div>
  `;
}

function _bindEvents() {
  // Expandir/contraer tarjeta
  _container.addEventListener('click', e => {
    const card = e.target.closest('.history-card');
    if (!card) return;

    // Si click en botón eliminar, no expandir
    if (e.target.closest('.delete-session-btn')) {
      e.stopPropagation();
      const id = e.target.closest('.delete-session-btn').dataset.id;
      _confirmDelete(id);
      return;
    }

    card.classList.toggle('expanded');
  });
}

function _confirmDelete(id) {
  if (!confirm('¿Eliminar esta sesión? Esta acción no se puede deshacer.')) return;
  deleteSession(id);
  showToast('Sesión eliminada.', 'info');
  _render();
}

// ── Utils ──────────────────────────────────────────────────

function _calcVolume(session) {
  return session.exercises.reduce((total, ex) =>
    total + ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);
}

function _bestSet(sets) {
  if (!sets || sets.length === 0) return null;
  const valid = sets.filter(s => s.weight > 0 && s.reps > 0);
  if (valid.length === 0) return null;
  return valid.reduce((best, s) => (s.weight > best.weight ? s : best), valid[0]);
}

function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
