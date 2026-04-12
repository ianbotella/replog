/**
 * routineTemplates.js — Rutinas predefinidas de entrenamiento.
 *
 * Cada ejercicio referencia un ID de free-exercise-db (prefijo ext_).
 *   exerciseId  — ID de la API, usado para buscar el ejercicio en la caché.
 *   displayName — Nombre en español; usado como fallback si el ID no está en caché.
 *   muscleGroup — Grupo muscular interno ('chest-triceps' | 'back-biceps' | 'shoulders-legs').
 *   sets        — Series por defecto (Fase 1).
 *   repsMin     — Reps mínimas sugeridas.
 *   repsMax     — Reps máximas sugeridas.
 *   tip         — Indicación clave visible durante la sesión.
 *
 * Sustituciones notables (sin equivalente exacto en la API):
 *   "Fondos en paralelas"          → Dips - Chest Version (fondos versión pecho)
 *   "Pullover en polea"            → Rope Straight-Arm Pulldown (mismo patrón dorsal)
 *   "Kickbacks en polea"           → Standing Low-Pulley One-Arm Triceps Extension
 *   "Sentadilla búlgara mancuernas"→ Split Squat with Dumbbells (patrón unilateral equivalente)
 *   "Extensión tríceps sobre cabeza"→ Cable Rope Overhead Triceps Extension
 *   "Elevaciones laterales en polea"→ Cable Seated Lateral Raise
 *   "Aducción en máquina"          → Cable Hip Adduction
 */

export const ROUTINE_TEMPLATES = [
  // ── Sesión 1 · Pecho + Tríceps ──────────────────────────────────
  {
    id:          'chest-triceps',
    name:        'Pecho + Tríceps',
    description: 'Pectoral · Tríceps · Serrato',
    muscleGroup: 'chest-triceps',
    exercises: [
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
        // Sustitución: Fondos en paralelas → Dips - Chest Version
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
        // Sustitución: Kickbacks en polea → Standing Low-Pulley One-Arm Triceps Extension
        exerciseId:  'ext_Standing_Low-Pulley_One-Arm_Triceps_Extension',
        displayName: 'Kickbacks en Polea',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Extensión completa en la cima',
      },
    ],
  },

  // ── Sesión 2 · Espalda + Bíceps ─────────────────────────────────
  {
    id:          'back-biceps',
    name:        'Espalda + Bíceps',
    description: 'Dorsal · Trapecio · Romboides · Bíceps',
    muscleGroup: 'back-biceps',
    exercises: [
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
        // Sustitución: Pullover en polea → Rope Straight-Arm Pulldown (mismo patrón de dorsal)
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
    ],
  },

  // ── Sesión 3 · Hombros + Piernas ────────────────────────────────
  {
    id:          'shoulders-legs',
    name:        'Hombros + Piernas',
    description: 'Deltoides · Cuádriceps · Isquios · Glúteos',
    muscleGroup: 'shoulders-legs',
    exercises: [
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
        // Sustitución: Sentadilla búlgara → Split Squat with Dumbbells (patrón unilateral equivalente)
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
    ],
  },

  // ── Sesión 4 · Tren Superior ─────────────────────────────────────
  {
    id:          'upper-body',
    name:        'Tren Superior',
    description: 'Pecho · Espalda · Hombros · Bíceps · Tríceps',
    muscleGroup: 'chest-triceps',
    exercises: [
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
        // Sustitución: Extensión tríceps sobre cabeza → Cable Rope Overhead Triceps Extension
        exerciseId:  'ext_Cable_Rope_Overhead_Triceps_Extension',
        displayName: 'Extensión de Tríceps sobre Cabeza',
        muscleGroup: 'chest-triceps',
        sets: 3, repsMin: 12, repsMax: 12,
        tip: 'Trabaja la cabeza larga del tríceps',
      },
      {
        // Sustitución: Elevaciones laterales en polea → Cable Seated Lateral Raise
        exerciseId:  'ext_Cable_Seated_Lateral_Raise',
        displayName: 'Elevaciones Laterales en Polea',
        muscleGroup: 'shoulders-legs',
        sets: 3, repsMin: 12, repsMax: 15,
        tip: 'Tensión constante vs mancuerna',
      },
    ],
  },

  // ── Sesión 5 · Tren Inferior ─────────────────────────────────────
  {
    id:          'lower-body',
    name:        'Tren Inferior',
    description: 'Cuádriceps · Isquios · Glúteos · Pantorrillas',
    muscleGroup: 'shoulders-legs',
    exercises: [
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
        // Sustitución: Aducción en máquina → Cable Hip Adduction
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
    ],
  },
];
