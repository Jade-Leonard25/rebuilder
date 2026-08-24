// packages/system/src/factorysystem/fragment.ts

import { appendChildren } from './children';

export function Fragment(props: { children?: any[] }): DocumentFragment {
    const fragment = document.createDocumentFragment();
    appendChildren(fragment, props.children || []);
    return fragment;
}