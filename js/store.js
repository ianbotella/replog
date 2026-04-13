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
  SESSIONS:      'replog_sessions',
  EXERCISES:     'replog_exercises',
  SETTINGS:      'replog_settings',
  PRS:           'replog_prs',
  PROFILE:       'replog_profile',
  ACHIEVEMENTS:  'replog_achievements',
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

// ── Settings ───────────────────────────────────────────────

export function getSettings() {
  return read(KEYS.SETTINGS, { theme: 'dark', restTimerDuration: 90 });
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
      if (set.weight > 0 && set.reps > 0) {
        const rm = set.weight * (1 + set.reps / 30);
        if (rm > bestRM) {
          bestRM  = rm;
          bestSet = { weight: set.weight, reps: set.reps, rm: Math.round(rm) };
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
 * @returns {Array} — definiciones de logros recién desbloqueados
 */
export function checkAndUpdateAchievements() {
  const allSessions  = getSessions();
  const prs          = getPRs();
  const prCount      = Object.keys(prs).length;
  const totalVolume  = allSessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) =>
      es + ex.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0);
  const currentStreak = calcCurrentStreak(allSessions);
  const maxStreak     = calcMaxStreak(allSessions);
  const sessionCount  = allSessions.length;

  const ctx = { sessionCount, prCount, totalVolume, currentStreak, maxStreak };

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

// ── Backup: Export / Import ────────────────────────────────

const BACKUP_VERSION = 1;

/**
 * Devuelve un objeto con todos los datos del usuario listo para serializar.
 */
export function exportAllData() {
  return {
    version:      BACKUP_VERSION,
    exportedAt:   new Date().toISOString(),
    sessions:     read(KEYS.SESSIONS,     []),
    exercises:    read(KEYS.EXERCISES,    []),
    settings:     read(KEYS.SETTINGS,     {}),
    prs:          read(KEYS.PRS,          {}),
    profile:      read(KEYS.PROFILE,      { weightHistory: [] }),
    achievements: read(KEYS.ACHIEVEMENTS, []),
  };
}

/**
 * Valida e importa un backup. Lanza Error si la estructura es inválida.
 * @param {object} data
 */
export function importAllData(data) {
  if (!data || typeof data !== 'object') throw new Error('Archivo inválido.');
  if (!Array.isArray(data.sessions))     throw new Error('El archivo no contiene sesiones válidas.');

  write(KEYS.SESSIONS,     data.sessions     ?? []);
  write(KEYS.EXERCISES,    data.exercises    ?? []);
  write(KEYS.SETTINGS,     data.settings     ?? {});
  write(KEYS.PRS,          data.prs          ?? {});
  write(KEYS.PROFILE,      data.profile      ?? { weightHistory: [] });
  write(KEYS.ACHIEVEMENTS, data.achievements ?? []);
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
      const vol      = s.exercises.reduce((t, ex) =>
        t + ex.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0);
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
 * @param {object} session
 * @returns {Array<{exerciseId, name, weight}>}
 */
export function checkAndUpdatePRs(session) {
  const prs    = getPRs();
  const newPRs = [];

  for (const ex of session.exercises) {
    const validSets = ex.sets.filter(s => s.weight > 0 && s.reps > 0);
    if (!validSets.length) continue;

    const maxWeight = Math.max(...validSets.map(s => s.weight));
    const current   = prs[ex.exerciseId];

    if (!current || maxWeight > current.weight) {
      prs[ex.exerciseId] = {
        exerciseId: ex.exerciseId,
        name:       ex.name,
        weight:     maxWeight,
        date:       session.date,
      };
      newPRs.push({ exerciseId: ex.exerciseId, name: ex.name, weight: maxWeight });
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
