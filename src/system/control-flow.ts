// packages/system/src/factorysystem/control-flow.ts

import { createEffect } from './effects';
import { appendChild } from './children';
import type { Child } from './types';

export function Show<T>(props: {
    when: boolean | (() => any);
    fallback?: Child | (() => Child);
    children?: Child | (() => Child);
}): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const placeholder = document.createComment('show-anchor');
    fragment.appendChild(placeholder);

    let currentRenderedNode: Node | null = null;

    createEffect(() => {
        const isVisible = typeof props.when === 'function' ? Boolean(props.when()) : Boolean(props.when);
        const content = isVisible
            ? (typeof props.children === 'function' ? props.children() : props.children)
            : (typeof props.fallback === 'function' ? props.fallback() : props.fallback);

        if (currentRenderedNode) {
            currentRenderedNode.parentNode?.removeChild(currentRenderedNode);
            currentRenderedNode = null;
        }

        if (content !== null && content !== undefined && typeof content !== 'boolean') {
            const container = document.createDocumentFragment();
            appendChild(container, content);
            const firstNode = container.firstChild;
            placeholder.parentNode?.insertBefore(container, placeholder);
            currentRenderedNode = firstNode;
        }
    });

    return fragment;
}

export function For<T>(props: {
    each: T[] | (() => T[]);
    key?: (item: T, index: number) => any;
    children: (item: T, index: () => number) => Node;
    fallback?: Child;
}): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const placeholder = document.createComment('for-anchor');
    fragment.appendChild(placeholder);

    let renderedNodes: Node[] = [];

    createEffect(() => {
        const list = typeof props.each === 'function' ? props.each() : props.each;

        renderedNodes.forEach(node => node.parentNode?.removeChild(node));
        renderedNodes = [];

        if (!list || list.length === 0) {
            if (props.fallback) {
                const fallbackContainer = document.createDocumentFragment();
                appendChild(fallbackContainer, props.fallback);
                const nodes = Array.from(fallbackContainer.childNodes);
                placeholder.parentNode?.insertBefore(fallbackContainer, placeholder);
                renderedNodes = nodes;
            }
            return;
        }

        const container = document.createDocumentFragment();
        list.forEach((item, idx) => {
            const node = props.children(item, () => idx);
            if (node) {
                container.appendChild(node);
                renderedNodes.push(node);
            }
        });

        placeholder.parentNode?.insertBefore(container, placeholder);
    });

    return fragment;
}