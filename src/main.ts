import './index.css';
import { r } from './system/factory';
import { Fragment } from './system/fragment';
import { createRef } from './system/refs';
import { useRef } from './system/refs';
import { objectFunction } from './system/state';
import { createSignal } from './system/signals';
import { createEffect } from './system/effects';
import { createComputed } from './system/effects';
import { Show } from './system/control-flow';
import { For } from './system/control-flow';
import { eventManager } from './system/event-manager';

import { createNavigation, type RouteConfig, type RouteContext } from './config/config';

// Expose globals for factory system
(window as any).r = r;
(window as any).Fragment = Fragment;
(window as any).createRef = createRef;
(window as any).useRef = useRef;
(window as any).useState = objectFunction;
(window as any).createSignal = createSignal;
(window as any).createEffect = createEffect;
(window as any).createComputed = createComputed;
(window as any).Show = Show;
(window as any).For = For;
(window as any).eventManager = eventManager;

const app = document.getElementById('app');

// 1. Auto-discover all generated routes in src/routing/*/index.ts
const routeModules = import.meta.glob<{
  default: (context: RouteContext) => HTMLElement;
  metadata?: { path?: string; title?: string; requireAuth?: boolean; roles?: string[] };
}>('./routing/*/index.ts', { eager: true });

// 2. Auto-discover all native .rebuilder SFC files in src/pages/*.rebuilder
const rebuilderModules = import.meta.glob<{
  default: (context: RouteContext) => HTMLElement;
  metadata?: { path?: string; title?: string; requireAuth?: boolean; roles?: string[] };
}>('./pages/*.rebuilder', { eager: true });

const discoveredRoutes: RouteConfig[] = [
  ...Object.values(routeModules).map((mod) => ({
    path: mod.metadata?.path || '/',
    title: mod.metadata?.title,
    component: mod.default,
    requireAuth: mod.metadata?.requireAuth,
    roles: mod.metadata?.roles,
  })),
  ...Object.values(rebuilderModules).map((mod) => ({
    path: mod.metadata?.path || '/rebuilder-sfc',
    title: mod.metadata?.title || 'Rebuilder SFC',
    component: mod.default,
    requireAuth: mod.metadata?.requireAuth,
    roles: mod.metadata?.roles,
  })),
];

// Default App Layout (Desktop Titlebar + Navigation Bar + Main Content Area)
function AppLayout(context: RouteContext): HTMLElement {
  const currentPath = context.path;
  const childElement = context.state?.children as HTMLElement;

  return r.div(
    { className: 'min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans' },

    // Top Desktop App Bar
    r.header(
      { className: 'flex items-center justify-between px-6 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700/60' },
      r.div(
        { className: 'flex items-center gap-3' },
        r.span({ className: 'h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50' }),
        r.span({ className: 'font-bold text-lg tracking-tight text-white' }, 'Rebuilder Desktop'),
        r.span({ className: 'text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono' }, 'v1.0.0')
      ),
      r.nav(
        { className: 'flex items-center gap-2 flex-wrap' },
        r.a(
          {
            href: '#/',
            className: `px-3 py-1.5 rounded-md text-sm font-medium transition ${currentPath === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`,
          },
          'Home'
        ),
        r.a(
          {
            href: '#/rebuilder-sfc',
            className: `px-3 py-1.5 rounded-md text-sm font-medium transition ${currentPath === '/rebuilder-sfc' ? 'bg-blue-600 text-white' : 'text-emerald-400 hover:bg-slate-700 hover:text-white'
              }`,
          },
          '✨ .rebuilder SFC'
        ),
        r.a(
          {
            href: '#/reactivity-demo',
            className: `px-3 py-1.5 rounded-md text-sm font-medium transition ${currentPath === '/reactivity-demo' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`,
          },
          'Reactivity'
        ),
        r.a(
          {
            href: '#/user-dashboard?tab=analytics&filter=active',
            className: `px-3 py-1.5 rounded-md text-sm font-medium transition ${currentPath === '/user-dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`,
          },
          'User Dashboard'
        ),
        r.a(
          {
            href: '#/timer-demo',
            className: `px-3 py-1.5 rounded-md text-sm font-medium transition ${currentPath === '/timer-demo' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`,
          },
          'Lifecycle'
        ),
        r.a(
          {
            href: '#/admin-panel',
            className: `px-3 py-1.5 rounded-md text-sm font-medium transition ${currentPath === '/admin-panel' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`,
          },
          'Admin'
        )
      )
    ),

    // Main View Outlet
    r.main({ className: 'flex-1 p-6 max-w-6xl w-full mx-auto' }, childElement)
  );
}

// Built-in Showcase Routes
const builtInRoutes: RouteConfig[] = [
  {
    path: '/',
    title: 'Home - Rebuilder Desktop',
    component: () =>
      r.div(
        { className: 'space-y-6' },
        r.div(
          { className: 'p-8 bg-slate-800 rounded-xl border border-slate-700 space-y-4' },
          r.h1({ className: 'text-3xl font-extrabold text-white' }, 'Welcome to Rebuilder Desktop'),
          r.p({ className: 'text-slate-300 text-base max-w-2xl leading-relaxed' },
            'A high-performance, fine-grained reactive DOM factory, native .rebuilder SFC compiler, and hash-routed engine built for desktop applications.'
          ),
          r.div(
            { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 pt-4' },
            r.div(
              { className: 'p-4 rounded-lg bg-slate-900/50 border border-slate-700/50' },
              r.h3({ className: 'font-semibold text-emerald-400 mb-1' }, '✨ Custom .rebuilder SFC'),
              r.p({ className: 'text-xs text-slate-400' }, 'Single-File Components with Frontmatter, Script, Template, and Directives.')
            ),
            r.div(
              { className: 'p-4 rounded-lg bg-slate-900/50 border border-slate-700/50' },
              r.h3({ className: 'font-semibold text-blue-400 mb-1' }, '⚡ Fine-Grained Signals'),
              r.p({ className: 'text-xs text-slate-400' }, 'Direct in-place text & attribute DOM binding with zero Virtual DOM overhead.')
            ),
            r.div(
              { className: 'p-4 rounded-lg bg-slate-900/50 border border-slate-700/50' },
              r.h3({ className: 'font-semibold text-purple-400 mb-1' }, '🛡️ Scoped Lifecycle'),
              r.p({ className: 'text-xs text-slate-400' }, 'Automatic cancellation of timers, intervals, DOM listeners, and AbortSignals on unmount.')
            )
          )
        )
      ),
  },
  {
    path: '/reactivity-demo',
    title: 'Reactivity & Signals Showcase',
    component: () => {
      const count = objectFunction(0);
      const isVisible = objectFunction(true);
      const items = objectFunction(['Task Alpha', 'Task Beta', 'Task Gamma']);
      const inputRef = useRef<HTMLInputElement>(null);

      return r.div(
        { className: 'space-y-6' },

        // Signal Counter Section
        r.div(
          { className: 'p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4' },
          r.h2({ className: 'text-xl font-bold text-white flex items-center gap-2' }, '⚡ 1. Fine-Grained Reactive Counter'),
          r.p({ className: 'text-sm text-slate-400' },
            'The counter below updates its exact DOM text node in-place without re-rendering the surrounding container.'
          ),
          r.div(
            { className: 'flex items-center gap-4' },
            r.button(
              {
                className: 'px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition cursor-pointer font-medium',
                onClick: () => count.update((c) => Math.max(0, c - 1)),
              },
              '- Decrement'
            ),
            r.div(
              { className: 'px-6 py-2 bg-slate-900 rounded-lg border border-slate-700 font-mono text-xl text-emerald-400 font-bold' },
              count
            ),
            r.button(
              {
                className: 'px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed',
                disabled: () => count.value >= 10,
                onClick: () => count.update((c) => c + 1),
              },
              '+ Increment (Max 10)'
            )
          )
        ),

        // Show / Conditional Section
        r.div(
          { className: 'p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4' },
          r.h2({ className: 'text-xl font-bold text-white flex items-center gap-2' }, '👁️ 2. Reactive Show() Control Flow'),
          r.button(
            {
              className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer text-sm font-medium',
              onClick: () => isVisible.set((v) => !v),
            },
            () => (isVisible.value ? 'Hide Secret Box' : 'Show Secret Box')
          ),
          Show({
            when: () => isVisible.value,
            fallback: r.p({ className: 'text-sm text-slate-500 italic' }, 'Box is currently hidden.'),
            children: r.div(
              { className: 'p-4 bg-blue-950/60 border border-blue-800 text-blue-200 rounded-lg' },
              '🎉 This content was conditionally inserted using the Show() primitive!'
            ),
          })
        ),

        // For List Section & Ref
        r.div(
          { className: 'p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-4' },
          r.h2({ className: 'text-xl font-bold text-white flex items-center gap-2' }, '📋 3. Reactive For() List & useRef()'),
          r.div(
            { className: 'flex gap-2' },
            r.input({
              ref: inputRef,
              type: 'text',
              placeholder: 'Add new item...',
              className: 'px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm flex-1',
            }),
            r.button(
              {
                className: 'px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition cursor-pointer text-sm font-medium',
                onClick: () => {
                  if (inputRef.current && inputRef.current.value.trim()) {
                    items.update((list) => [...list, inputRef.current!.value.trim()]);
                    inputRef.current.value = '';
                    inputRef.current.focus();
                  }
                },
              },
              'Add Item'
            )
          ),
          r.ul(
            { className: 'space-y-2' },
            For({
              each: () => items.value,
              children: (item, index) =>
                r.li(
                  { className: 'flex items-center justify-between p-3 bg-slate-900/60 rounded border border-slate-800 text-sm' },
                  r.span({ className: 'text-slate-200' }, item),
                  r.button(
                    {
                      className: 'text-xs text-red-400 hover:text-red-300 font-mono px-2 py-1 bg-red-950/40 rounded border border-red-900/50 cursor-pointer',
                      onClick: () => {
                        const idx = index();
                        items.update((list) => list.filter((_, i) => i !== idx));
                      },
                    },
                    'Delete'
                  )
                ),
            })
          )
        )
      );
    },
  },
  {
    path: '/timer-demo',
    title: 'Memory & Lifecycle Scope Demo',
    component: (ctx) => {
      const timeDisplay = r.span({ className: 'text-2xl font-mono text-emerald-400 font-bold' }, '0s');
      let seconds = 0;

      ctx.scope.setInterval(() => {
        seconds++;
        timeDisplay.textContent = `${seconds}s elapsed`;
      }, 1000);

      ctx.scope.onCleanup(() => {
        console.log('✅ [LifecycleScope] Memory successfully freed for /timer-demo view.');
      });

      return r.div(
        { className: 'p-8 bg-slate-800 rounded-xl border border-slate-700 space-y-4' },
        r.h2({ className: 'text-2xl font-bold text-white' }, 'Memory Safety & Lifecycle Scope Demo'),
        r.p({ className: 'text-slate-300' },
          'This component starts an interval timer using ',
          r.code({ className: 'text-emerald-400 bg-slate-900 px-1 py-0.5 rounded' }, 'ctx.scope.setInterval()'),
          '. When you navigate away, the timer and any network requests are instantly and automatically disposed with zero memory leaks.'
        ),
        r.div(
          { className: 'p-4 bg-slate-950 rounded-lg inline-block border border-slate-800' },
          r.p({ className: 'text-xs text-slate-400 mb-1' }, 'Active Scoped Timer:'),
          timeDisplay
        )
      );
    },
  },
  {
    path: '/admin-panel',
    title: 'Admin Panel (RBAC)',
    roles: ['admin'],
    component: () =>
      r.div(
        { className: 'p-8 bg-slate-800 rounded-xl border border-slate-700 space-y-4' },
        r.h2({ className: 'text-2xl font-bold text-purple-400' }, '🔒 Protected Admin Panel'),
        r.p({ className: 'text-slate-300' }, 'This route requires the "admin" role. RBAC guard granted access successfully.')
      ),
  },
];

const allRoutes: RouteConfig[] = [...builtInRoutes];
discoveredRoutes.forEach((route) => {
  if (!allRoutes.some((r) => r.path === route.path)) {
    allRoutes.push(route);
  }
});

if (app) {
  const currentUser = {
    isAuthenticated: true,
    roles: ['admin'],
    permissions: ['read', 'write'],
  };

  const navigation = createNavigation({
    container: app,
    routes: allRoutes,
    defaultLayout: AppLayout,
    authChecker: () => currentUser.isAuthenticated,
    roleChecker: (roles) => roles.some((role) => currentUser.roles.includes(role)),
    permissionChecker: (perms) => perms.every((p) => currentUser.permissions.includes(p)),
    beforeEach: (to, from) => {
      console.log(`[Router] Navigating: ${from?.path || 'initial'} -> ${to.path}`);
    },
    afterEach: (to) => {
      console.log(`[Router] Rendered: ${to.path}`);
    },
  });

  (window as any).navigation = navigation;

  // Initial navigation based on active URL hash
  const initialHash = window.location.hash ? window.location.hash.replace(/^#+/, '') : '/';
  navigation.navigate(initialHash);
}
