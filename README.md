# Mino
A simple meta language used to generate vanilla JS based web components.

# Component Language Specification v1.4.0

## Core Philosophy: Maximum Simplicity

Focus on the essentials: **properties**, **lifecycle**, **HTML**, **CSS**, **JS**. Everything else is convenience via aliases and directives.

## Unified Syntax (Simplified)

```
[@directive] [(...modifiers)] [name] [= value]
  [content]
[@end]
```

**Removed**: Type hints (`:Type`) - unnecessary complexity for web components where most attributes are strings.

## Only 3 Core Constructs

### 1. `@alias` - Remapping, composition, and expansion
```objc
// Simple remapping
@alias onClick = 'onclick'

// Modifier composition  
@alias (modifier) default = ['public', 'kebab', 'reactive']

// Function definitions
@alias (fn) slugify = (str) => str.toLowerCase().replace(/\s+/g, '-')

// Directive expansion (pipeline left→right)
@alias (directive) smartProp = ['public', 'kebab', 'reactive', 'validate']

// Token remapping for different contexts
@alias (token) component.name = 'customElements.define'
@alias (token) style.scope = 'this.shadowRoot'
```

### 2. `@directive` - Code generation functions
```objc
@directive directiveName(ast) {
  return generatedCode;
}
@end
```

### 3. `@[anything]` - User-defined constructs
```objc
@prop name = value
@style { css } @end  
@script { js } @end
@component { html } @end
@lifecycle connectedCallback { js } @end
```

All user constructs are processed by directives in a left→right pipeline.

## Language Features for VS Code

### CSS Syntax Highlighting
```objc
@style {
  /* CSS syntax highlighting here */
  .button {
    background: blue;
    border: none;
  }
}
@end
```

### HTML Syntax Highlighting  
```objc
@component {
  <!-- HTML syntax highlighting here -->
  <div class="card">
    <h2>{title}</h2>
    <button onclick="{handleClick}">Click me</button>
  </div>
}
@end
```

### JavaScript Syntax Highlighting
```objc
@script {
  // JavaScript syntax highlighting here
  const handleClick = () => {
    console.log('Clicked!');
    this.dispatchEvent(new CustomEvent('click'));
  };
}
@end

@lifecycle connectedCallback {
  // JavaScript syntax highlighting here
  this.render();
  this.setupEventListeners();
}
@end
```

## Enhanced @alias Capabilities

### Function Definitions
```objc
@alias (fn) validate = (value, rules) => {
  // Validation logic
  if (!rules.required && !value) return true;
  if (rules.minLength && value.length < rules.minLength) return false;
  return true;
}

@alias (fn) emit = (eventName, detail) => {
  return `this.dispatchEvent(new CustomEvent('${eventName}', { detail: ${JSON.stringify(detail)}, bubbles: true }));`;
}
```

### Directive Pipeline Expansion
```objc
// Define a pipeline of directives
@alias (directive) smartProp = ['public', 'kebab', 'reactive', 'validate']

// Usage - all directives run left→right
@prop (smartProp) userName = "guest"

// Equivalent to:
@prop (public, kebab, reactive, validate) userName = "guest"
```

### Token Context Remapping
```objc
// Different behavior based on context
@alias (token) define.component = 'customElements.define'
@alias (token) define.property = 'Object.defineProperty'
@alias (token) scope.style = 'this.shadowRoot.adoptedStyleSheets'
@alias (token) scope.global = 'document.head'
```

## Minimal Standard Library

### Core Directives
```objc
@directive public(ast) {
  return `static get observedAttributes() { return ['${kebabCase(ast.name)}']; }`;
}

@directive reactive(ast) {
  return `
    set ${ast.name}(value) {
      this._${ast.name} = value;
      this.requestUpdate();
    }
    get ${ast.name}() { return this._${ast.name} ?? ${ast.value}; }
  `;
}

@directive kebab(ast) {
  // Auto-generate kebab-case attribute mapping
  const attrName = ast.name.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `// Attribute: ${attrName}`;
}

@directive validate(ast) {
  return `
    set ${ast.name}(value) {
      if (!this.validate(value, ${JSON.stringify(ast.validationRules)})) {
        throw new Error('Validation failed for ${ast.name}');
      }
      this._${ast.name} = value;
    }
  `;
}
```

### Convenience Aliases
```objc
// Common patterns
@alias (directive) default = ['public', 'reactive', 'kebab']
@alias (directive) internal = ['private']
@alias (directive) computed = ['getter']

// Function helpers
@alias (fn) emit = (event, data) => `this.dispatchEvent(new CustomEvent('${event}', {detail: ${JSON.stringify(data)}}))`
@alias (fn) query = (selector) => `this.shadowRoot.querySelector('${selector}')`
@alias (fn) queryAll = (selector) => `this.shadowRoot.querySelectorAll('${selector}')`
```

## Complete Example

```objc
// UserCard.comp

@component {
  <div class="user-card {isOnline ? 'online' : 'offline'}">
    <h3>{fullName}</h3>
    <p>{email}</p>
    <button onclick="{handleContact}">Contact</button>
  </div>
}
@end

@style {
  .user-card {
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 8px;
  }
  .user-card.online { border-color: green; }
}
@end

// Properties with smart defaults
@prop (default) firstName = "John"
@prop (default) lastName = "Doe" 
@prop (default) email = "john@example.com"
@prop (default) isOnline = false

// Computed property
@prop (computed) fullName = () => `${this.firstName} ${this.lastName}`

// Event handlers
@script {
  handleContact() {
    this.emit('contact', { name: this.fullName, email: this.email });
  }
}
@end

// Lifecycle
@lifecycle connectedCallback {
  this.render();
}
@end
```

## VS Code Language Extension Structure

```json
{
  "name": "component-lang",
  "contributes": {
    "languages": [{
      "id": "component",
      "extensions": [".comp"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "component", 
      "scopeName": "source.component",
      "path": "./syntaxes/component.tmLanguage.json",
      "embeddedLanguages": {
        "meta.style.component": "css",
        "meta.script.component": "javascript", 
        "meta.component.component": "html"
      }
    }]
  }
}
```

## TextMate Grammar (Simplified)
```json
{
  "patterns": [
    {
      "name": "meta.style.component",
      "begin": "@style\\s*\\{",
      "end": "\\}\\s*@end",
      "patterns": [{"include": "source.css"}]
    },
    {
      "name": "meta.script.component", 
      "begin": "@(script|lifecycle)\\s*[^{]*\\{",
      "end": "\\}\\s*@end",
      "patterns": [{"include": "source.js"}]
    },
    {
      "name": "meta.component.component",
      "begin": "@component\\s*\\{", 
      "end": "\\}\\s*@end",
      "patterns": [{"include": "text.html.basic"}]
    }
  ]
}
```

## Compilation Pipeline

### Phase 1: Alias Resolution
```javascript
// Expand directive aliases
if (aliasType === 'directive') {
  modifiers = modifiers.flatMap(mod => aliases.get(mod) || [mod]);
}

// Expand function aliases  
if (aliasType === 'fn') {
  // Replace function calls with implementations
}
```

### Phase 2: Directive Pipeline  
```javascript
// Process modifiers left→right as pipeline
modifiers.reduce((ast, modifier) => {
  if (directives.has(modifier)) {
    ast.generatedCode.push(directives.get(modifier)(ast));
  }
  return ast;
}, initialAST);
```

### Phase 3: Code Generation
```javascript
// Combine all generated code into Web Component
generateWebComponent(processedAST);
```

## Edge Cases Handled

1. **VS Code Syntax Highlighting**: Embedded languages for CSS/JS/HTML
2. **Alias Functions**: Full function definitions via `@alias (fn)`
3. **No Type Hints**: Simplified - web components are mostly strings anyway
4. **Token Remapping**: Context-aware aliases for different situations
5. **Directive Expansion**: Pipeline processing left→right
6. **Flat Modifier Lists**: No nesting complexity

## Benefits

1. **Minimal Core**: Only 3 constructs (`@alias`, `@directive`, `@[custom]`)
2. **VS Code Ready**: Built for syntax highlighting out of the box
3. **Pipeline Processing**: Predictable left→right modifier processing
4. **Infinite Extensibility**: Aliases and directives handle all edge cases
5. **Web Component Native**: Designed specifically for web components
6. **Zero Magic**: Everything is explicit and traceable

This design prioritizes **simplicity** and **VS Code integration** while maintaining infinite extensibility through the alias/directive system.
