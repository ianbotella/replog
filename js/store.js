/**
 * store.js — Capa de datos con localStorage
 *
 * Claves usadas:
 *   replog_sessions   → Session[]
 *   replog_exercises  → ExerciseLibraryItem[]  (solo custom)
 *   replog_settings   → { theme: 'dark'|'light' }
 *
 * Tipos:
 *   Session = {
 *     id: string,
 *     date: string,           // ISO 8601 "YYYY-MM-DD"
 *     muscleGroup: string,
 *     exercises: SessionExercise[],
 *     durationMin: number,
 *     notes: string,
 *     startedAt: string       // ISO timestamp
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
  SESSIONS:  'replog_sessions',
  EXERCISES: 'replog_exercises',
  SETTINGS:  'replog_settings',
};

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

// ── Settings ───────────────────────────────────────────────

export function getSettings() {
  return read(KEYS.SETTINGS, { theme: 'dark' });
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

/** Devuelve la sesión del día actual, si existe. */
export function getTodaySession() {
  const today = todayISO();
  return getSessions().find(s => s.date === today) ?? null;
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

/** Crea una sesión nueva para hoy y la guarda. Devuelve la sesión. */
export function createSession(muscleGroup) {
  const session = {
    id:          uid(),
    date:        todayISO(),
    muscleGroup,
    exercises:   [],
    durationMin: 0,
    notes:       '',
    startedAt:   new Date().toISOString(),
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

    const validSets = ex.sets.filter(s => s.weight > 0 && s.reps > 0);
    if (validSets.length === 0) continue;

    const maxWeight    = Math.max(...validSets.map(s => s.weight));
    const totalVolume  = validSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
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
