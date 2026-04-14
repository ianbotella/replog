/**
 * achievements.js — Definiciones de todos los logros de Replog.
 *
 * Cada logro tiene:
 *   id          string  — identificador único (guardado en localStorage)
 *   name        string  — nombre con emoji mostrado en UI
 *   category    string  — 'sessions' | 'streak' | 'prs' | 'session_volume'
 *   description string  — frase corta cuando está desbloqueado
 *   hint        string  — condición a cumplir cuando está bloqueado
 *   check(ctx)  fn      — true si se cumple la condición
 *   progress(ctx) fn    — { current, target } para barra de progreso, o null
 *
 * ctx = {
 *   sessionCount, currentStreak, maxStreak, bestStreak,
 *   totalImproved, exercisesImproved, prDoubleUnlocked,
 *   sessionVolume
 * }
 */

export const ACHIEVEMENT_DEFS = [
  // ── Consistencia (sessionCount) ──────────────────────────
  {
    id:          'sessions_1',
    name:        'Primer paso ✅',
    category:    'sessions',
    description: 'Completaste tu primera sesión',
    hint:        'Completá tu primera sesión',
    check:       ctx => ctx.sessionCount >= 1,
    progress:    ctx => ({ current: Math.min(ctx.sessionCount, 1), target: 1 }),
  },
  {
    id:          'sessions_5',
    name:        'Tomando ritmo 🎯',
    category:    'sessions',
    description: '5 sesiones completadas',
    hint:        'Completá 5 sesiones',
    check:       ctx => ctx.sessionCount >= 5,
    progress:    ctx => ({ current: ctx.sessionCount, target: 5 }),
  },
  {
    id:          'sessions_25',
    name:        'Comprometido 💪',
    category:    'sessions',
    description: '25 sesiones completadas',
    hint:        'Completá 25 sesiones',
    check:       ctx => ctx.sessionCount >= 25,
    progress:    ctx => ({ current: ctx.sessionCount, target: 25 }),
  },
  {
    id:          'sessions_50',
    name:        'Veterano 🥋',
    category:    'sessions',
    description: '50 sesiones completadas',
    hint:        'Completá 50 sesiones',
    check:       ctx => ctx.sessionCount >= 50,
    progress:    ctx => ({ current: ctx.sessionCount, target: 50 }),
  },
  {
    id:          'sessions_100',
    name:        'Centenario 🎖️',
    category:    'sessions',
    description: '100 sesiones completadas',
    hint:        'Completá 100 sesiones',
    check:       ctx => ctx.sessionCount >= 100,
    progress:    ctx => ({ current: ctx.sessionCount, target: 100 }),
  },

  // ── Rachas (bestStreak) ───────────────────────────────────
  {
    id:          'streak_3',
    name:        'En racha 🔥',
    category:    'streak',
    description: '3 días consecutivos entrenando',
    hint:        'Completá 3 días seguidos',
    check:       ctx => ctx.bestStreak >= 3,
    progress:    ctx => ({ current: Math.min(ctx.bestStreak, 3), target: 3 }),
  },
  {
    id:          'streak_5',
    name:        'Imparable ⚡',
    category:    'streak',
    description: '5 días consecutivos entrenando',
    hint:        'Completá 5 días seguidos',
    check:       ctx => ctx.bestStreak >= 5,
    progress:    ctx => ({ current: Math.min(ctx.bestStreak, 5), target: 5 }),
  },
  {
    id:          'streak_7',
    name:        'Semana perfecta 🗓️',
    category:    'streak',
    description: '7 días consecutivos entrenando',
    hint:        'Completá 7 días seguidos',
    check:       ctx => ctx.bestStreak >= 7,
    progress:    ctx => ({ current: Math.min(ctx.bestStreak, 7), target: 7 }),
  },
  {
    id:          'streak_14',
    name:        'Dos semanas 💥',
    category:    'streak',
    description: '14 días consecutivos entrenando',
    hint:        'Completá 14 días seguidos',
    check:       ctx => ctx.bestStreak >= 14,
    progress:    ctx => ({ current: Math.min(ctx.bestStreak, 14), target: 14 }),
  },
  {
    id:          'streak_30',
    name:        'Mes de hierro 🏅',
    category:    'streak',
    description: '30 días consecutivos entrenando',
    hint:        'Completá 30 días seguidos',
    check:       ctx => ctx.bestStreak >= 30,
    progress:    ctx => ({ current: Math.min(ctx.bestStreak, 30), target: 30 }),
  },

  // ── Récords personales (solo mejoras sobre el PR anterior) ─
  {
    id:          'pr_improved_1',
    name:        'Primera mejora 🏆',
    category:    'prs',
    description: 'Superaste un PR por primera vez',
    hint:        'Superá un registro previo en cualquier ejercicio',
    check:       ctx => ctx.totalImproved >= 1,
    progress:    ctx => ({ current: Math.min(ctx.totalImproved, 1), target: 1 }),
  },
  {
    id:          'pr_improved_5',
    name:        'Progresando 📈',
    category:    'prs',
    description: 'Superaste PRs en 5 ejercicios distintos',
    hint:        'Superá tu récord en 5 ejercicios distintos',
    check:       ctx => ctx.exercisesImproved >= 5,
    progress:    ctx => ({ current: ctx.exercisesImproved, target: 5 }),
  },
  {
    id:          'pr_improved_10',
    name:        'Máquina 💥',
    category:    'prs',
    description: 'Superaste PRs en 10 ejercicios distintos',
    hint:        'Superá tu récord en 10 ejercicios distintos',
    check:       ctx => ctx.exercisesImproved >= 10,
    progress:    ctx => ({ current: ctx.exercisesImproved, target: 10 }),
  },
  {
    id:          'pr_improved_25',
    name:        'Leyenda 👑',
    category:    'prs',
    description: 'Superaste PRs en 25 ejercicios distintos',
    hint:        'Superá tu récord en 25 ejercicios distintos',
    check:       ctx => ctx.exercisesImproved >= 25,
    progress:    ctx => ({ current: ctx.exercisesImproved, target: 25 }),
  },
  {
    id:          'pr_double',
    name:        'Al doble 🚀',
    category:    'prs',
    description: 'Duplicaste tu primer registro en algún ejercicio',
    hint:        'Llegá al doble de tu primer peso en cualquier ejercicio',
    check:       ctx => ctx.prDoubleUnlocked,
    progress:    null,
  },

  // ── Volumen por sesión ────────────────────────────────────
  {
    id:          'session_vol_1k',
    name:        'Primera tonelada 💪',
    category:    'session_volume',
    description: '1.000 kg en una sola sesión',
    hint:        'Acumulá 1.000 kg de volumen en una sesión',
    check:       ctx => ctx.sessionVolume >= 1000,
    progress:    null,
  },
  {
    id:          'session_vol_3k',
    name:        'Bestia 🦁',
    category:    'session_volume',
    description: '3.000 kg en una sola sesión',
    hint:        'Acumulá 3.000 kg de volumen en una sesión',
    check:       ctx => ctx.sessionVolume >= 3000,
    progress:    null,
  },
  {
    id:          'session_vol_5k',
    name:        'Monstruo 🌋',
    category:    'session_volume',
    description: '5.000 kg en una sola sesión',
    hint:        'Acumulá 5.000 kg de volumen en una sesión',
    check:       ctx => ctx.sessionVolume >= 5000,
    progress:    null,
  },
  {
    id:          'session_vol_10k',
    name:        'Élite 👹',
    category:    'session_volume',
    description: '10.000 kg en una sola sesión',
    hint:        'Acumulá 10.000 kg de volumen en una sesión',
    check:       ctx => ctx.sessionVolume >= 10000,
    progress:    null,
  },
];

export const ACHIEVEMENT_CATEGORY_LABELS = {
  sessions:       'Consistencia',
  streak:         'Rachas',
  prs:            'Récords personales',
  session_volume: 'Volumen por sesión',
};
