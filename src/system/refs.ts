// packages/system/src/factorysystem/refs.ts

import type { RefObject } from './types';

export function createRef<T = HTMLElement>(): RefObject<T> {
    return { current: null };
}

export function useRef<T = HTMLElement>(initialValue: T | null = null): RefObject<T> {
    return { current: initialValue };
}