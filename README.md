# Mino Language Technical Specification

**Version**: 1.0.4  
**File Extension**: `.mino`  
**Target**: Vanilla Web Components with zero dependencies

## Overview

Mino is a component definition language that compiles to vanilla JavaScript Web Components. It focuses on simplicity, VS Code integration, and infinite extensibility through aliases and directives.

## Reserved Keywords

```
// Core Directives
@alias       // Remapping and composition
@directive   // Code generation functions
@method      // Component methods

// Standard Library
@prop        // Component properties
@style       // CSS styles
@template    // HTML template
@script      // JavaScript code

// Lifecycle Methods (Standard Library)
@init        // Constructor logic
@onMounted   // connectedCallback
@onUpdated   // attributeChangedCallback
@onUnmounted // disconnectedCallback
@render      // Render method

// Modifier Keywords
public       // Exposed property/method
private      // Internal only
static       // Class-level
reactive     // Triggers re-render
computed     // Calculated property
async        // Async method
```

## Allowed Tokens

### Directive Types
```
@alias (type)      // Type aliases
@alias (fn)        // Function definitions
@alias (modifier)  // Modifier composition
@alias (directive) // Directive pipelines
@alias (token)     // Context-aware remapping
```

### Modifier Categories
```
// Visibility
public, private, static

// Reactivity  
reactive, computed

// Execution
async, sync

// Validation
required, optional

// Scoping
global, local, scoped

// Custom (user-definable via @directive)
kebab, validate, transform, etc.
```

### Built-in Functions
```
// Event helpers
emit(event, data)
on(event, handler)
off(event, handler)

// DOM helpers  
query(selector)
queryAll(selector)
addClass(className)
removeClass(className)

// Utility helpers
debounce(fn, delay)
throttle(fn, delay)
```

## Syntax Specification

### Inline Directive Syntax
```
@directive [(...modifiers)] name = value
```

**Examples:**
```objc
@prop name = "John Doe"
@prop (reactive) count = 0
@prop (public, reactive) isVisible = true
@prop (computed) fullName = () => `${this.firstName} ${this.lastName}`
```

### Block Directive Syntax
```
@directive [(...modifiers)] [name[(parameters)]] {
  content
}
@end
```

**Examples:**
```objc
@style {
  .button { background: blue; }
}
@end

@template {
  <div class="component">{title}</div>
}
@end

@method (private) handleClick(event) {
  console.log('Clicked!');
  this.emit('click', { target: event.target });
}
@end

@onMounted {
  console.log('Component mounted');
  this.render();
}
@end
```

### Alias Syntax
```
@alias [type] target = source

// Simple remapping
@alias onClick = 'onclick'

// Type definitions
@alias (type) string = String
@alias (type) email = (str) => validateEmail(str)

// Modifier composition
@alias (modifier) default = ['public', 'reactive']

// Function definitions
@alias (fn) emit = (event, data) => `this.dispatchEvent(new CustomEvent('${event}', {detail: ${JSON.stringify(data)}}))`

// Directive pipelines
@alias (directive) smartProp = ['public', 'reactive', 'kebab', 'validate']

// Token remapping
@alias (token) component.define = 'customElements.define'
```

### Directive Definition Syntax
```
@directive directiveName(ast) {
  // JavaScript code generation
  return generatedCode;
}
@end
```

## AST Structure

```typescript
interface MinoAST {
  type: 'inline' | 'block';
  directive: string;           // @prop, @style, @method, etc.
  modifiers: string[];         // ['public', 'reactive']
  name?: string;               // property/method name
  parameters?: string[];       // method parameters
  value?: any;                 // inline value
  content?: string;            // block content
  context: {
    componentName: string;
    aliases: Map<string, any>;
    directives: Map<string, Function>;
    reservedKeywords: Set<string>;
  };
}
```

## Standard Component Structure

```objc
// UserCard.mino

@template {
  <div class="user-card {isOnline ? 'online' : 'offline'}">
    <img src="{avatarUrl}" alt="{fullName}" class="avatar" />
    <div class="info">
      <h3>{fullName}</h3>
      <p>{email}</p>
      <button onclick="{handleContact}">Contact</button>
    </div>
  </div>
}
@end

@style {
  .user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    background: white;
  }
  
  .user-card.online {
    border-color: #22c55e;
  }
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }
}
@end

// Properties
@prop (public, reactive) firstName = "John"
@prop (public, reactive) lastName = "Doe"
@prop (public, reactive) email = "john@example.com"
@prop (public, reactive) avatarUrl = "/default-avatar.png"
@prop (public, reactive) isOnline = false

// Computed properties
@prop (computed) fullName = () => `${this.firstName} ${this.lastName}`

// Methods
@method (private) handleContact() {
  this.emit('contact-user', { 
    name: this.fullName, 
    email: this.email 
  });
}
@end

// Lifecycle
@init {
  console.log('UserCard created');
}
@end

@onMounted {
  this.render();
  console.log('UserCard mounted to DOM');
}
@end

@onUpdated(name, oldValue, newValue) {
  if (['first-name', 'last-name', 'email'].includes(name)) {
    this.render();
  }
}
@end

@render {
  this.shadowRoot.innerHTML = this.getTemplate() + this.getStyles();
}
@end
```

## Compilation Process

### Phase 1: Lexical Analysis
1. **Tokenize** source code into tokens
2. **Identify** directive boundaries (`@directive` ... `@end`)
3. **Extract** modifiers, names, parameters, values, content
4. **Validate** against reserved keywords and allowed tokens
5. **Build** initial AST structure

### Phase 2: Alias Resolution  
1. **Parse** all `@alias` definitions first
2. **Build** alias registry by type (`type`, `fn`, `modifier`, `directive`, `token`)
3. **Expand** modifier aliases (`@prop (default)` → `@prop (public, reactive)`)
4. **Resolve** function aliases in values and content
5. **Apply** token remapping based on context

### Phase 3: Macro Expansion
1. **Process** `@directive` definitions 
2. **Register** custom directives in directive registry
3. **Validate** directive functions (must return string or null)
4. **Prepare** directive execution environment

### Phase 4: Directive Pipeline Processing
1. **Group** blocks by directive type (`@prop`, `@style`, `@method`, etc.)
2. **Process** modifiers left-to-right as pipeline
3. **Execute** each directive function with AST context
4. **Collect** generated code fragments
5. **Handle** dependencies between directives

### Phase 5: Component Structure Generation
1. **Extract** component name from filename or declaration
2. **Generate** Web Component class structure
3. **Combine** property definitions with getters/setters
4. **Merge** method definitions 
5. **Integrate** lifecycle methods
6. **Process** template with interpolation syntax

### Phase 6: Code Generation & Optimization
1. **Generate** `observedAttributes` from reactive properties
2. **Create** render method with template + styles
3. **Wire** event handlers with proper binding
4. **Add** JSDoc comments for TypeScript support
5. **Generate** `customElements.define()` call
6. **Optimize** generated code (remove duplicates, minify if requested)

### Phase 7: Output Generation
1. **Combine** all generated code into single JavaScript file
2. **Add** source maps for debugging
3. **Validate** generated JavaScript syntax
4. **Format** code for readability
5. **Write** output file with `.js` extension

## Generated Output Structure

```javascript
/**
 * UserCard Web Component
 * Generated from UserCard.mino
 * @element user-card
 */
class UserCard extends HTMLElement {
  
  // Generated properties
  /** @type {string} */
  #firstName = "John";
  
  /** @type {string} */  
  #lastName = "Doe";
  
  // Property getters/setters with reactivity
  get firstName() { return this.#firstName; }
  set firstName(value) {
    const oldValue = this.#firstName;
    this.#firstName = String(value);
    if (oldValue !== value) this.requestUpdate();
  }
  
  // Computed properties
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  
  // Observed attributes
  static get observedAttributes() {
    return ['first-name', 'last-name', 'email', 'avatar-url', 'is-online'];
  }
  
  // Constructor (from @init)
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    console.log('UserCard created');
  }
  
  // Lifecycle methods
  connectedCallback() {
    this.render();
    console.log('UserCard mounted to DOM');
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (['first-name', 'last-name', 'email'].includes(name)) {
      this.render();
    }
  }
  
  // Generated methods
  handleContact() {
    this.dispatchEvent(new CustomEvent('contact-user', {
      detail: { name: this.fullName, email: this.email },
      bubbles: true
    }));
  }
  
  // Render method
  render() {
    this.shadowRoot.innerHTML = this.getTemplate() + this.getStyles();
  }
  
  getTemplate() {
    return `
      <div class="user-card ${this.isOnline ? 'online' : 'offline'}">
        <img src="${this.avatarUrl}" alt="${this.fullName}" class="avatar" />
        <div class="info">
          <h3>${this.fullName}</h3>
          <p>${this.email}</p>
          <button onclick="this.getRootNode().host.handleContact()">Contact</button>
        </div>
      </div>
    `;
  }
  
  getStyles() {
    return `
      <style>
        .user-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          background: white;
        }
        
        .user-card.online {
          border-color: #22c55e;
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }
      </style>
    `;
  }
  
  // Utility methods (from @alias (fn))
  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
  }
}

// Register component
customElements.define('user-card', UserCard);

export default UserCard;
```

## Error Handling

### Compile-Time Errors
- **Syntax errors**: Invalid directive syntax
- **Reserved keyword conflicts**: Using reserved words incorrectly  
- **Circular dependencies**: Aliases referencing each other
- **Invalid directives**: Unknown directive names
- **Type mismatches**: Incorrect modifier usage

### Runtime Error Prevention
- **Property validation**: Type checking via aliases
- **Method binding**: Automatic context binding for event handlers
- **Lifecycle management**: Proper cleanup in disconnectedCallback
- **Memory leaks**: Event listener cleanup

## VS Code Integration

### Language Configuration
```json
{
  "comments": {
    "lineComment": "//",
    "blockComment": ["/*", "*/"]
  },
  "brackets": [
    ["{", "}"],
    ["(", ")"]
  ],
  "autoClosingPairs": [
    ["{", "}"],
    ["(", ")"],
    ["\"", "\""],
    ["'", "'"]
  ]
}
```

### TextMate Grammar Highlights
- **Directives**: `@prop`, `@style`, `@method` in blue
- **Modifiers**: `(public, reactive)` in purple  
- **CSS blocks**: Full CSS syntax highlighting
- **HTML blocks**: Full HTML syntax highlighting  
- **JS blocks**: Full JavaScript syntax highlighting
- **Interpolations**: `{expression}` in orange

## Performance Considerations

1. **Compilation Speed**: Single-pass parsing with minimal backtracking
2. **Generated Code Size**: Optimize for small bundle size
3. **Runtime Performance**: Minimal overhead for reactivity system
4. **Memory Usage**: Efficient property storage with private fields
5. **Development Experience**: Fast incremental compilation for live reload

## Future Extensions

1. **TypeScript Support**: Generate `.d.ts` files
2. **CSS Processors**: Sass, Less, PostCSS integration
3. **Testing Utilities**: Built-in test helpers
4. **Documentation**: Auto-generate docs from comments
5. **Bundler Plugins**: Webpack, Vite, Rollup integration
