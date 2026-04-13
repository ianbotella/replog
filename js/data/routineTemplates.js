/**
 * routineTemplates.js — Rutinas predefinidas de entrenamiento.
 *
 * Estructura obligatoria de todas las rutinas:
 *   1. Caminata en Cinta — 30 min (Cardio PRE, required)
 *   2. Calentamiento específico del grupo muscular (2-3 ejercicios, mobility)
 *   3. Ejercicios principales (strength)
 *   4. Estiramiento específico del grupo muscular (2-3 ejercicios, stretch)
 *   5. Caminata en Cinta — 30 min (Cardio POST, required)
 *
 * Campos de cada ejercicio:
 *   exerciseId  — ID de la API (prefijo ext_); usado para buscar en freeExerciseDb.
 *   displayName — Nombre en español; fallback si el ID no está en la API.
 *   muscleGroup — Grupo muscular interno.
 *   type        — Fallback si el ejercicio no está en la API:
 *                   'cardio' | 'mobility' | 'stretch' | 'strength'
 *   metric      — Fallback para mobility: 'time' | 'reps'
 *   sets        — Número de series/vueltas a pre-cargar.
 *   repsMin     — Reps mínimas (strength / mobility-reps).
 *   repsMax     — Reps máximas (strength).
 *   durationMin — Duración en minutos pre-cargada (cardio).
 *   speedKmh    — Velocidad pre-cargada (cardio).
 *   inclinePct  — Inclinación pre-cargada (cardio).
 *   durationSec — Duración en segundos pre-cargada (stretch / mobility-time).
 *   tip         — Indicación clave visible durante la sesión.
 *   required    — true: muestra advertencia antes de eliminar el ejercicio.
 *
 * Sustituciones notables (sin equivalente exacto en la API):
 *   "Fondos en paralelas"          → Dips - Chest Version
 *   "Pullover en polea"            → Rope Straight-Arm Pulldown
 *   "Kickbacks en polea"           → Standing Low-Pulley One-Arm Triceps Extension
 *   "Sentadilla búlgara mancuernas"→ Split Squat with Dumbbells
 *   "Extensión tríceps sobre cabeza"→ Cable Rope Overhead Triceps Extension
 *   "Elevaciones laterales en polea"→ Cable Seated Lateral Raise
 *   "Aducción en máquina"          → Cable Hip Adduction
 */

// ── Bloque reutilizable: Caminata en Cinta ─────────────────

const TREADMILL_PRE = {
  exerciseId:  'ext_Treadmill',
  displayName: 'Caminata en Cinta',
  muscleGroup: 'general',
  type:        'cardio',
  required:    true,
  sets: 1, durationMin: 30, speedKmh: 5.0, inclinePct: 1.0,
  tip: 'Calentamiento cardiovascular — 30 min · 5 km/h · 1% inclinación',
};

const TREADMILL_POST = {
  exerciseId:  'ext_Treadmill',
  displayName: 'Caminata en Cinta',
  muscleGroup: 'general',
  type:        'cardio',
  required:    true,
  sets: 1, durationMin: 30, speedKmh: 5.0, inclinePct: 1.0,
  tip: 'Vuelta a la calma — 30 min · 5 km/h · 1% inclinación',
};

// ──────────────────────────────────────────────────────────

export const ROUTINE_TEMPLATES = [
  // ── Sesión 1 · Pecho + Tríceps ──────────────────────────────────
  {
    id:          'chest-triceps',
    name:        'Pecho + Tríceps',
    description: 'Pectoral · Tríceps · Serrato',
    muscleGroup: 'chest-triceps',
    exercises: [
      // ── CARDIO PRE ──────────────────────────────────────────────
      TREADMILL_PRE,

      // ── CALENTAMIENTO ───────────────────────────────────────────
      {
        exerciseId:  'ext_Arm_Circles',
        displayName: 'Rotaciones de Hombros',
        muscleGroup: 'chest-triceps',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 30,
        tip: 'Círculos amplios hacia adelante y atrás — activa el manguito rotador',
      },
      {
        exerciseId:  'ext_Band_Pull_Apart',
        displayName: 'Aperturas Dinámicas de Pecho',
        muscleGroup: 'chest-triceps',
        type: 'mobility', metric: 'reps',
        sets: 2, repsMin: 15,
        tip: 'Brazos a la altura del pecho, abrí y cerrá con control',
      },
      {
        exerciseId:  'ext_Overhead_Triceps_Stretch',
        displayName: 'Movilización de Tríceps',
        muscleGroup: 'chest-triceps',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 20,
        tip: 'Codo sobre la cabeza — activa la cabeza larga antes del trabajo pesado',
      },

      // ── EJERCICIOS PRINCIPALES ───────────────────────────────────
      {
        exerciseId:  'ext_Barbell_Bench_Press_-_Medium_Grip',
        displayName: 'Press de Banca Plano con Barra',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Ejercicio base — priorizá técnica',
      },
      {
        exerciseId:  'ext_Incline_Dumbbell_Press',
        displayName: 'Press Inclinado con Mancuernas',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: '45° de inclinación',
      },
      {
        exerciseId:  'ext_Decline_Barbell_Bench_Press',
        displayName: 'Press Declinado con Barra',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Activa la porción inferior del pectoral',
      },
      {
        exerciseId:  'ext_Cable_Crossover',
        displayName: 'Aperturas en Polea Cruzada',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Codos ligeramente flexionados',
      },
      {
        exerciseId:  'ext_Dips_-_Chest_Version',
        displayName: 'Fondos en Paralelas',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 8, repsMax: 10,
        tip: 'Inclinarte adelante activa más el pecho',
      },
      {
        exerciseId:  'ext_EZ-Bar_Skullcrusher',
        displayName: 'Press Francés con Barra Z',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Codos fijos, solo baja el antebrazo',
      },
      {
        exerciseId:  'ext_Triceps_Pushdown',
        displayName: 'Extensión de Tríceps en Polea Alta',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Codos pegados al cuerpo',
      },
      {
        exerciseId:  'ext_Standing_Low-Pulley_One-Arm_Triceps_Extension',
        displayName: 'Kickbacks en Polea',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Extensión completa en la cima',
      },

      // ── ESTIRAMIENTO ─────────────────────────────────────────────
      {
        exerciseId:  'ext_Chest_Stretch',
        displayName: 'Estiramiento de Pecho',
        muscleGroup: 'chest-triceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Brazo a 90° apoyado en pared — mantené 30 seg por lado',
      },
      {
        exerciseId:  'ext_Cross_Body_Shoulder_Stretch',
        displayName: 'Estiramiento Cruzado de Hombro',
        muscleGroup: 'chest-triceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Jalá el brazo cruzado hacia el pecho — 30 seg por lado',
      },
      {
        exerciseId:  'ext_Triceps_Stretch',
        displayName: 'Estiramiento de Tríceps',
        muscleGroup: 'chest-triceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Codo detrás de la cabeza, jalá con la otra mano — 30 seg por lado',
      },

      // ── CARDIO POST ──────────────────────────────────────────────
      TREADMILL_POST,
    ],
  },

  // ── Sesión 2 · Espalda + Bíceps ─────────────────────────────────
  {
    id:          'back-biceps',
    name:        'Espalda + Bíceps',
    description: 'Dorsal · Trapecio · Romboides · Bíceps',
    muscleGroup: 'back-biceps',
    exercises: [
      // ── CARDIO PRE ──────────────────────────────────────────────
      TREADMILL_PRE,

      // ── CALENTAMIENTO ───────────────────────────────────────────
      {
        exerciseId:  'ext_Cat_Cow_Stretch',
        displayName: 'Cat-Cow — Movilización de Columna',
        muscleGroup: 'back-biceps',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 30,
        tip: 'Flexión y extensión alternadas de columna — activa toda la cadena posterior',
      },
      {
        exerciseId:  'ext_Band_Pull_Apart',
        displayName: 'Aperturas con Banda',
        muscleGroup: 'back-biceps',
        type: 'mobility', metric: 'reps',
        sets: 2, repsMin: 15,
        tip: 'Activa los romboides y el manguito rotador antes del remo',
      },
      {
        exerciseId:  'ext_Arm_Circles',
        displayName: 'Rotaciones de Hombros',
        muscleGroup: 'back-biceps',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 20,
        tip: 'Círculos amplios hacia adelante y atrás — activa el manguito y el dorsal',
      },

      // ── EJERCICIOS PRINCIPALES ───────────────────────────────────
      {
        exerciseId:  'ext_Pullups',
        displayName: 'Dominadas',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 8, repsMax: 10,
        tip: 'Agarre prono, ancho de hombros',
      },
      {
        exerciseId:  'ext_Bent_Over_Barbell_Row',
        displayName: 'Remo con Barra',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Espalda recta, tirá hacia el ombligo',
      },
      {
        exerciseId:  'ext_Seated_Cable_Rows',
        displayName: 'Remo en Polea Baja Agarre Neutro',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Apretá la escápula al final',
      },
      {
        exerciseId:  'ext_Close-Grip_Front_Lat_Pulldown',
        displayName: 'Jalón al Pecho Agarre Cerrado',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Agarre supino o neutro',
      },
      {
        exerciseId:  'ext_Rope_Straight-Arm_Pulldown',
        displayName: 'Pullover en Polea',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Brazos casi rectos, amplio arco',
      },
      {
        exerciseId:  'ext_Romanian_Deadlift',
        displayName: 'Peso Muerto Rumano',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 10,
        tip: 'Bisagra de cadera, barra pegada a las piernas',
      },
      {
        exerciseId:  'ext_Barbell_Curl',
        displayName: 'Curl de Bíceps con Barra',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Sin balanceo, codos fijos',
      },
      {
        exerciseId:  'ext_Hammer_Curls',
        displayName: 'Curl Martillo con Mancuernas',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Trabaja braquiorradial y braquial',
      },

      // ── ESTIRAMIENTO ─────────────────────────────────────────────
      {
        exerciseId:  'ext_Lat_Stretch',
        displayName: 'Estiramiento de Dorsal',
        muscleGroup: 'back-biceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Agarrá una barra o marco de puerta con brazo extendido — colgá 30 seg por lado',
      },
      {
        exerciseId:  'ext_Biceps_Stretch',
        displayName: 'Estiramiento de Bíceps',
        muscleGroup: 'back-biceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Palma apoyada en pared con brazo extendido, rotá el cuerpo — 30 seg por lado',
      },
      {
        exerciseId:  'ext_Child_s_Pose',
        displayName: 'Postura del Niño',
        muscleGroup: 'back-biceps',
        type: 'stretch',
        sets: 2, durationSec: 40,
        tip: 'Rodillas al pecho, brazos extendidos al frente — relaja toda la espalda',
      },

      // ── CARDIO POST ──────────────────────────────────────────────
      TREADMILL_POST,
    ],
  },

  // ── Sesión 3 · Hombros + Piernas ────────────────────────────────
  {
    id:          'shoulders-legs',
    name:        'Hombros + Piernas',
    description: 'Deltoides · Cuádriceps · Isquios · Glúteos',
    muscleGroup: 'shoulders-legs',
    exercises: [
      // ── CARDIO PRE ──────────────────────────────────────────────
      TREADMILL_PRE,

      // ── CALENTAMIENTO ───────────────────────────────────────────
      {
        exerciseId:  'ext_Hip_Circles',
        displayName: 'Círculos de Cadera',
        muscleGroup: 'shoulders-legs',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 30,
        tip: 'Cadera hacia adelante, lateral, atrás y otro lado — 15 seg por sentido',
      },
      {
        exerciseId:  'ext_Bodyweight_Squat',
        displayName: 'Sentadillas de Calentamiento',
        muscleGroup: 'shoulders-legs',
        type: 'mobility', metric: 'reps',
        sets: 2, repsMin: 15,
        tip: 'Sin peso, rango completo de movimiento — preparación para la sentadilla cargada',
      },
      {
        exerciseId:  'ext_Leg_Swings',
        displayName: 'Balanceos de Pierna',
        muscleGroup: 'shoulders-legs',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 20,
        tip: 'Adelante/atrás y lateral — activa flexores de cadera y glúteos',
      },

      // ── EJERCICIOS PRINCIPALES ───────────────────────────────────
      {
        exerciseId:  'ext_Barbell_Squat',
        displayName: 'Sentadilla con Barra',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Rodillas alineadas con los pies',
      },
      {
        exerciseId:  'ext_Leg_Press',
        displayName: 'Prensa de Piernas',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Pies altos = más glúteo, bajos = más cuádriceps',
      },
      {
        exerciseId:  'ext_Split_Squat_with_Dumbbells',
        displayName: 'Sentadilla Búlgara con Mancuernas',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 10, repsMax: 10,
        tip: 'Pie trasero elevado, torso recto',
      },
      {
        exerciseId:  'ext_Seated_Leg_Curl',
        displayName: 'Curl Femoral en Máquina',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Movimiento controlado en la bajada',
      },
      {
        exerciseId:  'ext_Seated_Dumbbell_Press',
        displayName: 'Press Militar con Mancuernas Sentado',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'No bloquees los codos arriba',
      },
      {
        exerciseId:  'ext_Side_Lateral_Raise',
        displayName: 'Elevaciones Laterales con Mancuernas',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Ligeramente inclinado hacia adelante',
      },
      {
        exerciseId:  'ext_Face_Pull',
        displayName: 'Face Pulls en Polea',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 15, repsMax: 15,
        tip: 'Deltoides posterior — muy importante',
      },
      {
        exerciseId:  'ext_Standing_Calf_Raises',
        displayName: 'Pantorrillas de Pie en Máquina',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 15, repsMax: 20,
        tip: 'Pausa 1 seg abajo para el estiramiento',
      },

      // ── ESTIRAMIENTO ─────────────────────────────────────────────
      {
        exerciseId:  'ext_Standing_Quad_Stretch',
        displayName: 'Estiramiento de Cuádriceps',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Parado, jalá el tobillo hacia el glúteo — 30 seg por pierna',
      },
      {
        exerciseId:  'ext_Lying_Hamstring_Stretch',
        displayName: 'Estiramiento de Isquiotibiales',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Boca arriba, jalá la pierna extendida hacia vos — 30 seg por lado',
      },
      {
        exerciseId:  'ext_Cross_Body_Shoulder_Stretch',
        displayName: 'Estiramiento de Deltoides',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Jalá el brazo cruzado al pecho — 30 seg por lado',
      },

      // ── CARDIO POST ──────────────────────────────────────────────
      TREADMILL_POST,
    ],
  },

  // ── Sesión 4 · Tren Superior ─────────────────────────────────────
  {
    id:          'upper-body',
    name:        'Tren Superior',
    description: 'Pecho · Espalda · Hombros · Bíceps · Tríceps',
    muscleGroup: 'chest-triceps',
    exercises: [
      // ── CARDIO PRE ──────────────────────────────────────────────
      TREADMILL_PRE,

      // ── CALENTAMIENTO ───────────────────────────────────────────
      {
        exerciseId:  'ext_Arm_Circles',
        displayName: 'Rotaciones de Hombros',
        muscleGroup: 'chest-triceps',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 30,
        tip: 'Activa hombros, pecho y dorsal antes del trabajo bilateral',
      },
      {
        exerciseId:  'ext_Band_Pull_Apart',
        displayName: 'Aperturas con Banda',
        muscleGroup: 'back-biceps',
        type: 'mobility', metric: 'reps',
        sets: 2, repsMin: 15,
        tip: 'Activa romboides y manguito rotador — clave antes del press y del remo',
      },
      {
        exerciseId:  'ext_Cat_Cow_Stretch',
        displayName: 'Cat-Cow — Movilización de Columna',
        muscleGroup: 'back-biceps',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 30,
        tip: 'Movilizá toda la columna torácica antes del trabajo de tren superior',
      },

      // ── EJERCICIOS PRINCIPALES ───────────────────────────────────
      {
        exerciseId:  'ext_Barbell_Bench_Press_-_Medium_Grip',
        displayName: 'Press de Banca Plano con Barra',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Ejercicio ancla de la sesión',
      },
      {
        exerciseId:  'ext_Bent_Over_Barbell_Row',
        displayName: 'Remo con Barra',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Antagonista del press — hacelos en par',
      },
      {
        exerciseId:  'ext_Standing_Dumbbell_Press',
        displayName: 'Press Militar con Mancuernas de Pie',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Core activo durante todo el movimiento',
      },
      {
        exerciseId:  'ext_Wide-Grip_Lat_Pulldown',
        displayName: 'Jalón al Pecho Agarre Amplio',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 8, repsMax: 10,
        tip: 'Agarre amplio para mayor rango',
      },
      {
        exerciseId:  'ext_Cable_Crossover',
        displayName: 'Aperturas en Polea Cruzada',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Finalizador de pecho',
      },
      {
        exerciseId:  'ext_Barbell_Curl',
        displayName: 'Curl de Bíceps con Barra',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Sin balanceo',
      },
      {
        exerciseId:  'ext_Cable_Rope_Overhead_Triceps_Extension',
        displayName: 'Extensión de Tríceps sobre Cabeza',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Trabaja la cabeza larga del tríceps',
      },
      {
        exerciseId:  'ext_Cable_Seated_Lateral_Raise',
        displayName: 'Elevaciones Laterales en Polea',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Tensión constante vs mancuerna',
      },

      // ── ESTIRAMIENTO ─────────────────────────────────────────────
      {
        exerciseId:  'ext_Chest_Stretch',
        displayName: 'Estiramiento de Pecho',
        muscleGroup: 'chest-triceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Brazo a 90° apoyado en pared — mantené 30 seg por lado',
      },
      {
        exerciseId:  'ext_Lat_Stretch',
        displayName: 'Estiramiento de Dorsal',
        muscleGroup: 'back-biceps',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Agarrá una barra o marco de puerta con brazo extendido — 30 seg por lado',
      },
      {
        exerciseId:  'ext_Cross_Body_Shoulder_Stretch',
        displayName: 'Estiramiento Cruzado de Hombro',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Jalá el brazo cruzado al pecho — 30 seg por lado',
      },

      // ── CARDIO POST ──────────────────────────────────────────────
      TREADMILL_POST,
    ],
  },

  // ── Sesión 5 · Tren Inferior ─────────────────────────────────────
  {
    id:          'lower-body',
    name:        'Tren Inferior',
    description: 'Cuádriceps · Isquios · Glúteos · Pantorrillas',
    muscleGroup: 'shoulders-legs',
    exercises: [
      // ── CARDIO PRE ──────────────────────────────────────────────
      TREADMILL_PRE,

      // ── CALENTAMIENTO ───────────────────────────────────────────
      {
        exerciseId:  'ext_Hip_Circles',
        displayName: 'Círculos de Cadera',
        muscleGroup: 'shoulders-legs',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 30,
        tip: 'Abre la cadera y moviliza las articulaciones coxofemorales antes de cargar',
      },
      {
        exerciseId:  'ext_Bodyweight_Squat',
        displayName: 'Sentadillas de Calentamiento',
        muscleGroup: 'shoulders-legs',
        type: 'mobility', metric: 'reps',
        sets: 2, repsMin: 15,
        tip: 'Sin peso, rango completo — activá cuádriceps, glúteos e isquios',
      },
      {
        exerciseId:  'ext_Leg_Swings',
        displayName: 'Balanceos de Pierna',
        muscleGroup: 'shoulders-legs',
        type: 'mobility', metric: 'time',
        sets: 2, durationSec: 20,
        tip: 'Adelante/atrás y lateral — activa flexores de cadera y abductores',
      },

      // ── EJERCICIOS PRINCIPALES ───────────────────────────────────
      {
        exerciseId:  'ext_Barbell_Squat',
        displayName: 'Sentadilla con Barra',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 10, repsMax: 12,
        tip: 'Rey del tren inferior — priorizalo',
      },
      {
        exerciseId:  'ext_Barbell_Deadlift',
        displayName: 'Peso Muerto Convencional',
        muscleGroup: 'back-biceps',
        sets: 3, repsMin: 8, repsMax: 10,
        tip: 'Cadena posterior completa',
      },
      {
        exerciseId:  'ext_Leg_Press',
        displayName: 'Prensa de Piernas',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Variá la posición de pies cada sesión',
      },
      {
        exerciseId:  'ext_Leg_Extensions',
        displayName: 'Extensión de Cuádriceps en Máquina',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Pausa 1 seg arriba con contracción',
      },
      {
        exerciseId:  'ext_Lying_Leg_Curls',
        displayName: 'Curl Femoral Tumbado en Máquina',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Lento en la fase excéntrica',
      },
      {
        exerciseId:  'ext_Barbell_Hip_Thrust',
        displayName: 'Hip Thrust con Barra',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Mejor ejercicio de glúteo existente',
      },
      {
        exerciseId:  'ext_Cable_Hip_Adduction',
        displayName: 'Aducción de Cadera en Máquina',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 15, repsMax: 15,
        tip: 'Importante para la estabilidad de rodilla',
      },
      {
        exerciseId:  'ext_Seated_Calf_Raise',
        displayName: 'Pantorrillas Sentado en Máquina',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 15, repsMax: 20,
        tip: 'Sóleo — diferente al de pie',
      },

      // ── ESTIRAMIENTO ─────────────────────────────────────────────
      {
        exerciseId:  'ext_Standing_Quad_Stretch',
        displayName: 'Estiramiento de Cuádriceps',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Parado, jalá el tobillo hacia el glúteo — 30 seg por pierna',
      },
      {
        exerciseId:  'ext_Lying_Hamstring_Stretch',
        displayName: 'Estiramiento de Isquiotibiales',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 30,
        tip: 'Boca arriba, jalá la pierna extendida hacia vos — 30 seg por lado',
      },
      {
        exerciseId:  'ext_Glute_Stretch',
        displayName: 'Estiramiento de Glúteos',
        muscleGroup: 'shoulders-legs',
        type: 'stretch',
        sets: 2, durationSec: 40,
        tip: 'Posición de paloma: tobillo sobre la rodilla contraria — 40 seg por lado',
      },

      // ── CARDIO POST ──────────────────────────────────────────────
      TREADMILL_POST,
    ],
  },
];
