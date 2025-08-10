import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { MinoCompiler } from '../compiler';

const compile = async (src: string, name = 'test.mino') => new MinoCompiler({ emitExports: true }).compile(src, name);

test('compiles html assignment with param detection', async () => {
  const src = `const tpl = @html { <div>${'${user.name}'}</div> }`;
  const out = await compile(src);
  assert.match(out, /const tpl = \(user\) =>/);
  assert.match(out, />\$\{user\.name\}</);
});

test('compiles css assignment', async () => {
  const src = `const css = @css { .a { color: red; } }`;
  const out = await compile(src);
  assert.match(out, /export const css = \(\) =>/);
  assert.match(out, /\.a \{ color: red; \}/);
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
  assert.match(out, /export const t = \(\) => `<p> hi <\/p>`;/);
});


