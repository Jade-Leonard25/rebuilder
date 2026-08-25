// packages/system/src/factorysystem/index.ts

export * from './types';
export * from './tags';
export * from './signals';
export * from './effects';
export * from './state';
export * from './event-manager';
export * from './refs';
export * from './fragment';
export * from './control-flow';
export { r, rProxy as default, createElement } from './factory';

// Alias for common React-like API
export { objectFunction as useState } from './state';