/**
 * router.js — Hash-based SPA router
 *
 * Uso:
 *   router.register('today', TodayView)
 *   router.navigate('#/today')
 *   router.init()
 */

class Router {
  constructor() {
    /** @type {Map<string, {render: function, destroy?: function}>} */
    this._routes   = new Map();
    this._current  = null;
    this._container = null;
    this._navItems  = null;
  }

  /**
   * Registra una ruta con su objeto de vista.
   * @param {string} path  — ej: 'today'
   * @param {{ render: function, destroy?: function }} view
   */
  register(path, view) {
    this._routes.set(path, view);
    return this;
  }

  /**
   * Inicializa el router: escucha hashchange y renderiza la ruta actual.
   * @param {HTMLElement} container — elemento donde se inyecta la vista
   */
  init(container) {
    this._container = container;
    this._navItems  = document.querySelectorAll('#bottom-nav .nav-item');

    window.addEventListener('hashchange', () => this._handleRoute());
    this._handleRoute();
  }

  /** Navega a un hash dado. */
  navigate(hash) {
    window.location.hash = hash;
  }

  _handleRoute() {
    const hash = window.location.hash || '#/today';
    const path = hash.replace('#/', '').split('/')[0] || 'today';

    const view = this._routes.get(path);
    if (!view) {
      // Fallback a today
      this.navigate('#/today');
      return;
    }

    // Destruir vista anterior si tiene método destroy
    if (this._current?.destroy) {
      this._current.destroy();
    }

    // Limpiar contenedor
    this._container.innerHTML = '';

    // Marcar nav item activo
    this._navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === path);
    });

    // Renderizar nueva vista
    this._current = view;
    view.render(this._container);

    // Re-inicializar Lucide icons en la nueva vista
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Scroll al top
    this._container.scrollTop = 0;
  }
}

export const router = new Router();
