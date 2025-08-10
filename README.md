// README.md
# Mino Language Support for VS Code

This extension provides comprehensive language support for Mino (.mino) component files.

```bash
# 1. Ensure everything compiles cleanly
npm run compile

# 2. Package the extension
npx @vscode/vsce package

# 3. Test the packaged extension
code --install-extension mino-lang-*.vsix
```

## Features

- **Syntax Highlighting**: Full syntax highlighting for Mino directives, CSS, HTML, and JavaScript
- **IntelliSense**: Auto-completion for directives, modifiers, and properties
- **Code Snippets**: Quick insertion of common Mino patterns
- **Symbol Navigation**: Outline view and go-to-definition for components
- **Auto-compilation**: Compile .mino files to JavaScript on save
- **Error Detection**: Real-time validation and error reporting

## Quick Start

1. Install the extension
2. Create a new file with `.mino` extension
3. Type `component` and press Tab to insert a component template
4. Use Ctrl+Shift+M (Cmd+Shift+M on Mac) to compile

## Example Component

\`\`\`mino
@template {
  <div class="my-button {disabled ? 'disabled' : ''}">
    <button onclick="{handleClick}">{label}</button>
  </div>
}
@end

@style {
  .my-button button {
    background: var(--primary-color, #007bff);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    color: white;
    cursor: pointer;
  }
  
  .my-button.disabled button {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
@end

@prop (reactive) label = "Click me"
@prop (reactive) disabled = false

@method (private) handleClick() {
  if (!this.disabled) {
    this.emit('button-click', { label: this.label });
  }
}
@end

@onMounted {
  console.log('Button component mounted');
}
@end
\`\`\`

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