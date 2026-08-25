import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/system/index.ts',
    factory: 'src/system/factory.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
})
