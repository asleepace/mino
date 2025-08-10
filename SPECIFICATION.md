# Mino Language Specification v2.0

## Overview

Mino is a JavaScript superset that adds block-level CSS and HTML template definitions with explicit named parameters for better organization, tooling support, and developer experience.

## Language Goals

- **Familiar Syntax**: Extend JavaScript with minimal new concepts
- **Clear Boundaries**: Unambiguous block declarations for reliable parsing
- **Tool-Friendly**: Enable excellent IDE support and syntax highlighting
- **Type Safety**: Support future TypeScript integration
- **Build Integration**: Compile cleanly to standard JavaScript

## Syntax Specification

### Block Declaration Grammar

```ebnf
mino_file = (javascript_statement | mino_block)*
mino_block = "@" block_type identifier parameter_list "{" block_content "}"
block_type = "css" | "html"
identifier = [a-zA-Z_$][a-zA-Z0-9_$]*
parameter_list = "(" (parameter ("," parameter)*)? ")"
parameter = [a-zA-Z_$][a-zA-Z0-9_$]*
block_content = any_content_until_matching_brace
```

### CSS Blocks

CSS blocks define reusable stylesheets with optional parameters:

```mino
@css buttonStyles {
  .btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
  }
}

@css themedButton(primaryColor, textColor) {
  .themed-btn {
    background: ${primaryColor};
    color: ${textColor};
    transition: opacity 0.2s;
  }
  
  .themed-btn:hover {
    opacity: 0.8;
  }
}
```

### HTML Blocks

HTML blocks define reusable templates with explicit parameters:

```mino
@html userCard(user) {
  <div class="user-card">
    <img src="${user.avatar}" alt="${user.name}" />
    <h3>${user.name}</h3>
    <p>${user.email}</p>
  </div>
}

@html productList(products, onProductClick) {
  <div class="product-grid">
    ${products.map(product => `
      <div class="product-item" onclick="${onProductClick}('${product.id}')">
        <h4>${product.name}</h4>
        <span class="price">$${product.price}</span>
      </div>
    `).join('')}
  </div>
}
```

### Template Interpolation

Within HTML blocks, JavaScript expressions are embedded using `${expression}` syntax:

- **Simple variables**: `${name}`, `${user.email}`
- **Function calls**: `${formatDate(date)}`, `${capitalize(title)}`
- **Complex expressions**: `${condition ? 'active' : 'inactive'}`
- **Array operations**: `${items.map(item => item.name).join(', ')}`

### Scoping Rules

1. **Top-level only**: Blocks can only be declared at module scope
2. **No nesting**: Blocks cannot be declared inside functions, classes, or other blocks
3. **Module scope**: Block identifiers are available throughout the module
4. **Export support**: Blocks can be exported like any other declaration

## Compilation Target

Mino blocks compile to JavaScript functions:

```mino
// Source Mino
@css buttonStyles {
  .btn { color: red; }
}

@html greeting(name) {
  <h1>Hello ${name}!</h1>
}

// Compiled JavaScript  
const buttonStyles = () => `
  .btn { color: red; }
`;

const greeting = (name) => `
  <h1>Hello ${name}!</h1>
`;
```

## Language Features

### Parameter Declaration

Parameters must be explicitly declared in parentheses:

```mino
@html userProfile(user, showEmail, theme) {
  <div class="profile ${theme}">
    <h2>${user.name}</h2>
    ${showEmail ? `<p>${user.email}</p>` : ''}
  </div>
}
```

### Empty Parameter Lists

Blocks without parameters still require empty parentheses:

```mino
@css globalStyles() {
  * { margin: 0; padding: 0; }
}

@html header() {
  <header><h1>My App</h1></header>
}
```

### Comments

Standard JavaScript comments are supported:

```mino
// CSS utility classes
@css utilities() {
  .hidden { display: none; }
  .flex { display: flex; }
}

/* 
 * Multi-line comment
 * for complex templates
 */
@html complexForm(data, handlers) {
  <!-- HTML comments work inside blocks -->
  <form>${data.fields}</form>
}
```

## File Structure

Mino files use the `.mino` extension and can contain:

```mino
// Regular JavaScript imports/exports
import { users } from './data.js';
import { formatDate } from './utils.js';

// CSS blocks
@css cardStyles() {
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
  }
}

// HTML blocks
@html userCard(user) {
  <div class="card">
    <h3>${user.name}</h3>
    <p>Joined: ${formatDate(user.createdAt)}</p>
  </div>
}

// Regular JavaScript functions
function renderUsers() {
  return users.map(user => userCard(user)).join('');
}

// Exports
export { cardStyles, userCard, renderUsers };
```

## Error Handling

### Compilation Errors

1. **Invalid identifiers**: `@css 123invalid() {}` → Error
2. **Duplicate names**: Two blocks with same identifier → Error  
3. **Invalid nesting**: Blocks inside functions → Error
4. **Malformed parameters**: `@html test(,invalid)` → Error
5. **Unmatched braces**: Missing closing brace → Error

### Runtime Considerations

1. **Parameter validation**: Compiled functions receive declared parameters
2. **Template interpolation**: JavaScript expression evaluation at runtime
3. **XSS protection**: User responsibility to sanitize interpolated content

## Integration Guidelines

### Build Tools

- **File processing**: `.mino` → `.js` transformation
- **Source maps**: Preserve line numbers for debugging
- **Watch mode**: Hot reload on block changes
- **Tree shaking**: Support dead code elimination

### IDE Support

- **Syntax highlighting**: CSS/HTML within blocks
- **IntelliSense**: Parameter completion and validation
- **Error reporting**: Real-time compilation errors
- **Refactoring**: Rename blocks and parameters

### Type Safety

Future TypeScript integration:

```mino
interface User {
  name: string;
  email: string;
  avatar: string;
}

@html userCard(user: User) {
  <div class="card">
    <h3>${user.name}</h3>
  </div>
}
```

## Edge Cases

1. **Nested braces in CSS**: `@media {}` rules handled correctly
2. **Template literals in HTML**: JavaScript string interpolation preserved
3. **Special characters**: Quotes, backslashes escaped properly
4. **Large blocks**: No artificial size limits
5. **Unicode identifiers**: Standard JavaScript identifier rules apply

## Migration Path

### From v1.0 (Variable Assignment Syntax)

```mino
// v1.0 - Variable assignment
const styles = @css {
  .btn { color: red; }
}

// v2.0 - Block declaration  
@css styles() {
  .btn { color: red; }
}
```

### Automated Migration Tool

Planned tooling to convert existing Mino v1.0 codebases to v2.0 block syntax.

## Version History

- **v1.0**: Variable assignment syntax (`const x = @css {}`)
- **v2.0**: Block-level syntax with explicit parameters (`@css name() {}`)

## Future Enhancements

- **Nested blocks**: Conditional support for specific use cases
- **Import blocks**: `@import` syntax for sharing blocks across files
- **Preprocessing**: Sass-like features for CSS blocks
- **Optimization**: Compile-time CSS/HTML minification
- **Web Components**: Direct compilation to custom elements