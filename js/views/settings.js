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
} from '../store.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let _container = null;

export const SettingsView = {
  render(container) {
    _container = container;
    _render();
  },
  destroy() {},
};

// ── Render ─────────────────────────────────────────────────

function _render() {
  _container.innerHTML = `
    <div class="view">
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Datos, backup y privacidad</p>

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
  _container.querySelector('#export-json-btn').addEventListener('click', _exportJSON);
  _container.querySelector('#export-csv-btn').addEventListener('click',  _exportCSV);
  _container.querySelector('#import-file-input').addEventListener('change', _handleImportFile);
  _container.querySelector('#clear-data-btn').addEventListener('click',  _confirmClearData);
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
