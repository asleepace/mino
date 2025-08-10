"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const compiler_1 = require("../compiler");
const compile = async (src, name = 'test.mino') => new compiler_1.MinoCompiler({ emitExports: true }).compile(src, name);
(0, node_test_1.test)('compiles html assignment with param detection', async () => {
    const src = `const tpl = @html { <div>${'${user.name}'}</div> }`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /const tpl = \(user\) =>/);
    node_assert_1.strict.match(out, />\$\{user\.name\}</);
});
(0, node_test_1.test)('compiles css assignment', async () => {
    const src = `const css = @css { .a { color: red; } }`;
    const out = await compile(src);
    node_assert_1.strict.match(out, /export const css = \(\) =>/);
    node_assert_1.strict.match(out, /\.a \{ color: red; \}/);
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
    node_assert_1.strict.match(out, /export const t = \(\) => `<p> hi <\/p>`;/);
});
//# sourceMappingURL=compiler.test.js.map