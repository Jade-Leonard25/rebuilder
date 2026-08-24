// packages/system/src/factorysystem/state.ts

import { createSignal } from './signals';
import { createEffect } from './effects';

export interface StateHook<T> {
    (): T;
    readonly value: T;
    set: (newValue: T | ((prev: T) => T)) => void;
    update: (fn: (prev: T) => T) => void;
    subscribe: (listener: (value: T) => void) => () => void;
}

export function objectFunction<T>(initialValue: T): StateHook<T> {
    const [get, set] = createSignal<T>(initialValue);

    const hook = function (): T {
        return get();
    } as StateHook<T>;

    Object.defineProperty(hook, 'value', {
        get: () => get(),
        enumerable: true,
    });

    hook.set = set;
    hook.update = (fn: (prev: T) => T) => set(fn);
    hook.subscribe = (listener: (value: T) => void) => {
        return createEffect(() => {
            listener(get());
        });
    };

    return hook;
}