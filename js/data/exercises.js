/**
 * exercises.js — Definiciones de grupos musculares y helpers.
 *
 * Los ejercicios predefinidos se obtienen de free-exercise-db (freeExerciseDb.js).
 *
 * Tipos de ejercicio (campo `type`):
 *   'strength'  — peso (kg) + reps             [default]
 *   'cardio'    — tiempo (min) + velocidad (km/h) + inclinación (%)
 *   'mobility'  — reps (metric:'reps') o tiempo en seg (metric:'time')
 *   'stretch'   — duración en segundos por lado
 */

export const MUSCLE_GROUPS = [
  {
    id:        'chest-triceps',
    name:      'Pecho + Tríceps',
    shortName: 'Pecho',
    emoji:     '💪',
    color:     'var(--color-chest)',
    badgeClass: 'badge-chest',
    iconClass:  'icon-chest',
  },
  {
    id:        'back-biceps',
    name:      'Espalda + Bíceps',
    shortName: 'Espalda',
    emoji:     '🦾',
    color:     'var(--color-back)',
    badgeClass: 'badge-back',
    iconClass:  'icon-back',
  },
  {
    id:        'shoulders-legs',
    name:      'Hombros + Piernas',
    shortName: 'Hombros',
    emoji:     '🦵',
    color:     'var(--color-shoulders)',
    badgeClass: 'badge-shoulders',
    iconClass:  'icon-shoulders',
  },
];

/** Grupo especial para calentamiento y estiramientos. */
export const GENERAL_GROUP = {
  id:        'general',
  name:      'General',
  shortName: 'General',
  emoji:     '🏃',
  badgeClass: 'badge-general',
  iconClass:  'icon-general',
};

/** Array vacío — los ejercicios vienen de fetchExternalExercises() + custom. */
export const PREDEFINED_EXERCISES = [];

/**
 * Busca un ejercicio por id en predefinidos y custom.
 * @param {string} id
 * @param {Array}  customExercises
 */
export function findExerciseById(id, customExercises = []) {
  return [...PREDEFINED_EXERCISES, ...customExercises].find(e => e.id === id) ?? null;
}

/**
 * Dado una sesión, detecta qué grupos musculares se trabajaron
 * y devuelve nombre + clase de badge para la UI.
 * Usa ex.muscleGroup almacenado como fallback para ejercicios externos.
 * @param {object} session
 * @param {Array}  customExercises
 * @returns {{ name: string, badgeClass: string }}
 */
export function getSessionGroupDisplay(session, customExercises = []) {
  const groupIds = [...new Set(
    session.exercises
      .map(ex => findExerciseById(ex.exerciseId, customExercises)?.muscleGroup ?? ex.muscleGroup)
      .filter(g => g && g !== 'general'),
  )];

  if (groupIds.length === 0) return { name: 'Sesión libre', badgeClass: 'badge-neutral' };

  if (groupIds.length === 1) {
    const g = MUSCLE_GROUPS.find(m => m.id === groupIds[0]);
    return g ? { name: g.name, badgeClass: g.badgeClass } : { name: groupIds[0], badgeClass: 'badge-neutral' };
  }

  const shortNames = groupIds.map(id => MUSCLE_GROUPS.find(m => m.id === id)?.shortName).filter(Boolean);
  return {
    name:       shortNames.length > 2 ? 'Cuerpo completo' : shortNames.join(' + '),
    badgeClass: 'badge-neutral',
  };
}
