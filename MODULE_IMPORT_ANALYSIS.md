# Module Import Issues - Analysis & Fixes

**Date:** 2026-08-25  
**Status:** 🔴 Critical Issues Found

---

## Problems Identified

### 1. ❌ Missing `useState` Export

**Issue:** The compiler codegen imports `useState` but it doesn't exist in your system.

**Location:** `src/compiler/codegen.ts:14`
```typescript
import {
  r,
  useState,  // ❌ DOES NOT EXIST
  createSignal,
  createEffect,
  // ...
}
```

**Available in System:**
- ✅ `createSignal` - exists in `signals.ts`
- ✅ `createEffect` - exists in `effects.ts`
- ✅ `objectFunction` - exists in `state.ts` (but not exported as `useState`)
- ❌ `useState` - **NOT EXPORTED**

**Fix Required:**
Add to `src/system/state.ts`:
```typescript
export { objectFunction as useState };
```

Or add to `src/system/index.ts`:
```typescript
export { objectFunction as useState } from './state';
```

---

### 2. ❌ Wrong Import Path in Codegen

**Issue:** The compiler generates imports from a non-existent path.

**Current (WRONG):**
```typescript
import { ... } from '@/system/factorysystem/config';
```

**Problems:**
- ❌ `/factorysystem/config` doesn't exist
- ❌ Should be `@/system` or `@rebuilder/system`

**Correct Path:**
```typescript
import { ... } from '@rebuilder/system';
// OR
import { ... } from '@/system';
```

**Where to Fix:** `src/compiler/codegen.ts:23`

---

### 3. ❌ Missing `r` Import in Generated Routes

**Issue:** Templates use `r.div()` but don't import it.

**Current Template Output (`sign-in/index.ts`):**
```typescript
export default function SigninPage() {
  return r.div(  // ❌ 'r' is not imported!
    r.h1('Sign-in'),
    // ...
  );
}
```

**Fix Required:** Add import statement to template generator.

**Location:** `src/cli/src/commands/create-router.ts:106-107`

---

### 4. ⚠️ Inconsistent Path Aliases

**Issue:** Multiple alias patterns are used inconsistently:
- `@/system` (local development)
- `@rebuilder/system` (framework usage)
- `@/system/factorysystem/config` (wrong path in codegen)

**Locations:**
- `vite.config.ts:74-76` defines aliases
- `src/compiler/codegen.ts:23` uses wrong path
- CLI templates use `@rebuilder/system`

---

## Complete Fix Implementation

### Fix 1: Add `useState` Export

**File:** `src/system/index.ts`

```typescript
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

// Add this line:
export { objectFunction as useState } from './state';
```

---

### Fix 2: Correct Codegen Import Path

**File:** `src/compiler/codegen.ts`

**Change Line 23 from:**
```typescript
} from '@/system/factorysystem/config';
```

**To:**
```typescript
} from '@rebuilder/system';
```

Or use the local alias:
```typescript
} from '@/system';
```

---

### Fix 3: Add Missing Import to Router Template

**File:** `src/cli/src/commands/create-router.ts`

**Change Line 106-107 from:**
```typescript
function generatePage(
  componentName: string,
  routePath: string
): string {
  return `import type { RouteContext } from '@rebuilder/config/config';
import { r } from '@rebuilder/system/factory';
```

**To:**
```typescript
function generatePage(
  componentName: string,
  routePath: string
): string {
  return `import type { RouteContext } from '@rebuilder/config/config';
import { r } from '@rebuilder/system';
```

**Note:** Import from index, not directly from factory file.

---

### Fix 4: Update Existing Route Files

**File:** `src/routing/sign-in/index.ts` and others

**Add this import at the top:**
```typescript
import { r } from '@rebuilder/system';

export const metadata = {
  // ...
```

---

## Module Availability Summary

### ✅ Available & Working:
```typescript
import {
  // Factory
  r,
  createElement,
  
  // Signals
  createSignal,
  
  // Effects
  createEffect,
  createComputed,
  
  // Control Flow
  Show,
  For,
  
  // Fragment
  Fragment,
  
  // Refs
  useRef,
  createRef,
  
  // State (after fix)
  useState,  // Will work after adding export
  objectFunction,
  
  // Types
  // (all types from types.ts)
} from '@rebuilder/system';
```

### ❌ Referenced but Missing:
- `useState` - needs to be aliased from `objectFunction`
- `router` object - not implemented yet
- Route navigation helpers

---

## Testing After Fixes

### 1. Test Signal Usage:
```typescript
import { createSignal } from '@rebuilder/system';

const [count, setCount] = createSignal(0);
return r.div(
  r.button(
    { onClick: () => setCount(c => c + 1) },
    `Count: ${count()}`
  )
);
```

### 2. Test useState (after fix):
```typescript
import { useState } from '@rebuilder/system';

const count = useState(0);
return r.div(
  r.button(
    { onClick: () => count.set(c => c + 1) },
    `Count: ${count()}`
  )
);
```

### 3. Test Control Flow:
```typescript
import { r, Show, createSignal } from '@rebuilder/system';

const [visible, setVisible] = createSignal(true);
return r.div(
  Show({
    when: visible,
    children: () => r.p('I am visible!'),
    fallback: r.p('Hidden')
  })
);
```

---

## Priority Order

1. 🔴 **CRITICAL** - Fix codegen import path (breaks compilation)
2. 🔴 **CRITICAL** - Add useState export (breaks generated code)
3. 🟡 **HIGH** - Add r import to template generator
4. 🟡 **HIGH** - Fix existing route files
5. 🟢 **MEDIUM** - Standardize path aliases across codebase

---

## Root Cause Analysis

**Why This Happened:**
1. Code was copy-pasted from a different project structure (`@/system/factorysystem/config`)
2. Export wasn't added when `objectFunction` was renamed conceptually to `useState`
3. Template generator assumed imports would "just work" via global scope
4. No integration tests to catch import errors

**Prevention:**
- Add build verification tests
- Test generated code actually compiles
- Use consistent import paths throughout
- Add TypeScript strict mode checks

---

## Next Steps

1. Apply all 4 fixes above
2. Run `npm run build` to verify
3. Test `rebuilder create-router test-page`
4. Verify generated page compiles
5. Test in browser with `npm run dev`

---

## Expected Outcome

After fixes, this should work:

```typescript
// src/routing/example/index.ts
import { r, useState, createSignal, Show } from '@rebuilder/system';
import type { RouteContext } from '@rebuilder/config/config';

export const metadata = {
  title: 'Example',
  path: '/example',
};

export default function ExamplePage(context?: RouteContext) {
  const [count, setCount] = createSignal(0);
  const message = useState('Hello');
  
  return r.div(
    { className: 'p-6' },
    
    r.h1({ className: 'text-2xl' }, message()),
    
    r.button(
      { 
        onClick: () => setCount(c => c + 1),
        className: 'px-4 py-2 bg-blue-500 text-white'
      },
      `Clicked ${count()} times`
    ),
    
    Show({
      when: () => count() > 5,
      children: () => r.p('You clicked more than 5 times!')
    })
  );
}
```

---

**Status:** Ready to implement fixes. All issues are fixable with small changes.
