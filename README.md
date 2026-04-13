# Replog

**Replog** es una aplicación web progresiva (PWA) para registrar y analizar entrenamientos de gimnasio. Instalable en la pantalla de inicio de cualquier dispositivo, funciona completamente offline, sin backend y sin dependencias de build.

---

## Características principales

### Hoy — Registro de sesión activa
- Iniciá una sesión libre, desde una **rutina predefinida** o desde una **rutina personalizada**
- Si el día actual tiene una rutina asignada en el Plan Semanal, aparece un banner "Sugerida para hoy" con botón Iniciar
- Las rutinas personalizadas guardadas en Planificación aparecen en la sección "Mis rutinas" de la pantalla Hoy
- La tira semanal muestra el nombre corto de la rutina asignada en el plan debajo de cada día
- Todas las rutinas predefinidas siguen una **estructura fija**: caminata en cinta 30 min (pre) → calentamiento específico → ejercicios principales → estiramiento específico → caminata en cinta 30 min (post)
- Agregá ejercicios de fuerza, cardio, movilidad o estiramiento desde una biblioteca de más de 50 ejercicios
- Creá tus propios ejercicios custom con grupo muscular, categoría y tipo
- Registrá series con peso y repeticiones por ejercicio
- **Temporizador de descanso** entre series (60 / 90 / 120 s) con cuenta regresiva flotante, vibración y beep de audio al llegar a cero
- **Supersets / Circuitos**: agrupá ejercicios visualmente; el timer solo dispara al terminar el último del grupo
- **RPE / RIR opcional por serie**: toggle por ejercicio para registrar esfuerzo percibido o repeticiones en reserva
- **Referencia de última sesión** inline por ejercicio ("Última: 3 × 10 @ 60 kg") para saber exactamente cuánto levantaste la vez anterior
- **Compartir sesión** desde el footer de la sesión activa (ver más abajo)
- Notas libres y duración automática al finalizar

### Historial
- Todas las sesiones ordenadas por fecha, agrupadas por mes
- Cada tarjeta muestra grupo muscular, volumen total, duración y resumen por ejercicio
- Badge **🏆 PR** en los ejercicios donde se estableció un récord personal
- Valores de RPE / RIR registrados visibles en el resumen de series
- Botón **Compartir** en cada tarjeta para enviar el resumen de la sesión
- Eliminar sesiones individualmente

### Progreso — 5 vistas analíticas

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
- **Evolución de peso corporal** — gráfico de línea con el historial de peso registrado en el perfil (visible con 2+ entradas)

#### Logros
- Grilla de todos los logros posibles agrupados por categoría
- Desbloqueados: nombre, descripción y fecha de desbloqueo en color
- Bloqueados: en gris con la condición a cumplir como hint
- Barra de progreso en logros numéricos (ej: 34/50 sesiones)

### Biblioteca de ejercicios
- Ejercicios agrupados por categoría muscular con filtros
- Creá y eliminá ejercicios custom persistidos en localStorage
- Soporte para tipos: Fuerza, Cardio, Movilidad, Estiramiento

### Perfil y métricas personales

Completá tu perfil en **Config. → Perfil** para habilitar métricas avanzadas:

- **IMC** — calculado en tiempo real a partir del peso y la altura, con categoría textual (Bajo peso / Normal / Sobrepeso / Obesidad)
- **Edad** — derivada del año de nacimiento
- **Calorías quemadas estimadas** — al finalizar cada sesión, usando MET según tipo de ejercicio (Fuerza: 5.0 · Cardio: 7.5 · Movilidad/Estiramiento: 2.5) y duración; visible en el toast de cierre y en cada tarjeta del historial
- **1RM estimado (Epley)** — en la vista Ejercicio de Progreso, debajo del gráfico, muestra el mejor 1RM histórico calculado como `peso × (1 + reps / 30)`
- **Evolución de peso corporal** — gráfico de línea en Estadísticas si hay 2+ registros de peso
- **Notificación semanal** — si pasaron más de 7 días sin actualizar el peso, aparece una notificación con acceso directo al perfil (una vez por sesión de navegación)

### Sistema de logros

Replog desbloquea logros automáticamente al finalizar sesiones. Cada nuevo logro dispara un toast de celebración. Visualizalos en **Progreso → Logros**.

### Planificación — Rutinas personalizadas y plan semanal

#### Mis Rutinas
- Visualizá las 5 rutinas predefinidas (no editables, marcadas con badge "Predefinida")
- Creá rutinas personalizadas: nombre, grupo muscular, lista de ejercicios con series y valores sugeridos
- Editá, duplicá o eliminá cualquier rutina personalizada
- Reordenás ejercicios con botones ↑↓ dentro del editor
- Series sugeridas editables por ejercicio (peso + reps para fuerza; minutos para cardio; segundos para movilidad/estiramiento)

#### Plan Semanal
- Asigná una rutina (predefinida o personalizada) a cada día de la semana (Lunes → Domingo)
- Cada día muestra la rutina asignada con su badge de grupo muscular
- Indicador de adherencia: ✅ Entrenado · ⏳ Pendiente · neutral sin rutina
- La asignación se cruza contra las sesiones registradas en la semana actual
- Cambiá o quitá la rutina de cualquier día en un tap

### Instalación como app nativa

Replog es una PWA instalable. Una vez instalada, aparece en la pantalla de inicio y se abre sin barra de navegador.

- **Android (Chrome)**: aparece un banner automático o usá el menú ⋮ → "Agregar a pantalla de inicio". También podés ir a **Config. → Instalar app** desde dentro de la app.
- **iOS (Safari)**: tocá el botón Compartir → "Agregar a pantalla de inicio".
- **Desktop (Chrome / Edge)**: hacé clic en el ícono de instalación en la barra de direcciones, o usá el menú → "Instalar Replog".

### Configuración — Datos y backup
- **Exportar JSON**: backup completo y reimportable (sesiones, ejercicios, PRs, config)
- **Exportar CSV**: solo el historial de sesiones, para analizar en Excel o Sheets
- **Importar**: restaurar un backup JSON con validación previa y confirmación
- **Borrar datos**: limpiar todo el historial desde la zona de peligro

---

---

## Perfil y métricas

### Datos del perfil (Config. → Perfil)

| Campo | Descripción |
|---|---|
| Género | Masculino / Femenino / Otro |
| Año de nacimiento | Para calcular la edad |
| Altura (cm) | Para el IMC |
| Peso actual (kg) | Se guarda como historial con fecha; no reemplaza el anterior |

### Métricas calculadas

| Métrica | Fórmula |
|---|---|
| IMC | `peso / (altura_m)²` → categoría textual |
| Edad | `año_actual − año_nacimiento` |
| Calorías (por sesión) | `MET × peso_kg × duración_horas` (MET: Fuerza 5.0 · Cardio 7.5 · Movilidad 2.5) |
| 1RM (Epley) | `peso × (1 + reps / 30)` — mejor set histórico de cada ejercicio |

---

## Logros

Los logros se evalúan automáticamente al finalizar cada sesión. Nunca se repiten.

### Consistencia
| Logro | Condición |
|---|---|
| Primera sesión ✅ | Completar la primera sesión |
| Comprometido 🎯 | 10 sesiones completadas |
| Veterano 🥋 | 50 sesiones completadas |
| Centenario 🎖️ | 100 sesiones completadas |

### Rachas
| Logro | Condición |
|---|---|
| En racha 🔥 | 3 días consecutivos con sesión |
| Semana perfecta ⚡ | 7 días consecutivos |
| Mes de hierro 🏅 | 30 días consecutivos |

### Récords personales
| Logro | Condición |
|---|---|
| Primer récord 🏆 | Primer PR registrado |
| Máquina de PRs 💥 | 10 PRs distintos |
| Leyenda del gym 👑 | 25 PRs distintos |

### Volumen acumulado
| Logro | Condición |
|---|---|
| Primera tonelada 💪 | 1.000 kg acumulados |
| 10.000 kg 🚀 | 10.000 kg acumulados |
| 100.000 kg 🌋 | 100.000 kg acumulados |

---

## Detección de récords personales

Al finalizar cada sesión, Replog compara automáticamente los pesos registrados contra los PRs almacenados. Si se supera un récord, se muestra un toast de celebración por cada ejercicio:

> 🏆 Nuevo PR: Press de Banca — 85 kg

Los PRs se actualizan en localStorage y aparecen marcados en el historial.

---

## Compartir una sesión

Desde cualquier tarjeta del historial (botón `share-2`) o desde el footer de la sesión activa, Replog genera un resumen en texto plano con este formato:

```
🏋️ Replog — Lunes 12 de abril

Grupo: Pecho + Tríceps
Duración: 48 min
Ejercicios: 4 | Series: 14 | Volumen: 5.200 kg

Press de Banca
  Serie 1: 80 kg × 10
  Serie 2: 80 kg × 8
  Serie 3: 75 kg × 6

Fondos en Paralelas
  Serie 1: 60 kg × 12

💪 Generado con Replog
```

- En **mobile** se abre el sheet nativo del sistema (`navigator.share`)
- En **desktop** el texto se copia automáticamente al portapapeles

---

## Datos y privacidad

**Todos los datos son 100% locales.** Replog no tiene servidor, no requiere cuenta y nunca envía información a internet.

### Exportar un backup

1. Ir a **Config.** en la barra de navegación inferior
2. Tocar **Exportar JSON** para descargar `replog-backup-YYYY-MM-DD.json`
3. Guardar el archivo en un lugar seguro (Drive, iCloud, pendrive)

El JSON incluye todas las sesiones, ejercicios custom, PRs y configuración.

### Restaurar un backup

1. Ir a **Config.** → **Elegir archivo**
2. Seleccionar el archivo `.json` exportado desde Replog
3. Revisar el resumen (cantidad de sesiones, ejercicios y PRs) en el modal de confirmación
4. Confirmar — la app se recargará con los datos restaurados

> **Atención:** la importación reemplaza todos los datos actuales. Exportá un backup antes si querés conservar los datos existentes.

### Exportar CSV para análisis

El CSV incluye una fila por sesión con: fecha, grupo muscular, duración, cantidad de ejercicios, series, volumen total y notas. Es compatible con Excel, Google Sheets y cualquier herramienta de análisis de datos.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Lenguaje | JavaScript con ES Modules (vanilla, sin build) |
| Gráficos | [Chart.js 4](https://www.chartjs.org/) vía CDN |
| Iconos | [Lucide Icons](https://lucide.dev/) vía CDN |
| Almacenamiento | `localStorage` (sin servidor, sin cuenta) |
| Navegación | SPA con hash router (`#/today`, `#/history`, `#/progress`, `#/exercises`, `#/settings`) |
| Estilos | CSS puro con custom properties (design tokens) |
| PWA | Service Worker (Cache First), Web App Manifest, instalable en homescreen |
| Deploy | GitHub Pages (rama main, raíz) |

**Sin frameworks. Sin bundler. Sin backend. Sin dependencias de npm.**

---

## Arquitectura

```
replog/
├── index.html
├── manifest.json          # Web App Manifest (PWA)
├── sw.js                  # Service Worker (Cache First, offline)
├── css/
│   ├── variables.css      # Design tokens (colores, tipografía, espaciado)
│   ├── reset.css
│   ├── layout.css         # Shell, header, bottom nav
│   ├── components.css     # Botones, inputs, badges, toasts, modales
│   └── views.css          # Estilos específicos por vista
├── assets/
│   ├── favicon.svg        # Favicon del navegador
│   └── icon.svg           # Ícono PWA (maskable, 512×512 viewBox)
└── js/
    ├── app.js             # Entry point, router init, tema, PWA init
    ├── router.js          # Hash router
    ├── store.js           # CRUD localStorage + backup + PRs + date utils
    ├── pwa.js             # SW registration + install prompt API
    ├── data/
    │   ├── exercises.js        # Definición de grupos musculares
    │   ├── freeExerciseDb.js   # Biblioteca de ejercicios externos
    │   ├── routineTemplates.js
    │   └── achievements.js     # Definiciones de logros (14 logros en 4 categorías)
    ├── views/
    │   ├── today.js       # Sesión activa (timer, supersets, RPE, last ref, share, plan)
    │   ├── history.js     # Historial de sesiones (share, PR badge)
    │   ├── progress.js    # Análisis: ejercicio, grupos, PRs, estadísticas
    │   ├── exercises.js   # Biblioteca de ejercicios
    │   ├── settings.js    # Exportar / importar / borrar datos / instalar app
    │   └── planning.js    # Rutinas personalizadas + plan semanal
    ├── utils/
    │   └── share.js       # Web Share API + clipboard fallback
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
| `replog_profile` | Perfil del usuario: género, año de nacimiento, altura, historial de peso |
| `replog_achievements` | Logros desbloqueados con fecha |
| `replog_routines` | Rutinas personalizadas creadas por el usuario (nombre, grupo muscular, ejercicios con series sugeridas) |
| `replog_plan` | Plan semanal: un routine id (predefinida o custom) o null por cada día (monday → sunday) |

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
4. **Incrementar `CACHE_NAME` en `sw.js`** en cada deploy (`replog-v2` → `replog-v3` → ...) para invalidar la caché vieja y activar la actualización automática en todos los dispositivos

No requiere CI, build step ni variables de entorno.

---

## Uso offline

Replog incluye un **Service Worker** con estrategia Cache First. En la primera carga, todos los assets se pre-cachean — incluyendo los scripts de Chart.js y Lucide desde CDN. A partir de entonces, la app funciona **completamente sin conexión**: no se necesita internet para registrar sesiones, ver el historial ni consultar el progreso.

### Actualizaciones automáticas

Al detectar una nueva versión (nuevo `CACHE_NAME` en `sw.js`), el flujo es completamente automático:

1. El SW nuevo se instala en segundo plano
2. Se activa inmediatamente gracias a `skipWaiting()` — sin necesidad de cerrar pestañas
3. Toma control de la página con `clients.claim()`
4. La app muestra un **toast "Nueva versión disponible 🎉"** con un botón **Actualizar**
5. Al hacer clic, se recarga la página ya con los archivos nuevos

No es necesario limpiar la caché del navegador ni hacer hard refresh manualmente.

---

## Capturas

> *La app cuenta con tema oscuro y claro, bottom navigation con 5 tabs, tarjetas de sesión expandibles, gráficos de línea y barras, overlay de temporizador de descanso, lista de récords personales y pantalla de configuración con backup.*

---

## Licencia

MIT — libre para uso personal y educativo.
