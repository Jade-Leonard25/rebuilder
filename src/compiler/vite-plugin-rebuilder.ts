// src/compiler/vite-plugin-rebuilder.ts
import type { Plugin } from 'vite';
import { parseSFC } from './parser.ts';
import { generateCode } from './codegen.ts';

export function rebuilderPlugin(): Plugin {
  return {
    name: 'vite-plugin-rebuilder',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (id.endsWith('.rebuilder') || id.includes('.rebuilder?')) {
        const cleanId = id.split('?')[0];
        try {
          const parsed = parseSFC(code);
          const transformed = generateCode(parsed, cleanId);
          return {
            code: transformed,
            map: null,
          };
        } catch (err) {
          console.error(`[Rebuilder Compiler] Error in ${id}:`, err);
          throw err;
        }
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.rebuilder')) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      }
    },
  };
}

export default rebuilderPlugin;

