/**
 * freeExerciseDb.js — Integración con free-exercise-db
 * https://github.com/yuhonas/free-exercise-db
 *
 * Descarga, cachea (24 h en localStorage) y mapea los ejercicios
 * al formato interno de Replog.
 */

const EXT_DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const CACHE_KEY  = 'replog_ext_exercises';
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 h en ms

// ── Tablas de mapeo ────────────────────────────────────────

const MUSCLE_TO_GROUP = {
  chest:          'chest-triceps',
  triceps:        'chest-triceps',
  lats:           'back-biceps',
  'middle back':  'back-biceps',
  'lower back':   'back-biceps',
  biceps:         'back-biceps',
  shoulders:      'shoulders-legs',
  traps:          'shoulders-legs',
  quadriceps:     'shoulders-legs',
  hamstrings:     'shoulders-legs',
  glutes:         'shoulders-legs',
  calves:         'shoulders-legs',
  abductors:      'shoulders-legs',
  adductors:      'shoulders-legs',
  abdominals:     'shoulders-legs',
  forearms:       'general',
  neck:           'general',
};

const MUSCLE_TO_CATEGORY = {
  chest:          'Pecho',
  triceps:        'Tríceps',
  lats:           'Espalda',
  'middle back':  'Espalda',
  'lower back':   'Espalda',
  biceps:         'Bíceps',
  shoulders:      'Hombros',
  traps:          'Hombros',
  quadriceps:     'Piernas',
  hamstrings:     'Piernas',
  glutes:         'Piernas',
  calves:         'Piernas',
  abductors:      'Piernas',
  adductors:      'Piernas',
  abdominals:     'Abdominales',
  forearms:       'Antebrazos',
  neck:           'Cuello',
};

const CAT_TO_TYPE = {
  strength:                'strength',
  powerlifting:            'strength',
  'olympic weightlifting': 'strength',
  strongman:               'strength',
  plyometrics:             'strength',
  stretching:              'stretch',
  cardio:                  'cardio',
};

// ── Caché en memoria para evitar fetches paralelos ─────────

let _pendingFetch = null;

// ── Mapping ────────────────────────────────────────────────

function _map(raw) {
  const primary     = raw.primaryMuscles?.[0] ?? '';
  const muscleGroup = MUSCLE_TO_GROUP[primary]    ?? 'general';
  const category    = MUSCLE_TO_CATEGORY[primary] ?? 'General';
  const type        = CAT_TO_TYPE[raw.category]   ?? 'strength';

  const ex = {
    id:          `ext_${raw.id}`,
    name:        raw.name,
    muscleGroup,
    category,
    external:    true,
  };
  if (type !== 'strength')                              ex.type      = type;
  if (raw.equipment && raw.equipment !== 'body only')   ex.equipment = raw.equipment;
  if (raw.level)                                        ex.level     = raw.level;
  return ex;
}

// ── API pública ────────────────────────────────────────────

/**
 * Descarga y mapea los ejercicios de free-exercise-db.
 * Usa caché de localStorage (24 h). Retorna [] si hay error de red.
 * @returns {Promise<Array>}
 */
export async function fetchExternalExercises() {
  // 1. Revisar caché localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* ignorar errores de parse */ }

  // 2. Evitar fetches simultáneos — reutilizar la promesa en vuelo
  if (_pendingFetch) return _pendingFetch;

  // 3. Fetch y mapeo
  _pendingFetch = fetch(EXT_DB_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(json => {
      const data = json.map(_map);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch { /* localStorage lleno — operar sin caché */ }
      return data;
    })
    .catch(err => {
      console.warn('[replog] No se pudo cargar free-exercise-db:', err);
      return [];
    })
    .finally(() => { _pendingFetch = null; });

  return _pendingFetch;
}
