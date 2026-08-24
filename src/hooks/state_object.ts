// src/hooks/state_object.ts

import { createSignal, type SignalGetter, type SignalSetter } from '../system/signals';
import { createEffect } from '../system/effects';

// ============ TYPES ============

export interface ObjectState<T extends Record<string, any>> {
  /** Get current value */
  (): T;
  
  /** Read-only current value */
  readonly value: T;
  
  /** Set entire object */
  set: (newValue: T | ((prev: T) => T)) => void;
  
  /** Update specific field */
  setField: <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])) => void;
  
  /** Update multiple fields */
  setFields: (fields: Partial<T>) => void;
  
  /** Update with callback */
  update: (fn: (prev: T) => T) => void;
  
  /** Reset to initial value */
  reset: () => void;
  
  /** Subscribe to changes */
  subscribe: (listener: (value: T) => void) => () => void;
  
  /** Get current value */
  get: () => T;
  
  /** Handle input change event */
  handleInput: (e: Event) => void;
  
  /** Handle checkbox change */
  handleCheckbox: (e: Event) => void;
  
  /** Handle select change */
  handleSelect: (e: Event) => void;
  
  /** Get form data */
  toJSON: () => T;
  
  /** Check if dirty (changed from initial) */
  isDirty: () => boolean;
  
  /** Check if a field has error */
  hasError: (field: keyof T, error: string) => boolean;
  
  /** Clear specific field */
  clearField: <K extends keyof T>(key: K) => void;
  
  /** Clear all fields */
  clear: () => void;
}

// ============ IMPLEMENTATION ============

export function objectSystem<T extends Record<string, any>>(initialValue: T): ObjectState<T> {
  const [get, set] = createSignal<T>({ ...initialValue });
  
  // Track original for dirty check
  const original = JSON.stringify(initialValue);
  
  const setter: SignalSetter<T> = (newValue) => {
    set(newValue);
  };
  
  const setField = <K extends keyof T>(
    key: K,
    value: T[K] | ((prev: T[K]) => T[K])
  ): void => {
    set(prev => ({
      ...prev,
      [key]: typeof value === 'function'
        ? (value as (prevValue: T[K]) => T[K])(prev[key])
        : value,
    }));
  };
  
  const setFields = (fields: Partial<T>): void => {
    set(prev => ({
      ...prev,
      ...fields,
    }));
  };
  
  const update = (fn: (prev: T) => T): void => {
    set(fn);
  };
  
  const reset = (): void => {
    set({ ...initialValue });
  };
  
  const clearField = <K extends keyof T>(key: K): void => {
    set(prev => ({
      ...prev,
      [key]: initialValue[key],
    }));
  };
  
  const clear = (): void => {
    set({ ...initialValue });
  };
  
  const subscribe = (listener: (value: T) => void): (() => void) => {
    return createEffect(() => {
      listener(get());
    });
  };
  
  const isDirty = (): boolean => {
    return JSON.stringify(get()) !== original;
  };
  
  const toJSON = (): T => {
    return { ...get() };
  };
  
  const handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;
    
    if (name) {
      setField(name as keyof T, value as T[keyof T]);
    }
  };
  
  const handleCheckbox = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    const { name, checked } = target;
    
    if (name) {
      setField(name as keyof T, checked as T[keyof T]);
    }
  };
  
  const handleSelect = (e: Event): void => {
    const target = e.target as HTMLSelectElement;
    const { name, value } = target;
    
    if (name) {
      setField(name as keyof T, value as T[keyof T]);
    }
  };
  
  const hasError = (field: keyof T, error: string): boolean => {
    const value = get()[field];
    return value === error;
  };
  
  // Create callable state object
  const state = function(): T {
    return get();
  } as ObjectState<T>;
  
  // Define properties
  Object.defineProperty(state, 'value', {
    get: () => get(),
    enumerable: true,
  });
  
  // Assign methods
  state.set = setter;
  state.setField = setField;
  state.setFields = setFields;
  state.update = update;
  state.reset = reset;
  state.subscribe = subscribe;
  state.get = () => get();
  state.handleInput = handleInput;
  state.handleCheckbox = handleCheckbox;
  state.handleSelect = handleSelect;
  state.toJSON = toJSON;
  state.isDirty = isDirty;
  state.hasError = hasError;
  state.clearField = clearField;
  state.clear = clear;
  
  return state;
}

// ============ FORM HELPERS ============

export function useFormState<T extends Record<string, any>>(initialValue: T) {
  const state = objectSystem(initialValue);
  
  return {
    ...state,
    
    // Bind to input element
    bind: <K extends keyof T>(key: K) => ({
      name: key as string,
      value: state.get()[key] ?? '',
      onInput: state.handleInput,
    }),
    
    // Bind to checkbox
    bindCheckbox: <K extends keyof T>(key: K) => ({
      name: key as string,
      checked: Boolean(state.get()[key]),
      onChange: state.handleCheckbox,
    }),
    
    // Bind to select
    bindSelect: <K extends keyof T>(key: K) => ({
      name: key as string,
      value: state.get()[key] ?? '',
      onChange: state.handleSelect,
    }),
  };
}

export default objectSystem;