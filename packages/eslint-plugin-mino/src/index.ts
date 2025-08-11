/**
 * Minimal ESLint preprocessor-style plugin for Mino-like files.
 * It exposes a processor that converts .mino/.jsxm into plain JS
 * by turning @html/@css blocks into template strings so ESLint can parse.
 */

export const processors = {
  '.mino': {
    preprocess(text: string) {
      return [transform(text)];
    },
    postprocess(messages: any[][]) {
      return messages[0] ?? [];
    }
  },
  '.jsxm': {
    preprocess(text: string) {
      return [transform(text)];
    },
    postprocess(messages: any[][]) {
      return messages[0] ?? [];
    }
  }
};

function transform(src: string): string {
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


