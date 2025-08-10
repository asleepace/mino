# Mino Language Specification v2.0

## Overview

Mino is a JavaScript superset that adds CSS and HTML template literals through variable assignment syntax. Templates support `${expression}` interpolation and compile to JavaScript functions returning strings.

## Language Goals

- **Minimal Syntax**: Single assignment operator with template blocks
- **Template Interpolation**: Standard `${variable}` syntax in both CSS and HTML
- **Tool-Friendly**: Unambiguous parsing for reliable IDE support
- **JavaScript Compatible**: Direct compilation to standard ES modules

## Syntax Specification

### Grammar

```ebnf
mino_file = (javascript_statement | mino_assignment | mino_bare_block)*
mino_assignment = variable_declaration "=" "@" block_type block_content
mino_bare_block = "@" block_type block_content
variable_declaration = ("const" | "let" | "var") identifier
block_type = "css" | "html"
block_content = "{" template_content "}"
template_content = (text | interpolation)*
interpolation = "${" javascript_expression "}"
identifier = [a-zA-Z_$][a-zA-Z0-9_$]*
```

### CSS Templates

CSS templates define reusable stylesheets with interpolation:

```mino
const buttonStyles = @css {
  .btn {
    background: ${primaryColor};
    color: ${textColor};
    padding: 8px 16px;
    border-radius: 4px;
  }
}

const mediaQuery = @css {
  @media (min-width: ${breakpoint}) {
    .container { max-width: ${maxWidth}; }
  }
}
```

### HTML Templates

HTML templates define reusable markup with interpolation:

```mino
const userCard = @html {
  <div class="user-card">
    <img src="${user.avatar}" alt="${user.name}" />
    <h3>${user.name}</h3>
    <p>${user.email}</p>
  </div>
}

const productList = @html {
  <div class="product-grid">
    ${products.map(product => `
      <div class="product-item">
        <h4>${product.name}</h4>
        <span>$${product.price}</span>
      </div>
    `).join('')}
  </div>
}
```

### Template Interpolation

JavaScript expressions are embedded using `${expression}` syntax:

- **Variables**: `${color}`, `${user.name}`
- **Function calls**: `${formatDate(date)}`, `${getTheme()}`
- **Expressions**: `${isActive ? 'active' : 'inactive'}`
- **Template composition**: `${otherTemplate}`

## Compilation

Mino templates compile to JavaScript functions:

```mino
// Source
const styles = @css {
  .btn { color: ${color}; }
}

const greeting = @html {
  <h1>Hello ${name}!</h1>
}

// Compiled
const styles = (color) => `
  .btn { color: ${color}; }
`;

const greeting = (name) => `
  <h1>Hello ${name}!</h1>
`;
```

### Parameter Detection

The compiler automatically detects interpolated variables and generates function parameters:

```mino
// Detects: user, showEmail, theme
const profile = @html {
  <div class="${theme}">
    <h2>${user.name}</h2>
    ${showEmail ? `<p>${user.email}</p>` : ''}
  </div>
}

// Compiles to:
const profile = (user, showEmail, theme) => `...`;
```

## Language Constraints

### Scoping Rules

1. **Top-level only for assignments**: Variable-declared templates must be at module scope
2. **No nesting (assignments)**: Assigned templates cannot be declared inside functions or blocks
3. **Bare blocks**: `@css {}` and `@html {}` without assignment are allowed anywhere for embedded highlighting
4. **Module scope**: Template variables are available throughout the module

### Validation Rules

1. **Valid identifiers**: Template names must follow JavaScript identifier rules
2. **Unique names**: No duplicate template names in the same module
3. **Matched braces**: Template blocks must have balanced `{}`
4. **Usage**: `@css` and `@html` valid in variable assignments and as bare blocks

## File Structure

```mino
// Standard JavaScript imports
import { users } from './data.js';
import { formatDate } from './utils.js';

// CSS templates
const cardStyles = @css {
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
  }
}

// HTML templates
const userCard = @html {
  <div class="card">
    <style>${cardStyles}</style>
    <h3>${user.name}</h3>
    <p>Joined: ${formatDate(user.createdAt)}</p>
  </div>
}

// Standard JavaScript functions
function renderUsers() {
  return users.map(user => userCard(user)).join('');
}

// Standard exports
export { cardStyles, userCard, renderUsers };
```

## Error Handling

### Compilation Errors

- **Invalid template names**: Non-identifier names
- **Duplicate declarations**: Multiple templates with same name
- **Invalid nesting**: Templates inside functions/classes
- **Unmatched braces**: Malformed template blocks
- **Invalid usage**: `@css`/`@html` not followed by `{` or assignment

### Runtime Behavior

- **Parameter validation**: Runtime responsibility
- **Template interpolation**: Standard JavaScript template literal evaluation
- **XSS protection**: User responsibility for content sanitization

## Build Integration

### File Processing

- **Input**: `.mino` files
- **Output**: `.js` ES modules
- **Source maps**: Preserved for debugging
- **Watch mode**: Hot reload support

### IDE Support

- **Syntax highlighting**: CSS/HTML within template blocks and bare blocks
- **Error reporting**: Real-time compilation errors
- **IntelliSense**: Variable completion within interpolations
- **Refactoring**: Template variable renaming

## Future Enhancements

- **TypeScript integration**: Type annotations for template parameters
- **Import templates**: Cross-module template sharing
- **CSS preprocessing**: Sass-like features
- **Optimization**: Compile-time minification
- **Web Components**: Direct custom element compilation