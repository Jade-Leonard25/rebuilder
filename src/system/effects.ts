// packages/system/src/factorysystem/effects.ts

import { pushSubscriber, popSubscriber, createSignal, type SignalGetter } from './signals';

export function createEffect(effectFn: () => void | (() => void)): () => void {
    let cleanupFn: (() => void) | void;

    const runner = () => {
        if (typeof cleanupFn === 'function') {
            try {
                cleanupFn();
            } catch (err) {
                console.error('Effect cleanup error:', err);
            }
        }

        pushSubscriber(runner);
        try {
            cleanupFn = effectFn();
        } catch (err) {
            console.error('Effect execution error:', err);
        } finally {
            popSubscriber();
        }
    };

    runner();

    return () => {
        if (typeof cleanupFn === 'function') {
            cleanupFn();
        }
    };
}

export function createComputed<T>(computeFn: () => T): SignalGetter<T> {
    const [get, set] = createSignal<T>(undefined as unknown as T);
    createEffect(() => {
        set(computeFn());
    });
    return get;
}