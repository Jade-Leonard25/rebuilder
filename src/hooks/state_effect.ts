// src/hooks/useEffect.ts

import { createEffect } from '../system/effects';
import { objectFunction } from '../system/state';

// ============ TYPES ============

type DependencyList = ReadonlyArray<any>;

type EffectCallback = () => void | (() => void);

interface EffectOptions {
  /** Run only once on mount */
  once?: boolean;
  
  /** Run immediately on mount (default: true) */
  immediate?: boolean;
  
  /** Cleanup on unmount */
  cleanup?: () => void;
}

// ============ USE EFFECT ============

export function objectEffect(
  callback: EffectCallback,
  deps?: DependencyList,
  options: EffectOptions = {}
): () => void {
  const { once = false, immediate = true, cleanup } = options;
  
  let cleanupFn: (() => void) | void;
  let previousDeps: DependencyList | undefined;
  let isFirstRun = true;
  
  const runner = createEffect(() => {
    // Run cleanup from previous execution
    if (cleanupFn) {
      cleanupFn();
    }
    
    // Check dependencies
    if (!shouldRun(isFirstRun, previousDeps, deps, once)) {
      return;
    }
    
    // Run the effect
    if (immediate || !isFirstRun) {
      cleanupFn = callback();
    }
    
    // Update deps for next check
    previousDeps = deps;
    isFirstRun = false;
  });
  
  // Return cleanup function
  return () => {
    if (cleanupFn) {
      cleanupFn();
    }
    if (cleanup) {
      cleanup();
    }
    runner();
  };
}

function shouldRun(
  isFirstRun: boolean,
  previousDeps: DependencyList | undefined,
  currentDeps: DependencyList | undefined,
  once: boolean
): boolean {
  // No deps = run every time
  if (currentDeps === undefined) {
    return !once || isFirstRun;
  }
  
  // First run = always run
  if (isFirstRun) {
    return true;
  }
  
  // Once = only first run
  if (once) {
    return false;
  }
  
  // Check if deps changed
  if (previousDeps === undefined) {
    return true;
  }
  
  return currentDeps.some((dep, index) => !Object.is(dep, previousDeps[index]));
}

// ============ USE LAYOUT EFFECT ============

export function useLayoutEffect(
  callback: EffectCallback,
  deps?: DependencyList
): () => void {
  return objectEffect(callback, deps, { immediate: true });
}

// ============ USE MOUNT ============

export function useMount(callback: () => void | (() => void)): () => void {
  return objectEffect(callback, [], { once: true });
}

// ============ USE UNMOUNT ============

export function useUnmount(callback: () => void): void {
  objectEffect(() => {
    return callback;
  }, [], { once: true });
}

// ============ USE UPDATE ============

export function useUpdate(callback: () => void, deps?: DependencyList): () => void {
  return objectEffect(callback, deps, { immediate: false });
}

// ============ USE INTERVAL ============

export function useInterval(
  callback: () => void,
  delay: number | null
): () => void {
  return objectEffect(() => {
    if (delay === null) return;
    
    const intervalId = setInterval(callback, delay);
    
    return () => clearInterval(intervalId);
  }, [delay]);
}

// ============ USE TIMEOUT ============

export function useTimeout(
  callback: () => void,
  delay: number | null
): () => void {
  return objectEffect(() => {
    if (delay === null) return;
    
    const timeoutId = setTimeout(callback, delay);
    
    return () => clearTimeout(timeoutId);
  }, [delay]);
}

// ============ USE EVENT LISTENER ============

export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  target: Window | HTMLElement | null = window
): () => void {
  return objectEffect(() => {
    if (!target) return;
    
    target.addEventListener(event as string, handler as EventListener);
    
    return () => {
      target.removeEventListener(event as string, handler as EventListener);
    };
  }, [event, handler, target]);
}

// ============ USE DEBOUNCE ============

export function useDebounce<T>(
  callback: (value: T) => void,
  delay: number
): (value: T) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (value: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(value), delay);
  };
}

// ============ USE THROTTLE ============

export function useThrottle<T>(
  callback: (value: T) => void,
  limit: number
): (value: T) => void {
  let inThrottle = false;
  
  return (value: T) => {
    if (!inThrottle) {
      callback(value);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============ USE PREVIOUS ============

export function usePrevious<T>(value: T): T | undefined {
  let previous: T | undefined;
  
  objectEffect(() => {
    previous = value;
  }, [value]);
  
  return previous;
}

// ============ USE ASYNC EFFECT ============

export function useAsyncEffect(
  callback: () => Promise<void | (() => void)>,
  deps?: DependencyList
): () => void {
  let isCancelled = false;
  let cleanupFn: (() => void) | void;
  
  const runner = objectEffect(() => {
    isCancelled = false;
    
    callback().then(result => {
      if (!isCancelled && typeof result === 'function') {
        cleanupFn = result;
      }
    });
    
    return () => {
      isCancelled = true;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, deps);
  
  return runner;
}

// ============ EXPORT DEFAULT ============

export default objectEffect;