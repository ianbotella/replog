/**
 * share.js — Compartir sesión como texto plano
 *
 * Usa Web Share API (navigator.share) en mobile.
 * Fallback: copia al portapapeles (navigator.clipboard o execCommand).
 */

import { formatDateDisplay, getCustomExercises } from '../store.js';
import { getSessionGroupDisplay } from '../data/exercises.js';
import { showToast } from '../components/toast.js';

/**
 * Comparte una sesión vía Web Share API o la copia al portapapeles.
 * @param {object} session
 */
export async function shareSession(session) {
  const text = _buildShareText(session);

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Replog — Entrenamiento', text });
      // No toast needed: the native share sheet confirms the action
    } catch (err) {
      // AbortError = user cancelled the share sheet → ignore
      if (err.name !== 'AbortError') await _copyFallback(text);
    }
  } else {
    await _copyFallback(text);
  }
}

// ── Internals ──────────────────────────────────────────────

async function _copyFallback(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Sesión copiada al portapapeles.', 'success');
      return;
    } catch {
      // fall through to execCommand
    }
  }

  // Último recurso: textarea + execCommand (Safari < 13.1, algunos WebViews)
  const ta = document.createElement('textarea');
  ta.value = text;
  Object.assign(ta.style, { position: 'fixed', opacity: '0', top: '0', left: '0' });
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Sesión copiada al portapapeles.', 'success');
  } catch {
    showToast('No se pudo copiar. Intentá manualmente.', 'danger');
  }
  document.body.removeChild(ta);
}

function _buildShareText(session) {
  const custom    = getCustomExercises();
  const groupInfo = getSessionGroupDisplay(session, custom);
  const dateStr   = _capitalize(formatDateDisplay(session.date));
  const exCount   = session.exercises.length;
  const setCount  = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVol  = session.exercises.reduce((t, ex) =>
    t + ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);

  const dur    = session.durationMin ? `${session.durationMin} min` : '—';
  const volStr = totalVol >= 1000
    ? `${(totalVol / 1000).toFixed(1)}k kg`
    : `${totalVol.toLocaleString('es-AR')} kg`;

  const exercisesText = session.exercises.map(ex => {
    const setLines = ex.sets.map((s, i) => {
      const label = `  Serie ${i + 1}:`;
      if (s.weight > 0 && s.reps > 0) return `${label} ${s.weight} kg × ${s.reps}`;
      if (s.reps > 0)                  return `${label} ${s.reps} reps`;
      if (s.duration > 0)              return `${label} ${s.duration} seg`;
      if (s.time > 0)                  return `${label} ${s.time} min`;
      return null;
    }).filter(Boolean).join('\n');

    return ex.name + (setLines ? '\n' + setLines : '');
  }).join('\n\n');

  let text = `🏋️ Replog — ${dateStr}`;
  text += `\n\nGrupo: ${groupInfo.name}`;
  text += `\nDuración: ${dur}`;
  text += `\nEjercicios: ${exCount} | Series: ${setCount} | Volumen: ${volStr}`;
  if (exercisesText) text += `\n\n${exercisesText}`;
  if (session.notes) text += `\n\n"${session.notes}"`;
  text += '\n\n💪 Generado con Replog';

  return text;
}

function _capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}
