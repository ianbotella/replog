/**
 * settings.js — Vista "Configuración"
 *
 * Secciones:
 *   1. Exportar backup (JSON completo / CSV solo sesiones)
 *   2. Importar backup (JSON de Replog)
 *   3. Zona de peligro (borrar todos los datos)
 */

import {
  exportAllData, importAllData, exportSessionsCSV,
  getProfile, saveProfile, addWeightEntry,
  getSettings, saveSettings,
} from '../store.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import {
  getInstallPrompt, isStandalone, triggerInstall,
  onInstallPromptChange, offInstallPromptChange,
} from '../pwa.js';

let _container = null;

// Callback para actualizar la sección de instalación cuando cambia el estado
let _installChangeHandler = null;

export const SettingsView = {
  render(container) {
    _container = container;
    _render();

    // Suscribirse a cambios del install prompt para actualizar la sección
    _installChangeHandler = () => _updateInstallSection();
    onInstallPromptChange(_installChangeHandler);
  },
  destroy() {
    if (_installChangeHandler) {
      offInstallPromptChange(_installChangeHandler);
      _installChangeHandler = null;
    }
  },
};

// ── Render ─────────────────────────────────────────────────

function _render() {
  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Datos, backup y privacidad</p>

      <!-- Perfil -->
      ${_profileSectionHTML()}

      <!-- Preferencias -->
      ${_preferencesSectionHTML()}

      <!-- Aviso de privacidad -->
      <div class="settings-notice">
        <i data-lucide="shield-check" style="width:16px;height:16px;flex-shrink:0;color:var(--accent-primary)"></i>
        <span>Todos tus datos se guardan <strong>localmente en este dispositivo</strong>. Replog no usa servidores ni requiere cuenta.</span>
      </div>

      <!-- Exportar -->
      <div class="section-header" style="margin-top:var(--space-5)">
        <span class="section-title">Exportar backup</span>
      </div>
      <div class="settings-card">
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">JSON completo</div>
            <div class="settings-item-sub">Sesiones, ejercicios, PRs y config. Reimportable.</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="export-json-btn">
            <i data-lucide="download"></i> JSON
          </button>
        </div>
        <div class="settings-item settings-item-border">
          <div class="settings-item-info">
            <div class="settings-item-title">CSV — solo historial</div>
            <div class="settings-item-sub">Para analizar en Excel o Google Sheets.</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="export-csv-btn">
            <i data-lucide="table-2"></i> CSV
          </button>
        </div>
      </div>

      <!-- Importar -->
      <div class="section-header" style="margin-top:var(--space-5)">
        <span class="section-title">Importar backup</span>
      </div>
      <div class="settings-card">
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Restaurar desde archivo</div>
            <div class="settings-item-sub">Seleccioná un archivo .json exportado desde Replog.</div>
          </div>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;gap:var(--space-2)">
            <i data-lucide="upload"></i> Elegir archivo
            <input type="file" id="import-file-input" accept=".json" style="display:none">
          </label>
        </div>
      </div>

      <!-- Zona de peligro -->
      <div class="section-header" style="margin-top:var(--space-5)">
        <span class="section-title" style="color:var(--danger)">Zona de peligro</span>
      </div>
      <div class="settings-card settings-card-danger">
        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-title">Borrar todos los datos</div>
            <div class="settings-item-sub">Elimina sesiones, ejercicios y PRs de forma permanente.</div>
          </div>
          <button class="btn btn-danger btn-sm" id="clear-data-btn">
            <i data-lucide="trash-2"></i> Borrar
          </button>
        </div>
      </div>

      <!-- Instalar app -->
      ${_installSectionHTML()}

      <p style="font-size:var(--text-xs);color:var(--text-tertiary);text-align:center;margin-top:var(--space-8)">
        Replog · Datos 100% locales · Sin cuenta
      </p>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ nodes: [_container] });
  _bindEvents();
}

// ── Events ─────────────────────────────────────────────────

function _bindEvents() {
  _container.querySelector('#weight-unit-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const unit = chip.dataset.unit;
    saveSettings({ weightUnit: unit });
    _container.querySelectorAll('#weight-unit-chips .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.unit === unit));
  });
  _container.querySelector('#save-profile-btn').addEventListener('click', _saveProfile);
  _container.querySelector('#profile-weight').addEventListener('input', _updateMetricsDisplay);
  _container.querySelector('#profile-height').addEventListener('input', _updateMetricsDisplay);
  _container.querySelector('#profile-birthyear').addEventListener('input', _updateMetricsDisplay);
  _container.querySelector('#export-json-btn').addEventListener('click', _exportJSON);
  _container.querySelector('#export-csv-btn').addEventListener('click',  _exportCSV);
  _container.querySelector('#import-file-input').addEventListener('change', _handleImportFile);
  _container.querySelector('#clear-data-btn').addEventListener('click',  _confirmClearData);

  const installBtn = _container.querySelector('#install-app-btn');
  if (installBtn) installBtn.addEventListener('click', _handleInstall);
}

// ── Preferences ────────────────────────────────────────────

function _preferencesSectionHTML() {
  const settings = getSettings();
  const unit = settings.weightUnit ?? 'kg';
  return `
    <div class="section-header" style="margin-top:var(--space-5)">
      <span class="section-title">Preferencias</span>
    </div>
    <div class="settings-card">
      <div class="settings-item">
        <div class="settings-item-info">
          <div class="settings-item-title">Unidad de peso</div>
          <div class="settings-item-sub">Unidad por defecto al registrar series</div>
        </div>
        <div class="chip-group" id="weight-unit-chips" style="flex-shrink:0">
          <button class="chip${unit === 'kg' ? ' active' : ''}" data-unit="kg">kg</button>
          <button class="chip${unit === 'lb' ? ' active' : ''}" data-unit="lb">lb</button>
        </div>
      </div>
    </div>
  `;
}

// ── Profile ────────────────────────────────────────────────

function _profileSectionHTML() {
  const p       = getProfile();
  const last    = p.weightHistory?.slice(-1)[0];
  const lastKg  = last?.weightKg ?? '';
  const lastDate = last?.date
    ? last.date.split('-').reverse().join('/')
    : null;

  return `
    <div class="section-header" style="margin-top:var(--space-2)">
      <span class="section-title">Perfil</span>
    </div>
    <div class="settings-card">
      <div class="settings-item">
        <div class="settings-item-info">
          <div class="settings-item-title">Género</div>
        </div>
        <select class="input-field input-sm" id="profile-gender" style="width:auto;min-width:120px">
          <option value=""       ${!p.gender                ? 'selected' : ''}>—</option>
          <option value="male"   ${p.gender === 'male'   ? 'selected' : ''}>Masculino</option>
          <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Femenino</option>
          <option value="other"  ${p.gender === 'other'  ? 'selected' : ''}>Otro</option>
        </select>
      </div>
      <div class="settings-item settings-item-border">
        <div class="settings-item-info">
          <div class="settings-item-title">Año de nacimiento</div>
        </div>
        <input type="number" id="profile-birthyear" class="input-field input-sm"
          value="${p.birthYear ?? ''}" placeholder="1990" min="1920" max="${new Date().getFullYear() - 10}"
          style="width:80px;text-align:center">
      </div>
      <div class="settings-item settings-item-border">
        <div class="settings-item-info">
          <div class="settings-item-title">Altura</div>
          <div class="settings-item-sub">En centímetros</div>
        </div>
        <input type="number" id="profile-height" class="input-field input-sm"
          value="${p.heightCm ?? ''}" placeholder="170" min="100" max="250"
          style="width:80px;text-align:center">
      </div>
      <div class="settings-item settings-item-border">
        <div class="settings-item-info">
          <div class="settings-item-title">Peso actual</div>
          <div class="settings-item-sub">${lastDate ? `Último registro: ${lastDate}` : 'Sin registros aún'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <input type="number" id="profile-weight" class="input-field input-sm"
            value="${lastKg}" placeholder="70" min="30" max="300" step="0.1"
            style="width:72px;text-align:center">
          <span style="font-size:var(--text-sm);color:var(--text-tertiary)">kg</span>
        </div>
      </div>

      <!-- Métricas calculadas -->
      <div id="profile-metrics" class="profile-metrics">
        ${_metricsHTML(p.heightCm, lastKg || null, p.birthYear)}
      </div>

      <div class="settings-item settings-item-border" style="justify-content:flex-end">
        <button class="btn btn-primary btn-sm" id="save-profile-btn">
          <i data-lucide="save"></i> Guardar perfil
        </button>
      </div>
    </div>
  `;
}

function _metricsHTML(heightCm, weightKg, birthYear) {
  const parts = [];

  if (heightCm && weightKg) {
    const hm  = heightCm / 100;
    const bmi = (weightKg / (hm * hm)).toFixed(1);
    const cat = bmi < 18.5 ? 'Bajo peso'
              : bmi < 25   ? 'Normal'
              : bmi < 30   ? 'Sobrepeso'
              :               'Obesidad';
    parts.push(`<div class="profile-metric"><span class="profile-metric-value">${bmi}</span><span class="profile-metric-label">IMC · ${cat}</span></div>`);
  }

  if (birthYear) {
    const age = new Date().getFullYear() - parseInt(birthYear);
    if (age > 0 && age < 120) {
      parts.push(`<div class="profile-metric"><span class="profile-metric-value">${age}</span><span class="profile-metric-label">Años</span></div>`);
    }
  }

  return parts.length
    ? `<div class="profile-metrics-row">${parts.join('')}</div>`
    : '';
}

function _updateMetricsDisplay() {
  const heightCm  = parseFloat(_container.querySelector('#profile-height')?.value) || null;
  const weightKg  = parseFloat(_container.querySelector('#profile-weight')?.value) || null;
  const birthYear = _container.querySelector('#profile-birthyear')?.value || null;
  const el = _container.querySelector('#profile-metrics');
  if (el) el.innerHTML = _metricsHTML(heightCm, weightKg, birthYear);
}

function _saveProfile() {
  const gender    = _container.querySelector('#profile-gender')?.value || null;
  const birthYear = parseInt(_container.querySelector('#profile-birthyear')?.value) || null;
  const heightCm  = parseFloat(_container.querySelector('#profile-height')?.value) || null;
  const weightKg  = parseFloat(_container.querySelector('#profile-weight')?.value) || null;

  saveProfile({ gender, birthYear, heightCm });

  if (weightKg && weightKg > 0) {
    addWeightEntry(weightKg);
    // Actualizar la sub-línea del campo peso con la nueva fecha
    const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const sub = _container.querySelector('#profile-weight')?.closest('.settings-item')?.querySelector('.settings-item-sub');
    if (sub) sub.textContent = `Último registro: ${today}`;
  }

  showToast('Perfil guardado correctamente.', 'success');
}

// ── Export ─────────────────────────────────────────────────

function _exportJSON() {
  const data = exportAllData();
  const date = new Date().toISOString().slice(0, 10);
  _downloadFile(`replog-backup-${date}.json`, JSON.stringify(data, null, 2), 'application/json');
  showToast('Backup JSON descargado.', 'success');
}

function _exportCSV() {
  const csv  = exportSessionsCSV();
  const date = new Date().toISOString().slice(0, 10);
  _downloadFile(`replog-sesiones-${date}.csv`, csv, 'text/csv;charset=utf-8;');
  showToast('Archivo CSV descargado.', 'success');
}

function _downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import ─────────────────────────────────────────────────

function _handleImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = ''; // reset so same file can be picked again

  const reader = new FileReader();
  reader.onload = evt => {
    let data;
    try {
      data = JSON.parse(evt.target.result);
    } catch {
      showToast('El archivo no es un JSON válido.', 'danger');
      return;
    }
    _validateAndConfirmImport(data);
  };
  reader.readAsText(file);
}

function _validateAndConfirmImport(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.sessions)) {
    showToast('El archivo no tiene el formato correcto de Replog.', 'danger');
    return;
  }

  const sessionCount  = data.sessions.length;
  const exerciseCount = Array.isArray(data.exercises) ? data.exercises.length : 0;
  const prCount       = Object.keys(data.prs ?? {}).length;
  const exportedAt    = data.exportedAt
    ? new Date(data.exportedAt).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'fecha desconocida';

  openModal({
    title: 'Importar backup',
    body: `
      <p style="color:var(--text-secondary);margin-bottom:var(--space-4)">
        Se encontró un backup del <strong>${exportedAt}</strong> con:
      </p>
      <div class="stats-grid" style="margin-bottom:var(--space-5)">
        <div class="stat-card">
          <div class="stat-value">${sessionCount}</div>
          <div class="stat-label">Sesiones</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${exerciseCount}</div>
          <div class="stat-label">Ejercicios</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${prCount}</div>
          <div class="stat-label">PRs</div>
        </div>
      </div>
      <div class="settings-notice settings-notice-danger">
        <i data-lucide="alert-triangle" style="width:16px;height:16px;flex-shrink:0"></i>
        <span>Esto reemplazará <strong>todos los datos actuales</strong>. Esta acción no se puede deshacer.</span>
      </div>
    `,
    footer: `
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="import-cancel-btn" style="flex:1">Cancelar</button>
        <button class="btn btn-primary" id="import-confirm-btn" style="flex:2">
          <i data-lucide="upload"></i> Importar y recargar
        </button>
      </div>
    `,
  });

  // Events are bound after openModal renders into the DOM
  document.getElementById('import-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('import-confirm-btn').addEventListener('click', () => {
    try {
      importAllData(data);
      showToast('Datos importados. Recargando...', 'success');
      setTimeout(() => window.location.reload(), 1100);
    } catch (err) {
      showToast(`Error al importar: ${err.message}`, 'danger');
    }
    closeModal();
  });

  if (window.lucide) {
    window.lucide.createIcons({ nodes: [document.getElementById('modal-container')] });
  }
}

// ── Install PWA ────────────────────────────────────────────

function _installSectionHTML() {
  // No mostrar si ya está instalada como standalone
  if (isStandalone()) return '';

  const prompt = getInstallPrompt();

  return `
    <div class="section-header" style="margin-top:var(--space-5)">
      <span class="section-title">Instalar app</span>
    </div>
    <div class="settings-card install-section" id="install-section">
      <div class="settings-item">
        <div class="settings-item-info">
          <div class="settings-item-title">Agregar a la pantalla de inicio</div>
          <div class="settings-item-sub">Accedé a Replog como una app nativa, sin abrir el navegador.</div>
        </div>
        ${prompt
          ? `<button class="btn btn-primary btn-sm" id="install-app-btn">
               <i data-lucide="download"></i> Instalar
             </button>`
          : `<span class="install-unavailable">Usá el menú del navegador</span>`
        }
      </div>
    </div>
  `;
}

/** Actualiza solo la sección de instalación cuando cambia el estado del prompt. */
function _updateInstallSection() {
  if (!_container) return;
  const section = _container.querySelector('.install-section');
  if (!section) return;

  const prompt = getInstallPrompt();
  const btn = section.querySelector('#install-app-btn');

  if (prompt && !btn) {
    // El prompt apareció después del render inicial — reemplazar texto por botón
    const info = section.querySelector('.settings-item');
    if (info) {
      const span = info.querySelector('.install-unavailable');
      if (span) {
        const newBtn = document.createElement('button');
        newBtn.className = 'btn btn-primary btn-sm';
        newBtn.id = 'install-app-btn';
        newBtn.innerHTML = '<i data-lucide="download"></i> Instalar';
        newBtn.addEventListener('click', _handleInstall);
        span.replaceWith(newBtn);
        if (window.lucide) window.lucide.createIcons({ nodes: [newBtn] });
      }
    }
  } else if (!prompt && btn) {
    // Prompt consumido (instalado) — ocultar sección
    const sectionWrapper = _container.querySelector('#install-section')?.closest('.settings-card');
    const header = sectionWrapper?.previousElementSibling;
    sectionWrapper?.remove();
    if (header?.classList.contains('section-header')) header.remove();
  }
}

async function _handleInstall() {
  const accepted = await triggerInstall();
  if (accepted) {
    showToast('¡Replog instalada correctamente!', 'success');
  }
}

// ── Clear all data ──────────────────────────────────────────

function _confirmClearData() {
  openModal({
    title: 'Borrar todos los datos',
    body: `
      <div class="settings-notice settings-notice-danger">
        <i data-lucide="alert-triangle" style="width:16px;height:16px;flex-shrink:0"></i>
        <span>Se eliminarán permanentemente todas tus sesiones, ejercicios custom y PRs. <strong>No se puede deshacer.</strong> El tema y la configuración se conservarán.</span>
      </div>
    `,
    footer: `
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="clear-cancel-btn" style="flex:1">Cancelar</button>
        <button class="btn btn-danger" id="clear-confirm-btn" style="flex:2">
          <i data-lucide="trash-2"></i> Sí, borrar todo
        </button>
      </div>
    `,
  });

  document.getElementById('clear-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('clear-confirm-btn').addEventListener('click', () => {
    localStorage.removeItem('replog_sessions');
    localStorage.removeItem('replog_exercises');
    localStorage.removeItem('replog_prs');
    showToast('Todos los datos fueron eliminados.', 'info');
    closeModal();
    setTimeout(() => window.location.reload(), 800);
  });

  if (window.lucide) {
    window.lucide.createIcons({ nodes: [document.getElementById('modal-container')] });
  }
}
