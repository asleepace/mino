// README.md
# Mino Language Support for VS Code

This extension provides language support for Mino (.mino) files and injects highlighting for `@html` and `@css` blocks inside JS/TS as per the v2.0 spec.

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
```

## Configuration

- `mino.autoCompile`: Automatically compile .mino files on save (default: true)
- `mino.outputDirectory`: Output directory for compiled files (default: "./dist")
- `mino.showCompileNotifications`: Show notifications when compilation completes (default: true)

## Commands

- `Mino: Compile File` - Compile the current .mino file
- `Mino: Create New Component` - Create a new component with template

## Requirements

- VS Code 1.74.0 or higher
- Node.js (for compilation features)

## Release Notes

### 1.0.4

- Initial release
- Full syntax highlighting
- Basic compilation support
- IntelliSense and snippets

## Contributing

This extension is open source. Contributions welcome!

## License

MIT