// packages/system/src/factorysystem/types.ts

export type Component<P = any> = (props: P) => Node | Node[] | null | undefined;

export type DynamicValue<T> = T | (() => T);

export type Child =
    | Node
    | string
    | number
    | boolean
    | null
    | undefined
    | Promise<Node>
    | (() => Child)
    | Child[];

export interface RefObject<T = HTMLElement> {
    current: T | null;
}

export type RefCallback<T = HTMLElement> = (el: T | null) => void;

export interface ElementProps {
    key?: string | number;
    ref?: RefObject<any> | RefCallback<any> | string;
    className?: DynamicValue<string | Record<string, boolean> | (string | boolean | undefined | null)[]>;
    style?: DynamicValue<Partial<CSSStyleDeclaration> | Record<string, string | number>>;
    dataset?: Record<string, DynamicValue<string | number | boolean>>;
    aria?: Record<string, DynamicValue<string | number | boolean>>;
    [key: string]: any;
}