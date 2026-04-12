# Replog

**Replog** es una aplicación web progresiva (PWA) para registrar y analizar entrenamientos de gimnasio. Instalable en la pantalla de inicio de cualquier dispositivo, funciona completamente offline, sin backend y sin dependencias de build.

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
- **Compartir sesión** desde el footer de la sesión activa (ver más abajo)
- Notas libres y duración automática al finalizar

### Historial
- Todas las sesiones ordenadas por fecha, agrupadas por mes
- Cada tarjeta muestra grupo muscular, volumen total, duración y resumen por ejercicio
- Badge **🏆 PR** en los ejercicios donde se estableció un récord personal
- Valores de RPE / RIR registrados visibles en el resumen de series
- Botón **Compartir** en cada tarjeta para enviar el resumen de la sesión
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
    │   └── routineTemplates.js
    ├── views/
    │   ├── today.js       # Sesión activa (timer, supersets, RPE, last ref, share)
    │   ├── history.js     # Historial de sesiones (share, PR badge)
    │   ├── progress.js    # Análisis: ejercicio, grupos, PRs, estadísticas
    │   ├── exercises.js   # Biblioteca de ejercicios
    │   └── settings.js    # Exportar / importar / borrar datos / instalar app
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

Replog incluye un **Service Worker** con estrategia Cache First. En la primera carga, todos los assets se pre-cachean — incluyendo los scripts de Chart.js y Lucide desde CDN. A partir de entonces, la app funciona **completamente sin conexión**: no se necesita internet para registrar sesiones, ver el historial ni consultar el progreso.

Para forzar una actualización tras un nuevo deploy, basta con incrementar `CACHE_NAME` en `sw.js` (ej: `replog-v1` → `replog-v2`).

---

## Capturas

> *La app cuenta con tema oscuro y claro, bottom navigation con 5 tabs, tarjetas de sesión expandibles, gráficos de línea y barras, overlay de temporizador de descanso, lista de récords personales y pantalla de configuración con backup.*

---

## Licencia

MIT — libre para uso personal y educativo.
