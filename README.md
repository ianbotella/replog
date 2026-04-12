# Replog

**Replog** es una aplicación web progresiva para registrar y analizar entrenamientos de gimnasio. Diseñada para correr directamente en el navegador, sin instalación, sin backend y sin dependencias de build.

---

## Características principales

### Hoy — Registro de sesión activa
- Iniciá una sesión libre o desde una **rutina predefinida** (Pecho + Tríceps, Espalda + Bíceps, Hombros + Piernas)
- Agregá ejercicios de fuerza, cardio, movilidad o estiramiento desde una biblioteca de más de 50 ejercicios
- Creá tus propios ejercicios custom con grupo muscular, categoría y tipo
- Registrá series con peso y repeticiones por ejercicio
- **Temporizador de descanso** entre series (60 / 90 / 120 s) con cuenta regresiva flotante, vibración y beep de audio al llegar a cero
- **Supersets / Circuitos**: agrupá ejercicios visualmente; el timer solo dispara al terminar el último del grupo
- **RPE / RIR opcional por serie**: toggle por ejercicio para registrar esfuerzo percibido o repeticiones en reserva
- **Referencia de última sesión** inline por ejercicio ("Última: 3 × 10 @ 60 kg") para saber exactamente cuánto levantaste la vez anterior
- Notas libres y duración automática al finalizar

### Historial
- Todas las sesiones ordenadas por fecha, agrupadas por mes
- Cada tarjeta muestra grupo muscular, volumen total, duración y resumen por ejercicio
- Badge **🏆 PR** en los ejercicios donde se estableció un récord personal
- Valores de RPE / RIR registrados visibles en el resumen de series
- Eliminar sesiones individualmente

### Progreso — 4 vistas analíticas

#### Ejercicio
- Selector de ejercicio con búsqueda instantánea
- Gráfico de línea con toggle **Peso máximo / Volumen total** por sesión
- El gráfico de volumen usa color azul para distinguirse del verde de peso
- Tabla de últimas 10 sesiones con fecha, máximo kg, series y reps

#### Grupos musculares
- Gráfico de barras de sesiones por grupo muscular (Pecho, Espalda, Hombros)
- Selector de período: última semana / último mes / últimos 3 meses
- Barras horizontales con porcentaje relativo para detectar desequilibrios de entrenamiento visualmente

#### Récords personales
- Lista completa de PRs por ejercicio, ordenada por peso descendente
- Fecha en que se estableció cada récord
- Se actualiza automáticamente al finalizar cada sesión

#### Estadísticas
- Selector de período: semana / mes / 3 meses / todo
- Promedio de sesiones por semana en el período
- Racha actual (días consecutivos con al menos una sesión)
- Racha máxima histórica
- Días de la semana más frecuentes ("Entrenás más los martes y jueves")
- Mini gráfico de barras con distribución por día (Dom → Sáb)

### Biblioteca de ejercicios
- Ejercicios agrupados por categoría muscular con filtros
- Creá y eliminá ejercicios custom persistidos en localStorage
- Soporte para tipos: Fuerza, Cardio, Movilidad, Estiramiento

---

## Déteccion de récords personales

Al finalizar cada sesión, Replog compara automáticamente los pesos registrados contra los PRs almacenados. Si se supera un récord, se muestra un toast de celebración por cada ejercicio:

> 🏆 Nuevo PR: Press de Banca — 85 kg

Los PRs se actualizan en localStorage y aparecen marcados en el historial.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Lenguaje | JavaScript con ES Modules (vanilla, sin build) |
| Gráficos | [Chart.js 4](https://www.chartjs.org/) vía CDN |
| Iconos | [Lucide Icons](https://lucide.dev/) vía CDN |
| Almacenamiento | `localStorage` (sin servidor, sin cuenta) |
| Navegación | SPA con hash router (`#/today`, `#/history`, `#/progress`, `#/exercises`) |
| Estilos | CSS puro con custom properties (design tokens) |
| Deploy | GitHub Pages (rama main, raíz) |

**Sin frameworks. Sin bundler. Sin backend. Sin dependencias de npm.**

---

## Arquitectura

```
replog/
├── index.html
├── css/
│   ├── variables.css      # Design tokens (colores, tipografía, espaciado)
│   ├── reset.css
│   ├── layout.css         # Shell, header, bottom nav
│   ├── components.css     # Botones, inputs, badges, toasts, modales
│   └── views.css          # Estilos específicos por vista
└── js/
    ├── app.js             # Entry point, router init, tema
    ├── router.js          # Hash router
    ├── store.js           # CRUD de localStorage + utils de fecha + PRs
    ├── data/
    │   ├── exercises.js       # Definición de grupos musculares
    │   ├── freeExerciseDb.js  # Biblioteca de ejercicios externos
    │   └── routineTemplates.js
    ├── views/
    │   ├── today.js       # Sesión activa (timer, supersets, RPE, last ref)
    │   ├── history.js     # Historial de sesiones
    │   ├── progress.js    # Análisis: ejercicio, grupos, PRs, estadísticas
    │   └── exercises.js   # Biblioteca de ejercicios
    └── components/
        ├── modal.js       # Bottom sheet
        └── toast.js       # Notificaciones
```

### Persistencia en localStorage

| Clave | Contenido |
|---|---|
| `replog_sessions` | Array de sesiones con ejercicios y series |
| `replog_exercises` | Ejercicios custom creados por el usuario |
| `replog_settings` | Tema (dark/light), duración del timer de descanso |
| `replog_prs` | Récords personales por ejercicio |

---

## Temas

Replog incluye tema **oscuro** (por defecto) y **claro**, persistido en localStorage. El toggle está en el header con un ícono de sol/luna.

Los colores de grupos musculares son consistentes en toda la app:
- **Pecho + Tríceps** — naranja
- **Espalda + Bíceps** — azul
- **Hombros + Piernas** — púrpura

---

## Deploy en GitHub Pages

1. Pusheá la rama `main` al repositorio
2. Ir a **Settings → Pages → Branch: main / (root)**
3. La app queda disponible en `https://<usuario>.github.io/replog`

No requiere CI, build step ni variables de entorno.

---

## Uso offline

Al no requerir backend, Replog funciona sin conexión a internet una vez cargado en el navegador (los CDN de Chart.js y Lucide solo se necesitan en la primera carga). Todos los datos quedan en el dispositivo del usuario.

---

## Capturas

> *La app cuenta con tema oscuro y claro, bottom navigation, tarjetas de sesión expandibles, gráficos de línea y barras, overlay de temporizador de descanso y lista de récords personales.*

---

## Licencia

MIT — libre para uso personal y educativo.
