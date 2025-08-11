// README.md
# Mino Language Support for VS Code

This extension provides language support for Mino (`.mino`) files and `.jsxm` (JavaScript with inline `@html/@css`). It injects highlighting for blocks and compiles to JavaScript, and includes a TS server plugin so IntelliSense works in `.jsxm`.

## Features

- **Syntax Highlighting**: Embedded CSS and HTML inside `@css { ... }` and `@html { ... }` blocks
- **Injection in JS/TS**: Highlights blocks in `.js/.ts/.jsx/.tsx` when using `const name = @html/@css { ... }`
- **Snippets**: Quick insertion for `const name = @css {}` and `const name = @html {}`
- **Hover/Completion/Validation**: Helpers and diagnostics for v2.0 assignment syntax
- **Compiler**: Compile `.mino` → `.js` with param detection from `${...}` interpolations
- **.jsxm Support**: Use `.jsxm` files (JavaScript + Mino) and compile/transform to `.js`

## Quick setup (per project)

1) Install the extension

2) Workspace settings (`.vscode/settings.json`)

```json
{
  "files.associations": { "*.jsxm": "javascript" },
  "javascript.validate.enable": false
}
```

3) Optional `jsconfig.json`

```json
{
  "compilerOptions": { "checkJs": true },
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.jsxm", "src/**/*.mino"]
}
```

## Example (v2.0 assignment syntax)

```mino
// css syntax highlighting
const styleSheet = @css {
  .primary-button { padding: 8px; color: black; }
}

// html syntax highlighting
const MyButton = @html {
  <button class="primary-button">${name}</button>
}

// normal js
const render = (name) => MyButton(name)

// Compiled JS (simplified)
// const styleSheet = () => `.primary-button { padding: 8px; color: black; }`
// const MyButton = (name) => `<button class="primary-button">${name}</button>`
```

## Commands

- `Mino: Compile Mino File` (`mino.compileFile`): Compile the active `.mino` file to JS

## Settings

- `mino.autoCompile` (boolean, default: true): Automatically compile `.mino` files on save
- `mino.outputDirectory` (string, default: "./dist"): Output directory for compiled JS (workspace-relative or absolute)
- `mino.showCompileNotifications` (boolean, default: true): Show a notification when compilation completes or fails

## Vanilla JS support (.jsxm)

- Use `.jsxm` files: write JavaScript with `@html/@css` blocks. The extension highlights them, and the compiler (or bundler plugins) transforms them to `.js`.
- Node loader: `node --loader ./scripts/loader.mjs app.js` to load `.jsxm` at runtime.
- Vite: add the provided `vite-plugin-mino` to transform `.jsxm`/`.mino`.
- esbuild: add `scripts/esbuild-plugin-mino.js`.

## ESLint integration

Option A (processor for `.jsxm` and `.mino`):

```json
{
  "plugins": ["mino"],
  "overrides": [
    { "files": ["**/*.jsxm"], "processor": "mino/.jsxm" },
    { "files": ["**/*.mino"], "processor": "mino/.mino" }
  ]
}
```

Option B (treat `.jsxm` as JS only):

```json
{
  "overrides": [ { "files": ["**/*.jsxm"], "parserOptions": { "ecmaVersion": 2022, "sourceType": "module" } } ]
}
```

- For `.mino`, either compile first (auto-compile on save) or use the processor.

## Vite integration

```ts
import mino from './scripts/vite-plugin-mino';

export default {
  plugins: [mino()],
};
```

## Building Extension

```bash
# 1. Ensure everything compiles cleanly
npm run compile

# 2. Package the extension
npx @vscode/vsce package

# 3. Test the packaged extension
code --install-extension mino-lang-*.vsix
cursor --install-extension mino-lang-*.vsix
```

Or you can use the following helper:

```bash
bash ./build.sh
```

## Troubleshooting

- “Decorators are not valid here” in `.jsxm`
  - Ensure the status bar shows “JavaScript” (not “JavaScript (Babel)”) for `.jsxm`
  - Settings: `files.associations` mapping to JavaScript and `javascript.validate.enable: false`
  - Ensure a JS/TS language service is available (built‑in or “JavaScript and TypeScript Nightly”)

- IntelliSense is missing in `.jsxm`
  - Reload window (TS server plugin loads)
  - Add a `jsconfig.json` with `include` for `.jsxm`
  - Add at least one import/export
  - “TypeScript: Restart TS server”

- Arrow-return highlighting is inconsistent
  - Prefer shorthand: `const tmpl = @html(x) { ... }`
  - Arrow-return compiles but shorthand highlights more reliably

- Assignment blocks compile to JS functions with detected parameters based on `${...}` expressions.
- Bare blocks (`@html { ... }`, `@css { ... }`) are allowed and compiled to inert `void` template expressions for valid JS output.

## Requirements

- VS Code 1.74.0 or higher
- Node.js (for compilation features)

## Testing

- A basic sample is under `src/tests/example.mino`. Saving this file will generate `dist/example.js`.
- You can run the built compiler via Node to verify output, or use the command palette to compile the active file.

## Contributing

This extension is open source. Contributions welcome!

## License

MIT