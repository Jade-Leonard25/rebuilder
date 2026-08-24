// packages/system/src/factorysystem/factory.ts

import { SVG_TAGS } from './tags';
import { setProp } from './props';
import { appendChildren } from './children';
import type { Component, ElementProps, Child } from './types';

function isPropsObject(value: any): boolean {
    return typeof value === 'object'
        && value !== null
        && !(value instanceof Node)
        && !Array.isArray(value)
        && !(value instanceof Promise);
}

function createElementInternal(tag: any, props?: any, ...children: any[]): any {
    let finalProps: any = props;
    let flatChildren: any[] = [];

    if (isPropsObject(props)) {
        flatChildren = children.flat(Infinity);
    } else {
        finalProps = null;
        flatChildren = [props, ...children].flat(Infinity).filter(c => c !== undefined);
    }

    if (typeof tag === 'function' && !('prototype' in tag && tag.prototype instanceof Element)) {
        const componentProps = {
            ...(finalProps || {}),
            children: flatChildren.length === 1 ? flatChildren[0] : flatChildren,
        };
        return tag(componentProps);
    }

    const isSvg = typeof tag === 'string' && SVG_TAGS.has(tag);
    const element = isSvg
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag);

    if (finalProps) {
        Object.entries(finalProps).forEach(([key, value]) => {
            setProp(element as HTMLElement, key, value);
        });
    }

    appendChildren(element, flatChildren);

    return element;
}

export const rProxy = new Proxy(createElementInternal as any, {
    get(target, tag: any) {
        if (tag in target) return target[tag];

        return (props?: any, ...children: any[]) => {
            if (isPropsObject(props)) {
                return createElementInternal(tag, props, ...children);
            }
            return createElementInternal(tag, null, props, ...children);
        };
    },
});

export type ElementFactory = {
    <K extends keyof HTMLElementTagNameMap>(
        tag: K,
        props?: ElementProps | null | Child,
        ...children: Child[]
    ): HTMLElementTagNameMap[K];
    <P>(
        tag: Component<P>,
        props?: P | null,
        ...children: Child[]
    ): Node | Node[];
    (tag: string, props?: ElementProps | null | Child, ...children: Child[]): HTMLElement;
} & {
    [K in keyof HTMLElementTagNameMap]: (
        props?: ElementProps | null | Child,
        ...children: Child[]
    ) => HTMLElementTagNameMap[K];
} & {
    [key: string]: (
        props?: ElementProps | null | Child,
        ...children: Child[]
    ) => HTMLElement;
};

export const r: ElementFactory = rProxy as ElementFactory;
export { createElementInternal as createElement };