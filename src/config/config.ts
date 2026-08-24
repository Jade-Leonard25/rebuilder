// src/config/config.ts

/**
 * Rebuilder Enterprise Desktop Hash Router
 * 
 * Production-grade router engineered for Desktop (Electron) and offline SPAs.
 * Features:
 * - Desktop Suitability: Real 2-way hash sync, Electron IPC listener, Desktop link interception,
 *   Desktop keyboard shortcuts (Alt+Left/Right), Window title synchronization, and Scroll restoration.
 * - Memory Safety & Lifecycle: Scoped `LifecycleScope` with auto-cleaned timers, intervals,
 *   DOM listeners, and an `AbortSignal` for instant fetch cancellation on route leave.
 * - Enterprise Readiness: Role-Based Access Control (RBAC), Permission checks, `beforeLeave` unsaved
 *   changes guards, Nested routes & outlets, Error boundary / 500 crash catcher, `beforeEach` / `afterEach` telemetry hooks.
 */

import { eventManager } from '../system/event-manager';

// ============ LIFECYCLE & MEMORY SCOPE ============

export interface LifecycleScope {
  /** AbortSignal automatically triggered when navigating away from this view */
  readonly signal: AbortSignal;

  /** Register a custom teardown/cleanup callback */
  onCleanup: (fn: () => void) => void;

  /** Managed interval automatically cleared on route unmount */
  setInterval: (callback: () => void, ms: number) => number;

  /** Managed timeout automatically cleared on route unmount */
  setTimeout: (callback: () => void, ms: number) => number;

  /** Managed DOM/window event listener automatically removed on route unmount */
  addEventListener: (
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean
  ) => void;

  /** Manually dispose all registered resources */
  dispose: () => void;
}

export function createLifecycleScope(): LifecycleScope {
  const abortController = new AbortController();
  const cleanups = new Set<() => void>();
  const intervals = new Set<number>();
  const timeouts = new Set<number>();
  const listeners: Array<{
    target: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions | boolean;
  }> = [];

  const scope: LifecycleScope = {
    get signal() {
      return abortController.signal;
    },
    onCleanup(fn: () => void) {
      cleanups.add(fn);
    },
    setInterval(callback: () => void, ms: number): number {
      const id = window.setInterval(callback, ms);
      intervals.add(id);
      return id;
    },
    setTimeout(callback: () => void, ms: number): number {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        callback();
      }, ms);
      timeouts.add(id);
      return id;
    },
    addEventListener(target: EventTarget, event: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) {
      target.addEventListener(event, handler, options);
      listeners.push({ target, event, handler, options });
    },
    dispose() {
      try {
        abortController.abort();
      } catch { }

      intervals.forEach(id => clearInterval(id));
      intervals.clear();

      timeouts.forEach(id => clearTimeout(id));
      timeouts.clear();

      listeners.forEach(({ target, event, handler, options }) => {
        try {
          target.removeEventListener(event, handler, options);
        } catch { }
      });
      listeners.length = 0;

      cleanups.forEach(fn => {
        try {
          fn();
        } catch (err) {
          console.error('Route lifecycle cleanup error:', err);
        }
      });
      cleanups.clear();
    },
  };

  return scope;
}

// ============ ROUTER CONTEXT & TYPES ============

export interface RouteContext {
  path: string;
  fullPath: string;
  params: Record<string, string>;
  query: Record<string, string>;
  state?: any;
  scope: LifecycleScope;
  router: Navigation;
}

export type ViewComponent = (context: RouteContext) => HTMLElement | Promise<HTMLElement>;

export type AsyncViewComponent = () => Promise<{ default: ViewComponent } | ViewComponent>;

export interface RouteWindowConfig {
  title?: string;
  width?: number;
  height?: number;
  resizable?: boolean;
}

export interface RouteConfig {
  /** URL path pattern (e.g., '/', '/dashboard', '/users/:id') */
  path: string;

  /** Component function or dynamic import */
  component: ViewComponent | AsyncViewComponent;

  /** Document & Window title */
  title?: string;

  /** Whether route requires authentication */
  requireAuth?: boolean;

  /** Required roles for Role-Based Access Control (RBAC) */
  roles?: string[];

  /** Required permissions for fine-grained access control */
  permissions?: string[];

  /** Optional Electron window config for desktop adaptation */
  window?: RouteWindowConfig;

  /** Layout wrapper component */
  layout?: ViewComponent;

  /** Middleware chain executed before navigation */
  middleware?: ((context: RouteContext) => boolean | Promise<boolean>)[];

  /** Nested child routes */
  children?: RouteConfig[];

  /** Executed when navigating away. Return false or a string to block navigation (e.g. Unsaved changes) */
  beforeLeave?: (to: RouteContext, from: RouteContext) => boolean | string | Promise<boolean | string>;

  /** Executed after mounting to DOM */
  onMount?: (element: HTMLElement, context: RouteContext) => void | (() => void);

  /** Executed on unmount */
  onDestroy?: () => void;
}

export type NavigationGuard = (
  to: RouteContext,
  from: RouteContext | null
) => boolean | string | Promise<boolean | string>;

export type NavigationHook = (
  to: RouteContext,
  from: RouteContext | null
) => boolean | string | void | Promise<boolean | string | void>;

export interface NavigateOptions {
  params?: Record<string, string>;
  query?: Record<string, string>;
  state?: any;
  replace?: boolean;
  skipGuards?: boolean;
}

export interface NavigationConfig {
  /** Root container element to render views into */
  container: HTMLElement;

  /** Array of route definitions */
  routes: RouteConfig[];

  /** Global authentication checker */
  authChecker?: () => boolean | Promise<boolean>;

  /** Path to redirect unauthorized users to (default '/login') */
  authRedirectPath?: string;

  /** Global RBAC role checker */
  roleChecker?: (requiredRoles: string[]) => boolean | Promise<boolean>;

  /** Global permission checker */
  permissionChecker?: (requiredPermissions: string[]) => boolean | Promise<boolean>;

  /** Path to redirect forbidden users to (default '/403') */
  forbiddenRedirectPath?: string;

  /** Global navigation guards */
  guards?: NavigationGuard[];

  /** Global before navigation hook */
  beforeEach?: NavigationHook;

  /** Global after navigation hook (telemetry, breadcrumbs) */
  afterEach?: (to: RouteContext, from: RouteContext | null) => void;

  /** Global error handler */
  onError?: (error: Error, context: RouteContext) => void;

  /** Default layout wrapper for all views */
  defaultLayout?: ViewComponent;

  /** Custom 404 Not Found view */
  notFoundComponent?: ViewComponent;

  /** Custom 403 Forbidden view */
  forbiddenComponent?: ViewComponent;

  /** Custom 500 Error boundary view */
  errorComponent?: (error: Error, context: RouteContext) => HTMLElement;

  /** Loading placeholder for async views */
  loadingComponent?: ViewComponent;

  /** Intercept native desktop links and external URLs (default true) */
  enableDesktopLinks?: boolean;

  /** Enable desktop navigation shortcuts: Alt+Left / Alt+Right (default true) */
  enableDesktopShortcuts?: boolean;

  /** Restore window scroll position on back/forward (default true) */
  restoreScroll?: boolean;
}

// ============ FACTORY API ============

export function createNavigation(config: NavigationConfig): Navigation {
  const navigation = new Navigation();
  navigation.configure(config);
  return navigation;
}

// ============ NAVIGATION CLASS ============

export class Navigation {
  private container: HTMLElement | null = null;
  private routes: Map<string, RouteConfig> = new Map();
  private dynamicRoutes: Array<{ pattern: RegExp; paramNames: string[]; route: RouteConfig }> = [];

  private currentContext: RouteContext | null = null;
  private activeRoute: RouteConfig | null = null;
  private activeScope: LifecycleScope | null = null;
  private activeMountCleanup: (() => void) | null = null;

  private historyStack: Array<RouteContext> = [];
  private scrollPositions: Map<string, { x: number; y: number }> = new Map();

  private guards: NavigationGuard[] = [];
  private beforeEachHook: NavigationHook | null = null;
  private afterEachHook: ((to: RouteContext, from: RouteContext | null) => void) | null = null;
  private onErrorHook: ((error: Error, context: RouteContext) => void) | null = null;

  private authChecker: () => boolean | Promise<boolean> = () => true;
  private authRedirectPath: string = '/login';
  private roleChecker: (roles: string[]) => boolean | Promise<boolean> = () => true;
  private permissionChecker: (perms: string[]) => boolean | Promise<boolean> = () => true;
  private forbiddenRedirectPath: string = '/403';

  private defaultLayout: ViewComponent | null = null;
  private notFoundComponent: ViewComponent | null = null;
  private forbiddenComponent: ViewComponent | null = null;
  private errorComponent: ((error: Error, context: RouteContext) => HTMLElement) | null = null;
  private loadingComponent: ViewComponent | null = null;

  private isInternalNavigation = false;
  private isDestroyed = false;
  private restoreScroll = true;

  private handleHashChange = () => {
    if (this.isInternalNavigation || this.isDestroyed) return;
    const { path, query } = this.parseHash(window.location.hash);
    this.navigate(path, { query });
  };

  private handleLinkClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a') as HTMLAnchorElement | null;
    if (!anchor || anchor.target === '_blank' || event.defaultPrevented || event.button !== 0) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // External URLs -> open via electron or new tab
    if (/^https?:\/\//i.test(href)) {
      event.preventDefault();
      if ((window as any).electronAPI?.send) {
        (window as any).electronAPI.send('shell:openExternal', href);
      } else {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Relative Hash navigation
    if (href.startsWith('#') || href.startsWith('/')) {
      event.preventDefault();
      const cleanPath = href.replace(/^#+/, '');
      const { path, query } = this.parseHash(cleanPath);
      this.navigate(path, { query });
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    // Alt + Left Arrow -> Back
    if (event.altKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goBack();
    }
    // Alt + Right Arrow -> Forward
    if (event.altKey && event.key === 'ArrowRight') {
      event.preventDefault();
      window.history.forward();
    }
  };

  configure(config: NavigationConfig): void {
    this.container = config.container;
    this.restoreScroll = config.restoreScroll ?? true;

    this.routes.clear();
    this.dynamicRoutes = [];

    config.routes.forEach(route => this.registerRoute(route));

    if (config.authChecker) this.authChecker = config.authChecker;
    if (config.authRedirectPath) this.authRedirectPath = config.authRedirectPath;
    if (config.roleChecker) this.roleChecker = config.roleChecker;
    if (config.permissionChecker) this.permissionChecker = config.permissionChecker;
    if (config.forbiddenRedirectPath) this.forbiddenRedirectPath = config.forbiddenRedirectPath;

    if (config.guards) this.guards = [...config.guards];
    if (config.beforeEach) this.beforeEachHook = config.beforeEach;
    if (config.afterEach) this.afterEachHook = config.afterEach;
    if (config.onError) this.onErrorHook = config.onError;

    if (config.defaultLayout) this.defaultLayout = config.defaultLayout;
    if (config.notFoundComponent) this.notFoundComponent = config.notFoundComponent;
    if (config.forbiddenComponent) this.forbiddenComponent = config.forbiddenComponent;
    if (config.errorComponent) this.errorComponent = config.errorComponent;
    if (config.loadingComponent) this.loadingComponent = config.loadingComponent;

    // Attach Two-Way Hash Change Listener
    window.removeEventListener('hashchange', this.handleHashChange);
    window.addEventListener('hashchange', this.handleHashChange);

    // Desktop Link Interception
    if (config.enableDesktopLinks !== false) {
      document.removeEventListener('click', this.handleLinkClick);
      document.addEventListener('click', this.handleLinkClick);
    }

    // Desktop Keyboard Shortcuts
    if (config.enableDesktopShortcuts !== false) {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keydown', this.handleKeyDown);
    }

    // Electron IPC Navigation listener
    if ((window as any).electronAPI?.on) {
      (window as any).electronAPI.on('navigation:navigate', (targetPath: string) => {
        if (targetPath) this.navigate(targetPath);
      });
    }
  }

  registerRoute(route: RouteConfig, parentPath = ''): void {
    const fullPath = this.normalizePath(parentPath ? `${parentPath}/${route.path}` : route.path);

    if (fullPath.includes(':')) {
      const paramNames: string[] = [];
      const regexPattern = fullPath.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
      const pattern = new RegExp(`^${regexPattern}$`);
      this.dynamicRoutes.push({ pattern, paramNames, route: { ...route, path: fullPath } });
    } else {
      this.routes.set(fullPath, { ...route, path: fullPath });
    }

    if (route.children) {
      route.children.forEach(child => this.registerRoute(child, fullPath));
    }
  }

  addGuard(guard: NavigationGuard): void {
    this.guards.push(guard);
  }

  async navigate(toPath: string, options: NavigateOptions = {}): Promise<boolean> {
    const { params = {}, query = {}, state, replace = false, skipGuards = false } = options;
    const normalizedPath = this.normalizePath(toPath);

    const match = this.matchRoute(normalizedPath);

    if (!match) {
      const tempScope = createLifecycleScope();
      const notFoundCtx: RouteContext = {
        path: normalizedPath,
        fullPath: this.buildFullPath(normalizedPath, query),
        params,
        query,
        state,
        scope: tempScope,
        router: this,
      };
      this.renderNotFound(notFoundCtx);
      return false;
    }

    const { route, extractedParams } = match;
    const newScope = createLifecycleScope();
    const targetContext: RouteContext = {
      path: normalizedPath,
      fullPath: this.buildFullPath(normalizedPath, query),
      params: { ...extractedParams, ...params },
      query,
      state,
      scope: newScope,
      router: this,
    };

    // 1. Check `beforeLeave` on current active route (Unsaved changes guard)
    if (!skipGuards && this.activeRoute?.beforeLeave && this.currentContext) {
      const leaveResult = await this.activeRoute.beforeLeave(targetContext, this.currentContext);
      if (leaveResult === false) {
        newScope.dispose();
        return false;
      }
      if (typeof leaveResult === 'string' && leaveResult !== normalizedPath) {
        newScope.dispose();
        return this.navigate(leaveResult, { replace: true });
      }
    }

    if (!skipGuards) {
      // 2. Global `beforeEach` Hook
      if (this.beforeEachHook) {
        const hookResult = await this.beforeEachHook(targetContext, this.currentContext);
        if (hookResult === false) {
          newScope.dispose();
          return false;
        }
        if (typeof hookResult === 'string' && hookResult !== normalizedPath) {
          newScope.dispose();
          return this.navigate(hookResult, { replace: true });
        }
      }

      // 3. Route Middleware
      if (route.middleware) {
        for (const middleware of route.middleware) {
          const allowed = await middleware(targetContext);
          if (!allowed) {
            newScope.dispose();
            return false;
          }
        }
      }

      // 4. Global Navigation Guards
      for (const guard of this.guards) {
        const guardResult = await guard(targetContext, this.currentContext);
        if (guardResult === false) {
          newScope.dispose();
          return false;
        }
        if (typeof guardResult === 'string' && guardResult !== normalizedPath) {
          newScope.dispose();
          return this.navigate(guardResult, { replace: true });
        }
      }

      // 5. Authentication Verification
      if (route.requireAuth) {
        const authed = await this.authChecker();
        if (!authed) {
          newScope.dispose();
          if (normalizedPath !== this.authRedirectPath) {
            return this.navigate(this.authRedirectPath, {
              replace: true,
              state: { returnTo: targetContext.fullPath },
            });
          }
          return false;
        }
      }

      // 6. Role-Based Access Control (RBAC) Verification
      if (route.roles && route.roles.length > 0) {
        const hasRole = await this.roleChecker(route.roles);
        if (!hasRole) {
          newScope.dispose();
          this.renderForbidden(targetContext);
          return false;
        }
      }

      // 7. Permission Verification
      if (route.permissions && route.permissions.length > 0) {
        const hasPermission = await this.permissionChecker(route.permissions);
        if (!hasPermission) {
          newScope.dispose();
          this.renderForbidden(targetContext);
          return false;
        }
      }
    }

    // Save scroll position for outgoing route
    if (this.restoreScroll && this.currentContext) {
      this.scrollPositions.set(this.currentContext.path, {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
      });
    }

    // Cleanup active route resources and listeners
    this.cleanupActiveRoute();

    const previousContext = this.currentContext;

    // History tracking
    if (!replace && this.currentContext) {
      this.historyStack.push(this.currentContext);
    }

    this.currentContext = targetContext;
    this.activeRoute = route;
    this.activeScope = newScope;

    // Hash sync
    this.syncHash(targetContext, replace);

    // Desktop Window Title sync
    const pageTitle = route.window?.title || route.title;
    if (pageTitle) {
      document.title = pageTitle;
    }

    // Render View with Error Boundary
    try {
      await this.renderView(route, targetContext);

      // Restore scroll
      if (this.restoreScroll) {
        const savedScroll = this.scrollPositions.get(normalizedPath);
        if (savedScroll) {
          window.scrollTo(savedScroll.x, savedScroll.y);
        } else {
          window.scrollTo(0, 0);
        }
      }

      // Global `afterEach` Hook
      if (this.afterEachHook) {
        this.afterEachHook(targetContext, previousContext);
      }

      return true;
    } catch (err: any) {
      console.error(`Render error on route "${normalizedPath}":`, err);
      if (this.onErrorHook) {
        this.onErrorHook(err, targetContext);
      }
      this.renderError(err, targetContext);
      return false;
    }
  }

  private matchRoute(path: string): { route: RouteConfig; extractedParams: Record<string, string> } | null {
    const exact = this.routes.get(path);
    if (exact) {
      return { route: exact, extractedParams: {} };
    }

    for (const item of this.dynamicRoutes) {
      const match = path.match(item.pattern);
      if (match) {
        const extractedParams: Record<string, string> = {};
        item.paramNames.forEach((name, idx) => {
          extractedParams[name] = decodeURIComponent(match[idx + 1]);
        });
        return { route: item.route, extractedParams };
      }
    }

    return null;
  }

  private async renderView(route: RouteConfig, context: RouteContext): Promise<void> {
    if (!this.container) return;

    if (this.loadingComponent) {
      this.container.innerHTML = '';
      const loadingEl = this.loadingComponent(context);
      this.container.appendChild(loadingEl instanceof Promise ? await loadingEl : loadingEl);
    }

    let componentFn: ViewComponent;
    if (this.isAsyncComponent(route.component)) {
      const resolved = await (route.component as AsyncViewComponent)();
      componentFn = (typeof resolved === 'object' && 'default' in resolved)
        ? resolved.default
        : (resolved as ViewComponent);
    } else {
      componentFn = route.component as ViewComponent;
    }

    const rawContent = componentFn(context);
    const content = rawContent instanceof Promise ? await rawContent : rawContent;

    const layout = route.layout || this.defaultLayout;
    let finalElement: HTMLElement = content;
    if (layout) {
      const wrapped = layout({ ...context, state: { ...(context.state || {}), children: content } });
      finalElement = wrapped instanceof Promise ? await wrapped : wrapped;
    }

    this.container.innerHTML = '';
    this.container.appendChild(finalElement);

    if (route.onMount) {
      const cleanup = route.onMount(finalElement, context);
      if (typeof cleanup === 'function') {
        this.activeMountCleanup = cleanup;
      }
    }
  }

  private renderNotFound(context: RouteContext): void {
    if (!this.container) return;
    this.cleanupActiveRoute();
    this.currentContext = context;

    this.container.innerHTML = '';
    if (this.notFoundComponent) {
      const el = this.notFoundComponent(context);
      if (el instanceof HTMLElement) {
        this.container.appendChild(el);
      }
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'min-h-screen flex flex-col items-center justify-center p-6 space-y-4 bg-gray-50';
      fallback.innerHTML = `
        <h1 class="text-4xl font-extrabold text-red-600">404 - Page Not Found</h1>
        <p class="text-gray-600">The route <code>${context.path}</code> does not exist.</p>
        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" onclick="window.location.hash='#/'">Return to Home</button>
      `;
      this.container.appendChild(fallback);
    }
  }

  private renderForbidden(context: RouteContext): void {
    if (!this.container) return;
    this.cleanupActiveRoute();
    this.currentContext = context;

    this.container.innerHTML = '';
    if (this.forbiddenComponent) {
      const el = this.forbiddenComponent(context);
      if (el instanceof HTMLElement) {
        this.container.appendChild(el);
      }
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'min-h-screen flex flex-col items-center justify-center p-6 space-y-4 bg-gray-50';
      fallback.innerHTML = `
        <h1 class="text-4xl font-extrabold text-amber-600">403 - Access Denied</h1>
        <p class="text-gray-600">You do not have permission to access <code>${context.path}</code>.</p>
        <button class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition" onclick="window.location.hash='#/'">Return to Home</button>
      `;
      this.container.appendChild(fallback);
    }
  }

  private renderError(error: Error, context: RouteContext): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    if (this.errorComponent) {
      this.container.appendChild(this.errorComponent(error, context));
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'min-h-screen flex flex-col items-center justify-center p-6 space-y-4 bg-red-50 text-red-900';
      fallback.innerHTML = `
        <h1 class="text-3xl font-bold">500 - Application Error</h1>
        <p class="text-sm font-mono bg-white p-4 rounded border border-red-200 max-w-xl overflow-auto">${error.message || 'An unexpected error occurred.'}</p>
        <button class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition" onclick="window.location.reload()">Reload Application</button>
      `;
      this.container.appendChild(fallback);
    }
  }

  private cleanupActiveRoute(): void {
    // 1. Clean DOM listeners attached to container
    if (this.container) {
      eventManager.cleanup(this.container);
    }

    // 2. Run onMount cleanup function
    if (this.activeMountCleanup) {
      try {
        this.activeMountCleanup();
      } catch (err) {
        console.error('Error during onMount cleanup:', err);
      }
      this.activeMountCleanup = null;
    }

    // 3. Run onDestroy hook
    if (this.activeRoute?.onDestroy) {
      try {
        this.activeRoute.onDestroy();
      } catch (err) {
        console.error('Error during onDestroy:', err);
      }
    }

    // 4. Dispose managed lifecycle scope (timers, listeners, abort signals)
    if (this.activeScope) {
      this.activeScope.dispose();
      this.activeScope = null;
    }
  }

  private syncHash(context: RouteContext, replace: boolean): void {
    const fullHash = `#${context.fullPath}`;
    this.isInternalNavigation = true;
    try {
      if (replace) {
        const urlWithoutHash = window.location.href.split('#')[0];
        window.location.replace(`${urlWithoutHash}${fullHash}`);
      } else {
        window.location.hash = fullHash;
      }
    } finally {
      setTimeout(() => {
        this.isInternalNavigation = false;
      }, 0);
    }
  }

  private parseHash(rawHash: string): { path: string; query: Record<string, string> } {
    let hash = rawHash.replace(/^#+/, '');
    if (!hash.startsWith('/')) {
      hash = `/${hash}`;
    }

    const [pathPart, queryPart] = hash.split('?');
    const query: Record<string, string> = {};

    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((val, key) => {
        query[key] = val;
      });
    }

    return {
      path: this.normalizePath(pathPart || '/'),
      query,
    };
  }

  private normalizePath(path: string): string {
    let normalized = path.replace(/\/+/g, '/');
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  private buildFullPath(path: string, query?: Record<string, string>): string {
    const queryEntries = Object.entries(query || {});
    if (queryEntries.length === 0) return path;
    const searchParams = new URLSearchParams();
    queryEntries.forEach(([k, v]) => searchParams.append(k, v));
    return `${path}?${searchParams.toString()}`;
  }

  private isAsyncComponent(comp: any): boolean {
    if (typeof comp !== 'function') return false;
    return comp.constructor.name === 'AsyncFunction';
  }

  goBack(): void {
    const prev = this.historyStack.pop();
    if (prev) {
      this.navigate(prev.path, { params: prev.params, query: prev.query, state: prev.state, replace: true });
    } else {
      window.history.back();
    }
  }

  getCurrentContext(): RouteContext | null {
    return this.currentContext;
  }

  getCurrentPath(): string | null {
    return this.currentContext?.path ?? null;
  }

  getCurrentParams(): Record<string, string> {
    return this.currentContext?.params ?? {};
  }

  getCurrentQuery(): Record<string, string> {
    return this.currentContext?.query ?? {};
  }

  clearHistory(): void {
    this.historyStack = [];
    this.scrollPositions.clear();
  }

  destroy(): void {
    this.isDestroyed = true;
    this.cleanupActiveRoute();
    window.removeEventListener('hashchange', this.handleHashChange);
    document.removeEventListener('click', this.handleLinkClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.routes.clear();
    this.dynamicRoutes = [];
  }
}

// ============ REUSABLE GUARDS ============

const ACCOUNT_STORAGE_KEY = 'hasAccount';

export function hasLocalAccount(): boolean {
  return localStorage.getItem(ACCOUNT_STORAGE_KEY) === 'true';
}

export function markAccountCreated(): void {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, 'true');
}

export function createNoAccountGuard(createAccountPath = '/create-account'): NavigationGuard {
  return (to) => {
    if (to.path === createAccountPath) return true;
    if (!hasLocalAccount()) return createAccountPath;
    return true;
  };
}

export default Navigation;