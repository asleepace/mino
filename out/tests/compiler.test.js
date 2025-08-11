"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const compiler_1 = require("../compiler");
const compile = async (src, name = 'test.mino') => new compiler_1.MinoCompiler({ emitExports: true }).compile(src, name);
(0, node_test_1.test)('assignment without params compiles to template string (captures outer vars)', async () => {
    const src = `const userId = 1;\nconst tpl = @html { <div>${'${userId}'}</div> }`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /export const tpl = `.*<div>\$\{userId\}<\/div>.*`;/s);
});
(0, node_test_1.test)('compiles css assignment to template string by default', async () => {
    const src = `const css = @css { .a { color: red; } }`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /export const css = `.*\.a \{ color: red; \}.*`;/s);
});
(0, node_test_1.test)('handles bare blocks as inert', async () => {
    const src = `@html { <br/> }\nconst after = 1;`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /void `<br\/>`;/);
    node_assert_1.strict.match(out, /const after = 1;/);
});
(0, node_test_1.test)('trims template contents', async () => {
    const src = `const t = @html {\n  <p> hi </p>\n}\n`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /export const t = `<p> hi <\/p>`;/);
});
(0, node_test_1.test)('shorthand parameters: const f = @html(x, y) { ... } emits a function', async () => {
    const src = `const f = @html(x, y) { <p>${'${x + y}'}</p> }`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /export const f = \(x, y\) => `<p>\$\{x \+ y\}<\/p>`;/);
});
//# sourceMappingURL=compiler.test.js.map