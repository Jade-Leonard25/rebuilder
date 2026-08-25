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

## Date Fixed
2026-08-25
