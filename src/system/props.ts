// packages/system/src/factorysystem/props.ts

import { BOOLEAN_PROPS } from './tags';
import { eventManager } from './event-manager';
import { createEffect } from './effects';

function formatClassName(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        return value.filter(Boolean).map(formatClassName).join(' ').trim();
    }
    if (typeof value === 'object') {
        return Object.entries(value)
            .filter(([_, active]) => Boolean(active))
            .map(([k]) => k)
            .join(' ');
    }
    return String(value);
}

function applyProp(element: HTMLElement | SVGElement, key: string, value: any): void {
    if (value === null || value === undefined) {
        element.removeAttribute(key);
        return;
    }

    if (key === 'key') return;

    if (key === 'ref') {
        if (typeof value === 'function') {
            value(element);
        } else if (value && typeof value === 'object' && 'current' in value) {
            value.current = element;
        } else if (typeof value === 'string') {
            (element as any).__refName = value;
        }
        return;
    }

    if (key === 'className' || key === 'class') {
        const formatted = formatClassName(value);
        if (element instanceof HTMLElement) {
            element.className = formatted;
        } else {
            element.setAttribute('class', formatted);
        }
        return;
    }

    if (key === 'style') {
        if (typeof value === 'string') {
            element.setAttribute('style', value);
        } else if (typeof value === 'object' && value !== null) {
            if (element instanceof HTMLElement) {
                Object.assign(element.style, value);
            } else {
                Object.entries(value).forEach(([k, v]) => {
                    element.style.setProperty(k, String(v));
                });
            }
        }
        return;
    }

    if (key === 'dataset' && typeof value === 'object') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
            element.setAttribute(`data-${dataKey}`, String(dataValue));
        });
        return;
    }

    if (key === 'aria' && typeof value === 'object') {
        Object.entries(value).forEach(([ariaKey, ariaValue]) => {
            element.setAttribute(`aria-${ariaKey}`, String(ariaValue));
        });
        return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        eventManager.add(element, eventName, value as EventListener);
        return;
    }

    if (BOOLEAN_PROPS.has(key)) {
        const boolVal = Boolean(value);
        (element as any)[key] = boolVal;
        if (boolVal) {
            element.setAttribute(key, '');
        } else {
            element.removeAttribute(key);
        }
        return;
    }

    if (key === 'html') {
        element.innerHTML = String(value);
        return;
    }
    if (key === 'text') {
        element.textContent = String(value);
        return;
    }

    if (key in element && !(element instanceof SVGElement)) {
        try {
            (element as any)[key] = value;
        } catch { }
    }
    element.setAttribute(key, String(value));
}

export function setProp(element: HTMLElement | SVGElement, key: string, value: any): void {
    if (typeof value === 'function' && !key.startsWith('on') && key !== 'ref') {
        createEffect(() => {
            applyProp(element, key, value());
        });
        return;
    }

    applyProp(element, key, value);
}