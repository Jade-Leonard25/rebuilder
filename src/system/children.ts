// packages/system/src/factorysystem/children.ts

import { createEffect } from './effects';

export function appendChild(element: Element | DocumentFragment, child: any): void {
    if (child === null || child === undefined || typeof child === 'boolean') return;

    if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
        return;
    }

    if (typeof child === 'function') {
        const textNode = document.createTextNode('');
        createEffect(() => {
            const resolved = child();
            if (resolved instanceof Node) {
                textNode.replaceWith(resolved);
            } else {
                textNode.nodeValue = (resolved === null || resolved === undefined || typeof resolved === 'boolean')
                    ? ''
                    : String(resolved);
            }
        });
        element.appendChild(textNode);
        return;
    }

    if (child instanceof Promise) {
        const placeholder = document.createComment('async-node');
        element.appendChild(placeholder);
        child.then(resolved => {
            if (resolved instanceof Node) {
                placeholder.replaceWith(resolved);
            } else if (resolved !== null && resolved !== undefined) {
                placeholder.replaceWith(document.createTextNode(String(resolved)));
            } else {
                placeholder.remove();
            }
        });
        return;
    }

    if (Array.isArray(child)) {
        child.forEach(c => appendChild(element, c));
        return;
    }

    if (child instanceof Node) {
        element.appendChild(child);
        return;
    }

    element.appendChild(document.createTextNode(String(child)));
}

export function appendChildren(element: Element | DocumentFragment, children: any[]): void {
    const fragment = document.createDocumentFragment();
    children.flat(Infinity).forEach(child => appendChild(fragment, child));
    element.appendChild(fragment);
}