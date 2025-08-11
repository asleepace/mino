import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MinoCompiler } from '../out/compiler.js';

const compiler = new MinoCompiler();

export async function resolve(specifier, context, next) {
  if (specifier.endsWith('.jsxm')) {
    const resolved = new URL(specifier, context.parentURL).href;
    return { url: resolved }; 
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.jsxm')) {
    const filename = fileURLToPath(url);
    const src = await readFile(filename, 'utf8');
    const code = await compiler.compile(src, filename);
    return { format: 'module', source: code };
  }
  return next(url, context);
}


