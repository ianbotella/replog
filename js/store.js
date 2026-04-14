/**
 * store.js — Capa de datos con localStorage
 *
 * Claves usadas:
 *   replog_sessions      → Session[]
 *   replog_exercises     → ExerciseLibraryItem[]  (solo custom)
 *   replog_settings      → { theme: 'dark'|'light' }
 *   replog_prs           → { [exerciseId]: PREntry }
 *   replog_profile       → ProfileData
 *   replog_achievements  → AchievementEntry[]
 *
 * Tipos:
 *   Session = {
 *     id: string,
 *     date: string,               // ISO 8601 "YYYY-MM-DD"
 *     muscleGroup: string,
 *     exercises: SessionExercise[],
 *     durationMin: number,
 *     notes: string,
 *     startedAt: string,          // ISO timestamp
 *     estimatedCalories: number   // opcional
 *   }
 *
 *   ProfileData = {
 *     gender: 'male'|'female'|'other',
 *     birthYear: number,
 *     heightCm: number,
 *     weightHistory: [{ date: string, weightKg: number }]
 *   }
 *
 *   SessionExercise = {
 *     exerciseId: string,
 *     name: string,
 *     sets: Set[]
 *   }
 *
 *   Set = { weight: number, reps: number }
 *
 *   ExerciseLibraryItem = {
 *     id: string,
 *     name: string,
 *     muscleGroup: string,
 *     category: string,
 *     custom: true
 *   }
 */

const KEYS = {
  SESSIONS:        'replog_sessions',
  EXERCISES:       'replog_exercises',
  SETTINGS:        'replog_settings',
  PRS:             'replog_prs',
  PROFILE:         'replog_profile',
  ACHIEVEMENTS:    'replog_achievements',
  ROUTINES:        'replog_routines',
  PLAN:            'replog_plan',
  EXERCISE_NOTES:  'replog_exercise_notes',
};

import { ACHIEVEMENT_DEFS } from './data/achievements.js';

// ── Helpers ────────────────────────────────────────────────

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Volume utilities ────────────────────────────────────────

/**
 * Suma weight × reps de un array de series.
 * Filtra explícitamente los sets sin weight/reps válidos
 * (sets de cardio, movilidad o estiramiento tienen weight = undefined / 0).
 * @param {Array} sets
 * @returns {number}
 */
export function calcSetsVolume(sets = []) {
  return sets
    .filter(s => resolveWeightKg(s) > 0 && s.reps > 0)
    .reduce((acc, s) => acc + resolveWeightKg(s) * s.reps, 0);
}

/**
 * Calcula el volumen total de una sesión (suma de todos sus ejercicios).
 * @param {object} session
 * @returns {number}
 */
export function calcSessionVolume(session) {
  return session.exercises.reduce((acc, ex) => acc + calcSetsVolume(ex.sets), 0);
}

/**
 * Calcula el volumen histórico total de un array de sesiones.
 * @param {Array} sessions
 * @returns {number}
 */
export function calcTotalVolume(sessions = []) {
  return sessions.reduce((acc, s) => acc + calcSessionVolume(s), 0);
}

// ── Settings ───────────────────────────────────────────────

export function getSettings() {
  return read(KEYS.SETTINGS, { theme: 'dark', restTimerDuration: 90, weightUnit: 'kg' });
}

/**
 * Devuelve el peso en kg de un set, con retrocompatibilidad para sets históricos.
 * @param {object} set
 * @returns {number}
 */
export function resolveWeightKg(set) {
  if (set.weightKg !== undefined) return set.weightKg;
  if (set.weightUnit === 'lb')    return set.weight / 2.2046;
  return set.weight ?? 0;
}

export function saveSettings(partial) {
  const current = getSettings();
  write(KEYS.SETTINGS, { ...current, ...partial });
}

// ── Sessions ───────────────────────────────────────────────

export function getSessions() {
  return read(KEYS.SESSIONS, []);
}

/** Devuelve las sesiones ordenadas de más reciente a más antigua. */
export function getSessionsSorted() {
  return getSessions().sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Devuelve la sesión del día actual en curso (status !== 'done'), si existe.
 * Las sesiones finalizadas no se retoman — solo las que están activas.
 */
export function getTodaySession() {
  const today = todayISO();
  return getSessions().find(s => s.date === today && s.status !== 'done') ?? null;
}

/** Guarda una sesión nueva o actualiza una existente (por id). */
export function saveSession(session) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  write(KEYS.SESSIONS, sessions);
}

/**
 * Crea una sesión nueva para hoy y la guarda. Devuelve la sesión.
 * muscleGroup es opcional: null para sesiones libres.
 */
export function createSession(muscleGroup = null) {
  const session = {
    id:          uid(),
    date:        todayISO(),
    muscleGroup, // null en sesiones libres; se detecta dinámicamente de los ejercicios
    exercises:   [],
    durationMin: 0,
    notes:       '',
    startedAt:   new Date().toISOString(),
    status:      'active',
  };
  saveSession(session);
  return session;
}

/** Elimina una sesión por id. */
export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  write(KEYS.SESSIONS, sessions);
}

/** Devuelve todas las sesiones de la semana actual (lunes–domingo). */
export function getThisWeekSessions() {
  const sessions = getSessions();
  const { start, end } = currentWeekRange();
  return sessions.filter(s => s.date >= start && s.date <= end);
}

/**
 * Devuelve los datos históricos de un ejercicio específico:
 * [{ date, maxWeight, totalVolume }]
 */
export function getExerciseHistory(exerciseId) {
  const sessions = getSessionsSorted();
  const result = [];

  for (const session of sessions) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex || ex.sets.length === 0) continue;

    const validSets = ex.sets.filter(s => resolveWeightKg(s) > 0 && s.reps > 0);
    if (validSets.length === 0) continue;

    const maxWeight    = Math.max(...validSets.map(s => resolveWeightKg(s)));
    const totalVolume  = calcSetsVolume(validSets);
    const totalReps    = validSets.reduce((sum, s) => sum + s.reps, 0);

    result.push({
      date:        session.date,
      maxWeight,
      totalVolume,
      totalReps,
      sets:        validSets.length,
    });
  }

  // Orden cronológico ascendente para el gráfico
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Custom Exercises ───────────────────────────────────────

export function getCustomExercises() {
  return read(KEYS.EXERCISES, []);
}

export function saveCustomExercise(exercise) {
  const exercises = getCustomExercises();
  const newEx = { ...exercise, id: uid(), custom: true };
  exercises.push(newEx);
  write(KEYS.EXERCISES, exercises);
  return newEx;
}

export function deleteCustomExercise(id) {
  const exercises = getCustomExercises().filter(e => e.id !== id);
  write(KEYS.EXERCISES, exercises);
}

// ── Exercise Notes ─────────────────────────────────────────

/**
 * Obtiene la nota personal de un ejercicio.
 * Para ejercicios custom: lee el campo `notes` del objeto en replog_exercises.
 * Para ejercicios externos: lee de replog_exercise_notes, indexado por ID.
 * @param {string} exerciseId
 * @returns {string|null}
 */
export function getExerciseNote(exerciseId) {
  const custom = getCustomExercises().find(e => e.id === exerciseId);
  if (custom) return custom.notes || null;
  const notes = read(KEYS.EXERCISE_NOTES, {});
  return notes[exerciseId] || null;
}

/**
 * Guarda la nota personal de un ejercicio.
 * @param {string} exerciseId
 * @param {string} note
 * @param {boolean} isCustom
 */
export function saveExerciseNote(exerciseId, note, isCustom = false) {
  if (isCustom) {
    const exercises = getCustomExercises();
    const idx = exercises.findIndex(e => e.id === exerciseId);
    if (idx >= 0) {
      exercises[idx] = { ...exercises[idx], notes: note };
      write(KEYS.EXERCISES, exercises);
    }
  } else {
    const notes = read(KEYS.EXERCISE_NOTES, {});
    notes[exerciseId] = note;
    write(KEYS.EXERCISE_NOTES, notes);
  }
}

/**
 * Elimina la nota personal de un ejercicio.
 * @param {string} exerciseId
 * @param {boolean} isCustom
 */
export function deleteExerciseNote(exerciseId, isCustom = false) {
  if (isCustom) {
    const exercises = getCustomExercises();
    const idx = exercises.findIndex(e => e.id === exerciseId);
    if (idx >= 0) {
      const { notes: _removed, ...rest } = exercises[idx];
      exercises[idx] = rest;
      write(KEYS.EXERCISES, exercises);
    }
  } else {
    const notes = read(KEYS.EXERCISE_NOTES, {});
    delete notes[exerciseId];
    write(KEYS.EXERCISE_NOTES, notes);
  }
}

/**
 * Devuelve los datos de la última sesión anterior a hoy donde se registró
 * el ejercicio con ese ID. Busca el más reciente, ignorando la sesión de hoy.
 * @returns {{ date: string, sets: object[] } | null}
 */
export function getLastExerciseSession(exerciseId) {
  const today    = todayISO();
  const sessions = getSessions()
    .filter(s => s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const session of sessions) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (ex && ex.sets && ex.sets.length > 0) {
      return { date: session.date, sets: ex.sets };
    }
  }
  return null;
}

// ── Profile ────────────────────────────────────────────────

/**
 * Devuelve el perfil del usuario.
 * @returns {{ gender?, birthYear?, heightCm?, weightHistory: [] }}
 */
export function getProfile() {
  return read(KEYS.PROFILE, { weightHistory: [] });
}

/**
 * Guarda cambios parciales del perfil (gender, birthYear, heightCm).
 * @param {object} partial
 */
export function saveProfile(partial) {
  const current = getProfile();
  write(KEYS.PROFILE, { ...current, ...partial });
}

/**
 * Agrega una entrada de peso al historial.
 * Si ya existe una entrada para hoy, la reemplaza.
 * @param {number} weightKg
 */
export function addWeightEntry(weightKg) {
  const profile = getProfile();
  const today   = todayISO();
  const history = profile.weightHistory ?? [];

  const existingIdx = history.findIndex(e => e.date === today);
  if (existingIdx >= 0) {
    history[existingIdx] = { date: today, weightKg };
  } else {
    history.push({ date: today, weightKg });
  }

  write(KEYS.PROFILE, { ...profile, weightHistory: history });
}

/**
 * Devuelve true si han pasado más de 7 días desde la última entrada de peso,
 * o si no hay ningún registro de peso.
 */
export function needsWeightUpdate() {
  const profile = getProfile();
  const history = profile.weightHistory ?? [];
  if (!history.length) return true;

  const last     = history[history.length - 1].date;
  const lastDate = new Date(last + 'T00:00:00');
  const diffMs   = Date.now() - lastDate.getTime();
  return diffMs > 7 * 24 * 60 * 60 * 1000;
}

// ── Calorie estimation ────────────────────────────────────

/** MET aproximado por tipo de ejercicio */
const MET_MAP = { strength: 5.0, cardio: 7.5, mobility: 2.5, stretch: 2.5 };

/**
 * Calcula las calorías estimadas de una sesión usando MET × peso × horas.
 * @param {object} session
 * @param {number|null} weightKg  Peso del usuario en kg
 * @returns {number|null}
 */
export function calcEstimatedCalories(session, weightKg) {
  if (!weightKg || !session.durationMin || !session.exercises.length) return null;
  let totalMET = 0;
  for (const ex of session.exercises) {
    totalMET += MET_MAP[ex.type ?? 'strength'] ?? 5.0;
  }
  const avgMET = totalMET / session.exercises.length;
  return Math.round(avgMET * weightKg * (session.durationMin / 60));
}

// ── 1RM estimado (Epley) ───────────────────────────────────

/**
 * Devuelve el mejor 1RM estimado para un ejercicio según la fórmula de Epley.
 * @param {string} exerciseId
 * @returns {{ weight: number, reps: number, rm: number }|null}
 */
export function getBestOneRM(exerciseId) {
  const sessions = getSessions();
  let bestRM  = 0;
  let bestSet = null;

  for (const session of sessions) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (!ex) continue;
    for (const set of ex.sets) {
      const wKg = resolveWeightKg(set);
      if (wKg > 0 && set.reps > 0) {
        const rm = wKg * (1 + set.reps / 30);
        if (rm > bestRM) {
          bestRM  = rm;
          bestSet = { weight: wKg, reps: set.reps, rm: Math.round(rm) };
        }
      }
    }
  }
  return bestSet;
}

// ── Achievements ───────────────────────────────────────────

/**
 * Devuelve los logros desbloqueados.
 * @returns {Array<{ id: string, unlockedAt: string }>}
 */
export function getAchievements() {
  return read(KEYS.ACHIEVEMENTS, []);
}

/**
 * Evalúa todos los logros contra el estado actual de los datos.
 * Guarda los nuevos logros desbloqueados y devuelve sus definiciones.
 *
 * @param {object|null} session — sesión recién finalizada (para calcular sessionVolume)
 * @returns {Array} — definiciones de logros recién desbloqueados
 */
export function checkAndUpdateAchievements(session = null) {
  const allSessions   = getSessions();
  const prs           = getPRs();
  const currentStreak = calcCurrentStreak(allSessions);
  const maxStreak     = calcMaxStreak(allSessions);
  const sessionCount  = allSessions.length;

  // Métricas de PRs: solo cuentan mejoras sobre registros previos
  const prValues          = Object.values(prs);
  const totalImproved     = prValues.reduce((sum, p) => sum + (p.improvedCount ?? 0), 0);
  const exercisesImproved = prValues.filter(p => (p.improvedCount ?? 0) >= 1).length;
  const prDoubleUnlocked  = prValues.some(p => {
    const fw = p.firstWeight ?? p.weight;
    return fw > 0 && p.weight >= fw * 2;
  });

  // Volumen de la sesión recién finalizada (0 cuando se llama desde progress.js)
  const sessionVolume = session ? calcSessionVolume(session) : 0;

  const ctx = {
    sessionCount,
    currentStreak,
    maxStreak,
    bestStreak: Math.max(currentStreak, maxStreak),
    totalImproved,
    exercisesImproved,
    prDoubleUnlocked,
    sessionVolume,
  };

  const unlocked    = getAchievements();
  const unlockedIds = new Set(unlocked.map(a => a.id));
  const today       = todayISO();
  const newOnes     = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (unlockedIds.has(def.id)) continue;
    if (def.check(ctx)) {
      unlocked.push({ id: def.id, unlockedAt: today });
      newOnes.push(def);
    }
  }

  write(KEYS.ACHIEVEMENTS, unlocked);
  return newOnes;
}

/**
 * Elimina de replog_achievements cualquier entrada cuyo id ya no existe
 * en las definiciones actuales. Se ejecuta una sola vez al cargar la app.
 */
export function migrateAchievements() {
  const validIds = new Set(ACHIEVEMENT_DEFS.map(d => d.id));
  const current  = getAchievements();
  const migrated = current.filter(a => validIds.has(a.id));
  if (migrated.length !== current.length) {
    write(KEYS.ACHIEVEMENTS, migrated);
  }
}

// ── Streak helpers (exported for reuse en progress.js) ─────

export function calcCurrentStreak(sessions) {
  const datesSet = new Set(sessions.map(s => s.date));
  const today    = todayISO();
  let streak = 0;
  const d = new Date();

  if (!datesSet.has(today)) d.setDate(d.getDate() - 1);

  while (true) {
    const iso = _dateToISO(d);
    if (datesSet.has(iso)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calcMaxStreak(sessions) {
  if (!sessions.length) return 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort();
  let maxStreak = 1, current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i]     + 'T00:00:00');
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }
  return maxStreak;
}

function _dateToISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Custom Routines ────────────────────────────────────────

/**
 * Devuelve las rutinas personalizadas del usuario.
 * @returns {Array}
 */
export function getCustomRoutines() {
  return read(KEYS.ROUTINES, []);
}

/**
 * Guarda una rutina personalizada (crea o actualiza por id).
 * Si no tiene id, genera uno nuevo.
 * @param {object} routine
 * @returns {object} — rutina con id garantizado
 */
export function saveCustomRoutine(routine) {
  const routines = getCustomRoutines();
  if (!routine.id) {
    routine = { ...routine, id: uid(), createdAt: todayISO() };
    routines.push(routine);
  } else {
    const idx = routines.findIndex(r => r.id === routine.id);
    if (idx >= 0) {
      routines[idx] = routine;
    } else {
      routines.push(routine);
    }
  }
  write(KEYS.ROUTINES, routines);
  return routine;
}

/**
 * Elimina una rutina personalizada y la quita del plan semanal.
 * @param {string} id
 */
export function deleteCustomRoutine(id) {
  write(KEYS.ROUTINES, getCustomRoutines().filter(r => r.id !== id));
  // Limpiar referencias del plan
  const plan = getWeeklyPlan();
  let changed = false;
  Object.keys(plan).forEach(day => {
    if (plan[day] === id) { plan[day] = null; changed = true; }
  });
  if (changed) write(KEYS.PLAN, plan);
}

// ── Weekly Plan ────────────────────────────────────────────

const _DEFAULT_PLAN = {
  monday: null, tuesday: null, wednesday: null, thursday: null,
  friday: null, saturday: null, sunday: null,
};

/**
 * Devuelve el plan semanal (un routine id o null por cada día).
 * @returns {{ monday, tuesday, wednesday, thursday, friday, saturday, sunday }}
 */
export function getWeeklyPlan() {
  return read(KEYS.PLAN, { ..._DEFAULT_PLAN });
}

/**
 * Guarda el plan semanal.
 * @param {object} plan
 */
export function saveWeeklyPlan(plan) {
  write(KEYS.PLAN, plan);
}

// ── Backup: Export / Import ────────────────────────────────

const BACKUP_VERSION = 1;

/**
 * Devuelve un objeto con todos los datos del usuario listo para serializar.
 */
export function exportAllData() {
  return {
    version:       BACKUP_VERSION,
    exportedAt:    new Date().toISOString(),
    sessions:      read(KEYS.SESSIONS,        []),
    exercises:     read(KEYS.EXERCISES,       []),
    settings:      read(KEYS.SETTINGS,        {}),
    prs:           read(KEYS.PRS,             {}),
    profile:       read(KEYS.PROFILE,         { weightHistory: [] }),
    achievements:  read(KEYS.ACHIEVEMENTS,    []),
    routines:      read(KEYS.ROUTINES,        []),
    plan:          read(KEYS.PLAN,            {}),
    exerciseNotes: read(KEYS.EXERCISE_NOTES,  {}),
  };
}

/**
 * Valida e importa un backup. Lanza Error si la estructura es inválida.
 * @param {object} data
 */
export function importAllData(data) {
  if (!data || typeof data !== 'object') throw new Error('Archivo inválido.');
  if (!Array.isArray(data.sessions))     throw new Error('El archivo no contiene sesiones válidas.');

  write(KEYS.SESSIONS,        data.sessions       ?? []);
  write(KEYS.EXERCISES,       data.exercises      ?? []);
  write(KEYS.SETTINGS,        data.settings       ?? {});
  write(KEYS.PRS,             data.prs            ?? {});
  write(KEYS.PROFILE,         data.profile        ?? { weightHistory: [] });
  write(KEYS.ACHIEVEMENTS,    data.achievements   ?? []);
  write(KEYS.ROUTINES,        data.routines       ?? []);
  write(KEYS.PLAN,            data.plan           ?? {});
  write(KEYS.EXERCISE_NOTES,  data.exerciseNotes  ?? {});
}

/**
 * Genera un string CSV con el historial de sesiones (sin series detalladas).
 * @returns {string}
 */
export function exportSessionsCSV() {
  const sessions = read(KEYS.SESSIONS, []);
  const header   = 'fecha,grupo_muscular,duracion_min,ejercicios,series,volumen_kg,notas';

  const rows = sessions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(s => {
      const exCount  = s.exercises.length;
      const setCount = s.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      const vol      = calcSessionVolume(s);
      const notes    = (s.notes || '').replace(/"/g, '""');
      return `${s.date},${s.muscleGroup ?? ''},${s.durationMin ?? 0},${exCount},${setCount},${vol},"${notes}"`;
    });

  return [header, ...rows].join('\n');
}

// ── Personal Records (PRs) ─────────────────────────────────

/**
 * Devuelve todos los PRs guardados.
 * Estructura: { [exerciseId]: { exerciseId, name, weight, date } }
 */
export function getPRs() {
  return read(KEYS.PRS, {});
}

/**
 * Analiza una sesión recién guardada, actualiza los PRs si corresponde,
 * y devuelve la lista de nuevos PRs detectados en esta sesión.
 *
 * Estructura actualizada de cada entrada en replog_prs:
 *   { exerciseId, name, weight, date, firstWeight, improvedCount }
 *
 *   firstWeight   — primer peso registrado histórico (nunca se modifica)
 *   improvedCount — veces que se superó el PR previo (empieza en 0, sube solo al superar)
 *
 * Retrocompatibilidad: entradas sin firstWeight/improvedCount se inicializan en este método.
 *
 * @param {object} session
 * @returns {Array<{exerciseId, name, weight}>}
 */
export function checkAndUpdatePRs(session) {
  const prs    = getPRs();
  const newPRs = [];

  for (const ex of session.exercises) {
    const validSets = ex.sets.filter(s => resolveWeightKg(s) > 0 && s.reps > 0);
    if (!validSets.length) continue;

    const maxWeight = Math.max(...validSets.map(s => resolveWeightKg(s)));
    const current   = prs[ex.exerciseId];

    if (!current) {
      // Primera vez que se registra este ejercicio
      prs[ex.exerciseId] = {
        exerciseId:    ex.exerciseId,
        name:          ex.name,
        weight:        maxWeight,
        date:          session.date,
        firstWeight:   maxWeight,
        improvedCount: 0,
      };
      newPRs.push({ exerciseId: ex.exerciseId, name: ex.name, weight: maxWeight });
    } else if (maxWeight > current.weight) {
      // Nuevo PR — retrocompat: inicializar firstWeight si no existe
      const firstWeight    = current.firstWeight ?? current.weight;
      const improvedCount  = (current.improvedCount ?? 0) + 1;
      prs[ex.exerciseId]   = {
        ...current,
        weight:        maxWeight,
        date:          session.date,
        firstWeight,
        improvedCount,
      };
      newPRs.push({ exerciseId: ex.exerciseId, name: ex.name, weight: maxWeight });
    } else if (current.firstWeight === undefined) {
      // Retrocompat: inicializar campos en entradas existentes sin mejora en esta sesión
      prs[ex.exerciseId] = {
        ...current,
        firstWeight:   current.weight,
        improvedCount: 0,
      };
    }
  }

  write(KEYS.PRS, prs);
  return newPRs;
}

// ── Date utils ─────────────────────────────────────────────

/** Fecha de hoy en formato YYYY-MM-DD */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Formato legible para mostrar (ej: "Lunes 7 de abril") */
export function formatDateDisplay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
}

/** Formato corto para el historial (ej: "07/04") */
export function formatDateShort(isoDate) {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

/** Rango de la semana actual (lunes → domingo) en ISO */
export function currentWeekRange() {
  const now  = new Date();
  const day  = now.getDay(); // 0=dom, 1=lun … 6=sab
  const diff = (day === 0 ? -6 : 1 - day); // días hasta lunes
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  const sun  = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return { start: fmt(mon), end: fmt(sun) };
}

/** Devuelve los 7 días de la semana actual como ISO strings [lun..dom] */
export function currentWeekDays() {
  const { start } = currentWeekRange();
  const [y, m, d] = start.split('-').map(Number);
  const mon = new Date(y, m - 1, d);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return {
      iso,
      label: day.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 2).toUpperCase(),
      dayNum: day.getDate(),
    };
  });
}
