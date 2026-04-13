/**
 * achievements.js — Definiciones de todos los logros de Replog.
 *
 * Cada logro tiene:
 *   id          string  — identificador único (guardado en localStorage)
 *   name        string  — nombre con emoji mostrado en UI
 *   category    string  — 'streak' | 'prs' | 'volume' | 'sessions'
 *   description string  — frase corta cuando está desbloqueado
 *   hint        string  — condición a cumplir cuando está bloqueado
 *   check(ctx)  fn      — true si se cumple la condición
 *   progress(ctx) fn    — { current, target } para barra de progreso numérica
 *
 * ctx = { sessionCount, prCount, totalVolume, currentStreak, maxStreak }
 */

export const ACHIEVEMENT_DEFS = [
  // ── Consistencia ─────────────────────────────────────────────
  {
    id:          'first_session',
    name:        'Primera sesión ✅',
    category:    'sessions',
    description: 'Registraste tu primera sesión',
    hint:        'Completá tu primera sesión',
    check:       ctx => ctx.sessionCount >= 1,
    progress:    ctx => ({ current: Math.min(ctx.sessionCount, 1), target: 1 }),
  },
  {
    id:          'sessions_10',
    name:        'Comprometido 🎯',
    category:    'sessions',
    description: '10 sesiones completadas',
    hint:        'Completá 10 sesiones',
    check:       ctx => ctx.sessionCount >= 10,
    progress:    ctx => ({ current: ctx.sessionCount, target: 10 }),
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

  // ── Rachas ───────────────────────────────────────────────────
  {
    id:          'streak_3',
    name:        'En racha 🔥',
    category:    'streak',
    description: '3 días consecutivos con sesión',
    hint:        'Completá 3 días seguidos',
    check:       ctx => ctx.currentStreak >= 3 || ctx.maxStreak >= 3,
    progress:    ctx => ({ current: Math.min(Math.max(ctx.currentStreak, ctx.maxStreak), 3), target: 3 }),
  },
  {
    id:          'streak_7',
    name:        'Semana perfecta ⚡',
    category:    'streak',
    description: '7 días consecutivos',
    hint:        'Completá 7 días seguidos',
    check:       ctx => ctx.currentStreak >= 7 || ctx.maxStreak >= 7,
    progress:    ctx => ({ current: Math.min(Math.max(ctx.currentStreak, ctx.maxStreak), 7), target: 7 }),
  },
  {
    id:          'streak_30',
    name:        'Mes de hierro 🏅',
    category:    'streak',
    description: '30 días consecutivos',
    hint:        'Completá 30 días seguidos',
    check:       ctx => ctx.currentStreak >= 30 || ctx.maxStreak >= 30,
    progress:    ctx => ({ current: Math.min(Math.max(ctx.currentStreak, ctx.maxStreak), 30), target: 30 }),
  },

  // ── Récords personales ────────────────────────────────────────
  {
    id:          'first_pr',
    name:        'Primer récord 🏆',
    category:    'prs',
    description: 'Primer PR registrado',
    hint:        'Registrá tu primer récord en un ejercicio de fuerza',
    check:       ctx => ctx.prCount >= 1,
    progress:    ctx => ({ current: Math.min(ctx.prCount, 1), target: 1 }),
  },
  {
    id:          'pr_10',
    name:        'Máquina de PRs 💥',
    category:    'prs',
    description: '10 PRs distintos registrados',
    hint:        'Registrá 10 PRs en ejercicios diferentes',
    check:       ctx => ctx.prCount >= 10,
    progress:    ctx => ({ current: ctx.prCount, target: 10 }),
  },
  {
    id:          'pr_25',
    name:        'Leyenda del gym 👑',
    category:    'prs',
    description: '25 PRs distintos registrados',
    hint:        'Registrá 25 PRs en ejercicios diferentes',
    check:       ctx => ctx.prCount >= 25,
    progress:    ctx => ({ current: ctx.prCount, target: 25 }),
  },

  // ── Volumen acumulado ─────────────────────────────────────────
  {
    id:          'volume_1k',
    name:        'Primera tonelada 💪',
    category:    'volume',
    description: '1.000 kg acumulados en total',
    hint:        'Acumulá 1.000 kg de volumen en total',
    check:       ctx => ctx.totalVolume >= 1000,
    progress:    ctx => ({ current: ctx.totalVolume, target: 1000 }),
  },
  {
    id:          'volume_10k',
    name:        '10.000 kg 🚀',
    category:    'volume',
    description: '10.000 kg acumulados en total',
    hint:        'Acumulá 10.000 kg de volumen en total',
    check:       ctx => ctx.totalVolume >= 10000,
    progress:    ctx => ({ current: ctx.totalVolume, target: 10000 }),
  },
  {
    id:          'volume_100k',
    name:        '100.000 kg 🌋',
    category:    'volume',
    description: '100.000 kg acumulados en total',
    hint:        'Acumulá 100.000 kg de volumen en total',
    check:       ctx => ctx.totalVolume >= 100000,
    progress:    ctx => ({ current: ctx.totalVolume, target: 100000 }),
  },
];

export const ACHIEVEMENT_CATEGORY_LABELS = {
  sessions: 'Consistencia',
  streak:   'Rachas',
  prs:      'Récords personales',
  volume:   'Volumen acumulado',
};
