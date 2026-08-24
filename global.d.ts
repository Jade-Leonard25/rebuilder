// global.d.ts

import type {
  Component,
  Child,
  ElementProps,
  RefObject,
  StateHook,
  SignalGetter,
  SignalSetter,
} from './src/system/factorysystem/config';
import type { RouteContext } from './src/config/config';

declare module '*.rebuilder' {
  export const metadata: Record<string, any>;
  export default function (context?: RouteContext): HTMLElement;
}

declare global {
  // Factory - has BOTH call signature AND methods
  const r: {
    // Call signature - allows r('div', ...)
    (tag: string, props?: any, ...children: any[]): HTMLElement;
    
    // Element methods - allows r.div(...)
    div: (props?: any, ...children: any[]) => HTMLDivElement;
    button: (props?: any, ...children: any[]) => HTMLButtonElement;
    span: (props?: any, ...children: any[]) => HTMLSpanElement;
    input: (props?: any, ...children: any[]) => HTMLInputElement;
    form: (props?: any, ...children: any[]) => HTMLFormElement;
    h1: (props?: any, ...children: any[]) => HTMLHeadingElement;
    h2: (props?: any, ...children: any[]) => HTMLHeadingElement;
    h3: (props?: any, ...children: any[]) => HTMLHeadingElement;
    p: (props?: any, ...children: any[]) => HTMLParagraphElement;
    a: (props?: any, ...children: any[]) => HTMLAnchorElement;
    img: (props?: any, ...children: any[]) => HTMLImageElement;
    ul: (props?: any, ...children: any[]) => HTMLUListElement;
    ol: (props?: any, ...children: any[]) => HTMLOListElement;
    li: (props?: any, ...children: any[]) => HTMLLIElement;
    textarea: (props?: any, ...children: any[]) => HTMLTextAreaElement;
    select: (props?: any, ...children: any[]) => HTMLSelectElement;
    label: (props?: any, ...children: any[]) => HTMLLabelElement;
    section: (props?: any, ...children: any[]) => HTMLElement;
    header: (props?: any, ...children: any[]) => HTMLElement;
    footer: (props?: any, ...children: any[]) => HTMLElement;
    nav: (props?: any, ...children: any[]) => HTMLElement;
    main: (props?: any, ...children: any[]) => HTMLElement;
    [key: string]: (props?: any, ...children: any[]) => HTMLElement;
  };
  
  // Fragment
  const Fragment: (props: { children?: any[] }) => DocumentFragment;
  
  // Refs
  const createRef: <T = HTMLElement>() => RefObject<T>;
  const useRef: <T = HTMLElement>(initialValue?: T | null) => RefObject<T>;
  
  // Reactivity & Signals
  const useState: <T>(initial: T) => StateHook<T>;
  const createSignal: <T>(initial: T) => [SignalGetter<T>, SignalSetter<T>];
  const createEffect: (fn: () => void | (() => void)) => () => void;
  const createComputed: <T>(fn: () => T) => SignalGetter<T>;
  
  // Control Flow
  const Show: <T>(props: {
    when: boolean | (() => any);
    fallback?: Child | (() => Child);
    children?: Child | (() => Child);
  }) => DocumentFragment;

  const For: <T>(props: {
    each: T[] | (() => T[]);
    key?: (item: T, index: number) => any;
    children: (item: T, index: () => number) => Node;
    fallback?: Child;
  }) => DocumentFragment;

  // Event Manager
  const eventManager: {
    add: (element: HTMLElement | SVGElement, event: string, handler: EventListener, options?: AddEventListenerOptions) => void;
    cleanup: (element: HTMLElement | SVGElement) => void;
    cleanupAll: () => void;
  };
  
  // Types
  type Component<P = any> = (props: P) => Node | Node[] | null | undefined;
  type Child = Node | string | number | boolean | null | undefined | Promise<Node> | (() => any) | Child[];
  interface ElementProps { [key: string]: any; }
}

export {};