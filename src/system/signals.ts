// packages/system/src/factorysystem/signals.ts

type Subscriber = () => void;
let activeSubscriber: Subscriber | null = null;
const subscriberStack: Array<Subscriber | null> = [];

export function pushSubscriber(subscriber: Subscriber | null): void {
    subscriberStack.push(activeSubscriber);
    activeSubscriber = subscriber;
}

export function popSubscriber(): void {
    activeSubscriber = subscriberStack.pop() ?? null;
}

export interface SignalGetter<T> {
    (): T;
}

export interface SignalSetter<T> {
    (newValue: T | ((prev: T) => T)): void;
}

export function createSignal<T>(initialValue: T): [SignalGetter<T>, SignalSetter<T>] {
    let value = initialValue;
    const subscribers = new Set<Subscriber>();

    const getter: SignalGetter<T> = () => {
        if (activeSubscriber) {
            subscribers.add(activeSubscriber);
        }
        return value;
    };

    const setter: SignalSetter<T> = (newValue) => {
        const resolved = typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(value)
            : newValue;

        if (!Object.is(value, resolved)) {
            value = resolved;
            const copy = Array.from(subscribers);
            copy.forEach(sub => {
                try {
                    sub();
                } catch (err) {
                    console.error('Signal subscriber error:', err);
                }
            });
        }
    };

    return [getter, setter];
}