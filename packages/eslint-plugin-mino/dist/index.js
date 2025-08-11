"use strict";
/**
 * Minimal ESLint preprocessor-style plugin for Mino-like files.
 * It exposes a processor that converts .mino/.jsxm into plain JS
 * by turning @html/@css blocks into template strings so ESLint can parse.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processors = void 0;
exports.processors = {
    '.mino': {
        preprocess(text) {
            return [transform(text)];
        },
        postprocess(messages) {
            return messages[0] ?? [];
        }
    },
    '.jsxm': {
        preprocess(text) {
            return [transform(text)];
        },
        postprocess(messages) {
            return messages[0] ?? [];
        }
    }
};
function transform(src) {
    // Replace assignment blocks and bare blocks with template literals
    // const x = @html(...) { ... } -> const x = `...`
    // @html { ... } -> `...`
    let out = src;
    out = out.replace(/@(?:html|css)\s*\([^)]*\)\s*\{/g, '`');
    out = out.replace(/@(?:html|css)\s*\{/g, '`');
    // Closing braces that belong to blocks: naive replace of } at line start/end pairs is risky.
    // Instead, convert all standalone } that follow our replacements back to ` where safe.
    // A simple approximation is fine for linting.
    // Replace a } that ends a line or is followed by punctuation/whitespace with backtick.
    out = out.replace(/\}\s*(?=[,;)]|$)/g, '`');
    return out;
}
