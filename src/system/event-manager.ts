// packages/system/src/factorysystem/event-manager.ts

export class EventManager {
    private listeners = new Map<HTMLElement | SVGElement, Map<string, EventListener[]>>();

    add(element: HTMLElement | SVGElement, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
        element.addEventListener(event, handler, options);

        if (!this.listeners.has(element)) {
            this.listeners.set(element, new Map());
        }

        const events = this.listeners.get(element)!;
        if (!events.has(event)) {
            events.set(event, []);
        }
        events.get(event)!.push(handler);
    }

    cleanup(element: HTMLElement | SVGElement): void {
        this.cleanupSingle(element);

        for (const registeredEl of Array.from(this.listeners.keys())) {
            if (element.contains(registeredEl) && registeredEl !== element) {
                this.cleanupSingle(registeredEl);
            }
        }
    }

    private cleanupSingle(el: HTMLElement | SVGElement): void {
        const events = this.listeners.get(el);
        if (!events) return;

        events.forEach((handlers, event) => {
            handlers.forEach(handler => el.removeEventListener(event, handler));
        });

        this.listeners.delete(el);
    }

    cleanupAll(): void {
        this.listeners.forEach((events, el) => {
            events.forEach((handlers, event) => {
                handlers.forEach(handler => el.removeEventListener(event, handler));
            });
        });
        this.listeners.clear();
    }
}

export const eventManager = new EventManager();