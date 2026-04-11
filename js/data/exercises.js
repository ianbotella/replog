/**
 * exercises.js — Biblioteca predefinida de ejercicios
 * Organizados por grupo muscular.
 *
 * Tipos de ejercicio (campo `type`):
 *   'strength'  — peso (kg) + reps             [default]
 *   'cardio'    — tiempo (min) + velocidad (km/h) + inclinación (%)
 *   'mobility'  — reps (metric:'reps') o tiempo en seg (metric:'time')
 *   'stretch'   — duración en segundos por lado
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

/** Grupo especial para calentamiento y estiramientos (disponible en todas las sesiones). */
export const GENERAL_GROUP = {
  id: 'general',
  name: 'Calentamiento / Estiramiento',
  shortName: 'General',
  emoji: '🏃',
  badgeClass: 'badge-general',
  iconClass: 'icon-general',
};

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

  // ════════════════════════════════════════════════════════
  // CALENTAMIENTO — disponibles en todas las sesiones
  // ════════════════════════════════════════════════════════

  // ─── Cardio (tiempo + velocidad + inclinación) ────────
  { id: 'treadmill-walk',     name: 'Caminata en Cinta',       muscleGroup: 'general', category: 'Calentamiento', type: 'cardio' },
  { id: 'treadmill-jog',      name: 'Trote Suave en Cinta',    muscleGroup: 'general', category: 'Calentamiento', type: 'cardio' },
  { id: 'stationary-bike',    name: 'Bicicleta Estática',      muscleGroup: 'general', category: 'Calentamiento', type: 'cardio' },
  { id: 'elliptical',         name: 'Elíptica',                muscleGroup: 'general', category: 'Calentamiento', type: 'cardio' },
  { id: 'stair-climber',      name: 'Escaladora',              muscleGroup: 'general', category: 'Calentamiento', type: 'cardio' },

  // ─── Movilidad — por repeticiones ────────────────────
  { id: 'neck-circles',       name: 'Círculos de Cuello',      muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'shoulder-rotations', name: 'Rotaciones de Hombro',    muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'hip-circles',        name: 'Rotaciones de Cadera',    muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'arm-circles',        name: 'Círculos de Brazos',      muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'wrist-circles',      name: 'Círculos de Muñeca',      muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'ankle-circles',      name: 'Círculos de Tobillo',     muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'torso-rotations',    name: 'Rotaciones de Torso',     muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'leg-swings',         name: 'Balanceo de Piernas',     muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'jumping-jacks',      name: 'Saltos de Tijera',        muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'dynamic-lunge-w',    name: 'Estocadas Dinámicas',     muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'cat-cow',            name: 'Gato-Vaca',               muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'inchworm',           name: 'Inchworm',                muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'high-knees',         name: 'Rodillas Altas',          muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },
  { id: 'butt-kicks',         name: 'Talones al Glúteo',       muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'reps' },

  // ─── Movilidad — por tiempo (segundos) ───────────────
  { id: 'plank-warmup',       name: 'Plancha',                 muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'time' },
  { id: 'dead-bug',           name: 'Dead Bug',                muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'time' },
  { id: 'glute-bridge-w',     name: 'Puente de Glúteos',       muscleGroup: 'general', category: 'Calentamiento', type: 'mobility', metric: 'time' },

  // ════════════════════════════════════════════════════════
  // ESTIRAMIENTO — disponibles en todas las sesiones
  // ════════════════════════════════════════════════════════

  { id: 'stretch-chest',      name: 'Estiramiento de Pecho',          muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-shoulder',   name: 'Estiramiento de Hombros',        muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-tricep',     name: 'Estiramiento de Tríceps',        muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-bicep',      name: 'Estiramiento de Bíceps',         muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-lat',        name: 'Estiramiento de Dorsales',       muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-lower-back', name: 'Estiramiento de Espalda Baja',   muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-neck',       name: 'Estiramiento de Cuello',         muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-quad',       name: 'Estiramiento de Cuádriceps',     muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-hamstring',  name: 'Estiramiento de Isquiotibiales', muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-calf',       name: 'Estiramiento de Pantorrillas',   muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-hip-flexor', name: 'Flexores de Cadera',             muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-glute',      name: 'Estiramiento de Glúteos',        muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'stretch-it-band',    name: 'Estiramiento Banda IT',          muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'child-pose',         name: 'Postura del Niño',               muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'cobra-pose',         name: 'Cobra',                          muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'pigeon-pose',        name: 'Postura de la Paloma',           muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'butterfly',          name: 'Mariposa',                       muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
  { id: 'world-greatest',     name: 'World Greatest Stretch',         muscleGroup: 'general', category: 'Estiramiento', type: 'stretch' },
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

/**
 * Dado una sesión, detecta qué grupos musculares se trabajaron
 * a partir de sus ejercicios y devuelve nombre + clase de badge para la UI.
 * @param {object} session
 * @param {Array}  customExercises
 * @returns {{ name: string, badgeClass: string }}
 */
export function getSessionGroupDisplay(session, customExercises = []) {
  const groupIds = [...new Set(
    session.exercises
      .map(ex => findExerciseById(ex.exerciseId, customExercises)?.muscleGroup)
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

/**
 * Rutinas predefinidas sugeridas.
 * exercises[] son IDs de ejercicios de PREDEFINED_EXERCISES que se pre-cargan.
 */
export const ROUTINE_TEMPLATES = [
  {
    id:        'chest-triceps',
    name:      'Pecho + Tríceps',
    emoji:     '💪',
    iconClass: 'icon-chest',
    exercises: ['bench-press', 'incline-bench', 'cable-fly', 'pec-deck', 'tricep-pushdown', 'skull-crusher'],
  },
  {
    id:        'back-biceps',
    name:      'Espalda + Bíceps',
    emoji:     '🦾',
    iconClass: 'icon-back',
    exercises: ['lat-pulldown', 'seated-row', 'barbell-row', 'dumbbell-row', 'barbell-curl', 'hammer-curl'],
  },
  {
    id:        'shoulders-legs',
    name:      'Hombros + Piernas',
    emoji:     '🦵',
    iconClass: 'icon-shoulders',
    exercises: ['ohp', 'lateral-raise', 'rear-delt-fly', 'squat', 'leg-press', 'leg-curl', 'calf-raise'],
  },
  {
    id:        'upper-body',
    name:      'Tren Superior',
    emoji:     '🏋️',
    iconClass: 'icon-general',
    exercises: ['bench-press', 'pull-up', 'ohp', 'barbell-curl', 'tricep-pushdown'],
  },
  {
    id:        'lower-body',
    name:      'Tren Inferior',
    emoji:     '🦵',
    iconClass: 'icon-shoulders',
    exercises: ['squat', 'leg-press', 'romanian-deadlift', 'leg-curl', 'leg-extension', 'calf-raise'],
  },
];
