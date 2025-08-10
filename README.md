// README.md
# Mino Language Support for VS Code

This extension provides language support for Mino (`.mino`) files and injects highlighting for `@html` and `@css` blocks inside JS/TS. It also compiles `.mino` files to JavaScript.

```bash
# 1. Ensure everything compiles cleanly
npm run compile

# 2. Package the extension
npx @vscode/vsce package

# 3. Test the packaged extension
code --install-extension mino-lang-*.vsix
```

## Features

- **Syntax Highlighting**: Embedded CSS and HTML inside `@css { ... }` and `@html { ... }` blocks
- **Injection in JS/TS**: Highlights blocks in `.js/.ts/.jsx/.tsx` when using `const name = @html/@css { ... }`
- **Snippets**: Quick insertion for `const name = @css {}` and `const name = @html {}`
- **Hover/Completion/Validation**: Helpers and diagnostics for v2.0 assignment syntax
- **Compiler**: Compile `.mino` → `.js` with param detection from `${...}` interpolations

## Quick Start

1. Install the extension
2. Create a new file with `.mino` extension
3. Type `component` and press Tab to insert a component template
4. Use Ctrl+Shift+M (Cmd+Shift+M on Mac) to compile

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

## How it works

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