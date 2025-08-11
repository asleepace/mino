import type { Plugin } from 'vite';
import { MinoCompiler } from '../out/compiler.js';

export default function minoPlugin(): Plugin {
  const compiler = new MinoCompiler();
  return {
    name: 'vite-plugin-mino',
    enforce: 'pre',
    async transform(code, id) {
      if (id.endsWith('.jsxm') || id.endsWith('.mino')) {
        const out = await compiler.compile(code, id);
        return { code: out, map: null };
      }
      return null;
    },
    resolveId(source) {
      if (source.endsWith('.jsxm')) return source;
      return null;
    }
  };
}


