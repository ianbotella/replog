/**
 * exercises.js — Biblioteca predefinida de ejercicios
 * Organizados por grupo muscular.
 */

export const MUSCLE_GROUPS = [
  {
    id: 'chest-triceps',
    name: 'Pecho + Tríceps',
    shortName: 'Pecho',
    emoji: '💪',
    color: 'var(--color-chest)',
    badgeClass: 'badge-chest',
    iconClass: 'icon-chest',
  },
  {
    id: 'back-biceps',
    name: 'Espalda + Bíceps',
    shortName: 'Espalda',
    emoji: '🦾',
    color: 'var(--color-back)',
    badgeClass: 'badge-back',
    iconClass: 'icon-back',
  },
  {
    id: 'shoulders-legs',
    name: 'Hombros + Piernas',
    shortName: 'Hombros',
    emoji: '🦵',
    color: 'var(--color-shoulders)',
    badgeClass: 'badge-shoulders',
    iconClass: 'icon-shoulders',
  },
];

/** @type {Array<{id: string, name: string, muscleGroup: string, category: string, custom?: boolean}>} */
export const PREDEFINED_EXERCISES = [
  // ─── Pecho ──────────────────────────────────────────────────
  { id: 'bench-press',         name: 'Press de Banca',           muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'incline-bench',       name: 'Press Inclinado',          muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'decline-bench',       name: 'Press Declinado',          muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'dumbbell-fly',        name: 'Aperturas con Mancuernas', muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'cable-fly',           name: 'Aperturas en Cable',       muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'pec-deck',            name: 'Pec Deck / Mariposa',      muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'chest-dip',           name: 'Fondos para Pecho',        muscleGroup: 'chest-triceps', category: 'Pecho' },
  { id: 'pushup',              name: 'Flexiones',                muscleGroup: 'chest-triceps', category: 'Pecho' },

  // ─── Tríceps ─────────────────────────────────────────────────
  { id: 'tricep-pushdown',     name: 'Extensión en Polea (Cuerda)', muscleGroup: 'chest-triceps', category: 'Tríceps' },
  { id: 'overhead-tricep',     name: 'Extensión Sobre Cabeza',   muscleGroup: 'chest-triceps', category: 'Tríceps' },
  { id: 'skull-crusher',       name: 'Skull Crusher',            muscleGroup: 'chest-triceps', category: 'Tríceps' },
  { id: 'tricep-dip',          name: 'Fondos para Tríceps',      muscleGroup: 'chest-triceps', category: 'Tríceps' },
  { id: 'close-grip-bench',    name: 'Press Agarre Cerrado',     muscleGroup: 'chest-triceps', category: 'Tríceps' },
  { id: 'kickback',            name: 'Kickback con Mancuerna',   muscleGroup: 'chest-triceps', category: 'Tríceps' },

  // ─── Espalda ─────────────────────────────────────────────────
  { id: 'pull-up',             name: 'Dominadas',                muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'lat-pulldown',        name: 'Jalón al Pecho',           muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'seated-row',          name: 'Remo en Polea Baja',       muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'barbell-row',         name: 'Remo con Barra',           muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'dumbbell-row',        name: 'Remo con Mancuerna',       muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'deadlift',            name: 'Peso Muerto',              muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 't-bar-row',           name: 'Remo en T',                muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'face-pull',           name: 'Face Pull',                muscleGroup: 'back-biceps', category: 'Espalda' },
  { id: 'straight-arm-pulldown', name: 'Pulldown Brazo Extendido', muscleGroup: 'back-biceps', category: 'Espalda' },

  // ─── Bíceps ──────────────────────────────────────────────────
  { id: 'barbell-curl',        name: 'Curl con Barra',           muscleGroup: 'back-biceps', category: 'Bíceps' },
  { id: 'dumbbell-curl',       name: 'Curl con Mancuerna',       muscleGroup: 'back-biceps', category: 'Bíceps' },
  { id: 'hammer-curl',         name: 'Curl Martillo',            muscleGroup: 'back-biceps', category: 'Bíceps' },
  { id: 'preacher-curl',       name: 'Curl en Scott',            muscleGroup: 'back-biceps', category: 'Bíceps' },
  { id: 'cable-curl',          name: 'Curl en Polea',            muscleGroup: 'back-biceps', category: 'Bíceps' },
  { id: 'incline-curl',        name: 'Curl Inclinado',           muscleGroup: 'back-biceps', category: 'Bíceps' },
  { id: 'concentration-curl',  name: 'Curl Concentrado',         muscleGroup: 'back-biceps', category: 'Bíceps' },

  // ─── Hombros ─────────────────────────────────────────────────
  { id: 'ohp',                 name: 'Press Militar (Barra)',    muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'dumbbell-press',      name: 'Press con Mancuernas',     muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'lateral-raise',       name: 'Elevaciones Laterales',    muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'front-raise',         name: 'Elevaciones Frontales',    muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'rear-delt-fly',       name: 'Vuelos Deltoides Posterior', muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'upright-row',         name: 'Remo al Mentón',           muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'arnold-press',        name: 'Press Arnold',             muscleGroup: 'shoulders-legs', category: 'Hombros' },
  { id: 'shrug',               name: 'Encogimientos (Trapecio)', muscleGroup: 'shoulders-legs', category: 'Hombros' },

  // ─── Piernas ─────────────────────────────────────────────────
  { id: 'squat',               name: 'Sentadilla',               muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'leg-press',           name: 'Prensa de Piernas',        muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'romanian-deadlift',   name: 'Peso Muerto Rumano',       muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'leg-curl',            name: 'Curl Femoral',             muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'leg-extension',       name: 'Extensión de Cuádriceps',  muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'lunge',               name: 'Zancadas',                 muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'calf-raise',          name: 'Elevación de Talones',     muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'hip-thrust',          name: 'Hip Thrust',               muscleGroup: 'shoulders-legs', category: 'Piernas' },
  { id: 'hack-squat',          name: 'Hack Squat',               muscleGroup: 'shoulders-legs', category: 'Piernas' },
];

/**
 * Devuelve los datos de un grupo muscular por su id.
 * @param {string} groupId
 */
export function getMuscleGroup(groupId) {
  return MUSCLE_GROUPS.find(g => g.id === groupId) ?? null;
}

/**
 * Filtra ejercicios (predefinidos + custom) por grupo muscular.
 * @param {string} groupId
 * @param {Array} customExercises
 */
export function getExercisesForGroup(groupId, customExercises = []) {
  const all = [...PREDEFINED_EXERCISES, ...customExercises];
  return all.filter(e => e.muscleGroup === groupId);
}

/**
 * Busca un ejercicio por id en predefinidos y custom.
 * @param {string} id
 * @param {Array} customExercises
 */
export function findExerciseById(id, customExercises = []) {
  return [...PREDEFINED_EXERCISES, ...customExercises].find(e => e.id === id) ?? null;
}
