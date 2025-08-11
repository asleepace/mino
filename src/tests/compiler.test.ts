import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { MinoCompiler } from '../compiler';

const compile = async (src: string, name = 'test.mino') => new MinoCompiler({ emitExports: true }).compile(src, name);

test('assignment without params compiles to template string (captures outer vars)', async () => {
  const src = `const userId = 1;\nconst tpl = @html { <div>${'${userId}'}</div> }`;
  const out = await compile(src);
  assert.match(out, /export const tpl = `.*<div>\$\{userId\}<\/div>.*`;/s);
});

test('compiles css assignment to template string by default', async () => {
  const src = `const css = @css { .a { color: red; } }`;
  const out = await compile(src);
  assert.match(out, /export const css = `.*\.a \{ color: red; \}.*`;/s);
});

test('handles bare blocks as inert', async () => {
  const src = `@html { <br/> }\nconst after = 1;`;
  const out = await compile(src);
  assert.match(out, /void `<br\/>`;/);
  assert.match(out, /const after = 1;/);
});

test('trims template contents', async () => {
  const src = `const t = @html {\n  <p> hi </p>\n}\n`;
  const out = await compile(src);
  assert.match(out, /export const t = `<p> hi <\/p>`;/);
});

test('shorthand parameters: const f = @html(x, y) { ... } emits a function', async () => {
  const src = `const f = @html(x, y) { <p>${'${x + y}'}</p> }`;
  const out = await compile(src);
  assert.match(out, /export const f = \(x, y\) => `<p>\$\{x \+ y\}<\/p>`;/);
});


