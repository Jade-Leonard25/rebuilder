# Troubleshooting Guide

## Electron Module Format Error

### Problem
When running `npm run dev`, the Electron app fails with:

```
SyntaxError: Cannot use import statement outside a module
```

This occurs in `dist/electron/main.cjs` despite setting `format: 'cjs'` in the Vite config.

### Root Cause
Vite/Rollup was configured to output CommonJS format (`.cjs` files) but was actually generating ES module syntax (`import` statements). Node.js interprets `.cjs` files as CommonJS, which doesn't support `import` statements, causing the syntax error.

### Solution
Changed the Electron build configuration to output ES modules instead of CommonJS:

#### 1. Updated `vite.config.ts`
Changed both the main process and preload script configurations:

```typescript
// Before (broken)
output: {
  format: 'cjs',
  entryFileNames: '[name].cjs',
  chunkFileNames: '[name].cjs',
}

// After (working)
output: {
  format: 'es',
  entryFileNames: '[name].mjs',
  chunkFileNames: '[name].mjs',
}
```

#### 2. Updated `package.json`
Changed the main entry point to reference the new `.mjs` file:

```json
// Before
"main": "dist/electron/main.cjs"

// After
"main": "dist/electron/main.mjs"
```

### Why This Works
- `.mjs` files are recognized by Node.js as ES modules
- ES module format matches the `import/export` syntax in the source code
- The `"type": "module"` setting in `package.json` allows `.mjs` files to load properly
- Electron supports ES modules natively

### Files Modified
- `vite.config.ts` - Changed output format and file extensions
- `package.json` - Updated main entry point

### Verification
After the fix, running `npm run dev` should show:
```
✓ modules transformed
dist/electron/preload.mjs  0.77 kB
dist/electron/main.mjs     5.76 kB
built in [time]ms

[exited with code 0]
```

No module errors should appear.

---

## Module Import Errors

### Problem
When trying to use framework modules in routes or components, you get errors like:

```
Cannot find module '@rebuilder/system'
Module 'useState' is not exported from '@rebuilder/system'
ReferenceError: r is not defined
```

### Root Cause
There were multiple module import issues:
1. `useState` was not exported from the system module (only `objectFunction` existed)
2. Compiler codegen used wrong import path (`@/system/factorysystem/config`)
3. Generated route templates didn't include necessary imports
4. Existing route files were missing import statements

### Solution

#### 1. Add `useState` Export
**File:** `src/system/index.ts`

Add this line at the end:
```typescript
export { objectFunction as useState } from './state';
```

#### 2. Fix Compiler Import Path
**File:** `src/compiler/codegen.ts`

Change line 23 from:
```typescript
} from '@/system/factorysystem/config';
```

To:
```typescript
} from '@rebuilder/system';
```

#### 3. Fix Template Generator
**File:** `src/cli/src/commands/create-router.ts`

Change line 107 from:
```typescript
import { r } from '@rebuilder/system/factory';
```

To:
```typescript
import { r } from '@rebuilder/system';
```

#### 4. Fix Existing Route Files
Add imports to any existing route files:

```typescript
import { r } from '@rebuilder/system';

export const metadata = {
  // ... your metadata
};

export default function YourPage() {
  return r.div(
    // ... your content
  );
}
```

### Available Modules
After the fix, you can import:

```typescript
import { 
  // Factory
  r, createElement,
  
  // State
  createSignal,    // [get, set] = createSignal(initialValue)
  useState,        // state = useState(initialValue)
  objectFunction,  // same as useState
  
  // Effects
  createEffect,    // createEffect(() => { ... })
  createComputed,  // computed = createComputed(() => value)
  
  // Control Flow
  Show,            // Show({ when, children, fallback })
  For,             // For({ each, children })
  Fragment,        // Fragment({ children })
  
  // Refs
  useRef,
  createRef,
  
  // Types
  type Component,
  type Child,
  type ElementProps,
  type SignalGetter,
  type SignalSetter,
} from '@rebuilder/system';
```

### Usage Examples

**Counter with createSignal:**
```typescript
import { r, createSignal } from '@rebuilder/system';

export default function CounterPage() {
  const [count, setCount] = createSignal(0);
  
  return r.div(
    r.button(
      { onClick: () => setCount(c => c + 1) },
      `Count: ${count()}`
    )
  );
}
```

**Counter with useState:**
```typescript
import { r, useState } from '@rebuilder/system';

export default function CounterPage() {
  const count = useState(0);
  
  return r.div(
    r.button(
      { onClick: () => count.set(c => c + 1) },
      `Count: ${count()}`
    )
  );
}
```

**Conditional Rendering:**
```typescript
import { r, createSignal, Show } from '@rebuilder/system';

export default function TodoPage() {
  const [done, setDone] = createSignal(false);
  
  return r.div(
    Show({
      when: done,
      children: () => r.p('✅ Complete!'),
      fallback: r.p('⏳ Pending...')
    })
  );
}
```

**List Rendering:**
```typescript
import { r, For } from '@rebuilder/system';

export default function ListPage() {
  const items = ['Apple', 'Banana', 'Cherry'];
  
  return r.ul(
    For({
      each: () => items,
      children: (item) => r.li(item)
    })
  );
}
```

### Verification
After applying fixes, verify with:

```bash
npm run build
```

Should show:
```
✓ 21 modules transformed
✓ dist/index.js (12.88 KB)
✓ All builds completed
```

Test imports:
```bash
node --input-type=module --eval "
import { r, createSignal, useState, Show, For } from './dist/index.js';
console.log('All modules:', typeof r, typeof createSignal, typeof useState);
"
```

Should output:
```
All modules: function function function
```

---

## Date Fixed
2026-08-25
