import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { rebuilderPlugin } from './src/compiler/vite-plugin-rebuilder.ts';

const rootDir = import.meta.dirname ?? process.cwd();

export default defineConfig({
  plugins: [
    rebuilderPlugin(),

    tailwindcss(),

    electron([
      {
        // ✅ Fixed - Electron main process
        entry: 'src/electron/src/main.ts',

        onstart(options) {
          options.startup();
        },

        vite: {
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name].cjs',
                assetFileNames: '[name].[ext]'
              }
            },
          },
        },
      },

      {
        // ✅ Fixed - Preload
        entry: 'src/electron/src/preload.ts',

        onstart(options) {
          options.reload();
        },

        vite: {
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name].cjs',
                assetFileNames: '[name].[ext]'
              }
            }
          },
        },
      },
    ]),

    renderer(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@rebuilder/system': path.resolve(rootDir, './src/system'),
      '@rebuilder/config': path.resolve(rootDir, './src/config'),
      '@rebuilder/electron': path.resolve(rootDir, './src/electron/src'),
      '@rebuilder/cli': path.resolve(rootDir, './cli/src'),
      '@rebuilder/core': path.resolve(rootDir, './src/electron/src/types'),
    },

    extensions: ['.mjs', '.js', '.ts', '.json', '.rebuilder'],
  },

  // ✅ Add root and build config
  root: rootDir,
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});