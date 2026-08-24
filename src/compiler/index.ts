// src/compiler/index.ts
import { parseSFC } from './parser.ts';
import { generateCode } from './codegen.ts';
export { rebuilderPlugin } from './vite-plugin-rebuilder.ts';

export function compileRebuilder(source: string, filePath = 'Component.rebuilder'): string {
  const parsed = parseSFC(source);
  return generateCode(parsed, filePath);
}

export * from './parser.ts';
export * from './codegen.ts';
export * from './vite-plugin-rebuilder.ts';

