# Mino
A simple meta language used to generate vanilla JS based web components.

# Language Specification v1.3

## Unified Syntax

All language constructs follow a single, consistent pattern:

```
[@directive] [(...modifiers)] [name[:TypeConstructor]] [= [value]]
  [content]
[@end]
```

## Core Directives (Minimal Set)

### 1. `@alias` - Remapping and composition
```objc
@alias newName = 'originalName'
@alias (type) string = String
@alias (modifier) dynamic = ['reactive', 'public']
```

### 2. `@directive` - Code generation functions
```objc
@directive directiveName(ast) {
  // JavaScript code generation
  return code;
}
@end
```

### 3. `@macro` - Template expansion
```objc
@macro (args...) macroName = expanded_syntax
```

### 4. `@prop` - Properties (using directives for behavior)
```objc
@prop (modifiers...) name: TypeConstructor = value
```

### 5. `@block` - Multi-line content
```objc
@block (modifiers...) name {
  content
}
@end
```

## Type System via Constructor Functions

```objc
// Built-in type aliases
@alias (type) string = String
@alias (type) number = Number  
@alias (type) boolean = Boolean
@alias (type) int = parseInt
@alias (type) float = parseFloat
@alias (type) json = (str) => JSON.parse(str)
@alias (type) array = Array
@alias (type) object = Object

// Custom type constructors
@alias (type) email = (str) => {
  if (!/\S+@\S+\.\S+/.test(str)) throw new Error('Invalid email');
  return str;
}

@alias (type) positiveNumber = (val) => {
  const num = Number(val);
  if (num <= 0) throw new Error('Must be positive');
  return num;
}
```

## Computed Properties via Directive

```objc
@directive computed(ast) {
  if (!ast.modifiers.includes('computed')) return null;
  
  return `
    get ${ast.targetName}() {
      return (${ast.value})();
    }
  `;
}
@end

// Usage:
@prop (computed) fullName: string = () => `${this.firstName} ${this.lastName}`
@prop (computed) isAdult: boolean = () => this.age >= 18
@prop (computed) displayData: json = () => JSON.stringify(this.userData)
```

## Reactive Properties via Directive

```objc
@directive reactive(ast) {
  if (!ast.modifiers.includes('reactive')) return null;
  
  const typeCheck = ast.typeConstructor ? 
    `value = ${ast.typeConstructor.name}(value);` : '';
  
  return `
    set ${ast.targetName}(value) {
      ${typeCheck}
      const oldValue = this._${ast.targetName};
      this._${ast.targetName} = value;
      if (oldValue !== value) this.requestUpdate();
    }
    
    get ${ast.targetName}() {
      return this._${ast.targetName} ?? ${ast.value};
    }
  `;
}
@end
```

## Enhanced Examples

### Simple Component
```objc
@block component UserCard {
  <div class="user-card {isOnline ? 'online' : 'offline'}">
    <h3>{fullName}</h3>
    <p>{email}</p>
    <span class="age">Age: {age}</span>
    <button onclick="{handleContact}">Contact</button>
  </div>
}
@end

// Basic properties with type validation
@prop firstName: string = "John"
@prop lastName: string = "Doe"  
@prop age: int = 25
@prop email: email = "john@example.com"
@prop isOnline: boolean = false

// Computed properties
@prop (computed) fullName: string = () => `${this.firstName} ${this.lastName}`
@prop (computed) canVote: boolean = () => this.age >= 18

// Reactive properties (trigger re-render on change)
@prop (reactive) theme: string = "light"
@prop (reactive) userPrefs: json = () => ({})

// Event handlers
@block (private) handleContact {
  this.dispatchEvent(new CustomEvent('contact', {
    detail: { fullName: this.fullName, email: this.email }
  }));
}
@end

// Styles
@block (css) style {
  .user-card {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 8px;
  }
  
  .user-card.online {
    border-color: green;
  }
}
@end
```

### Advanced Modifiers
```objc
// Modifier composition
@alias (modifier) public = ['reactive', 'attribute']
@alias (modifier) internal = ['private', 'static']

// Smart attribute directive
@directive attribute(ast) {
  if (!ast.modifiers.includes('attribute')) return null;
  
  const attrName = ast.targetName.replace(/([A-Z])/g, '-$1').toLowerCase();
  
  return `
    static get observedAttributes() {
      return [...(super.observedAttributes || []), '${attrName}'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === '${attrName}') {
        this.${ast.targetName} = newValue;
      }
      super.attributeChangedCallback?.(name, oldValue, newValue);
    }
  `;
}
@end

// Usage with composed modifiers
@prop (public) userName: string = "guest"  // reactive + attribute
@prop (internal) debugMode: boolean = false  // private + static
```

### Complex Types and Validation
```objc
// Custom type with validation
@alias (type) userRole = (role) => {
  const validRoles = ['admin', 'user', 'guest'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
  }
  return role;
}

// Array type with item validation
@alias (type) stringArray = (arr) => {
  if (!Array.isArray(arr)) throw new Error('Must be an array');
  return arr.map(String);
}

// Complex object type
@alias (type) userConfig = (obj) => {
  const config = typeof obj === 'string' ? JSON.parse(obj) : obj;
  return {
    theme: String(config.theme || 'light'),
    notifications: Boolean(config.notifications ?? true),
    language: String(config.language || 'en')
  };
}

// Usage
@prop role: userRole = "guest"
@prop tags: stringArray = []
@prop config: userConfig = { theme: 'dark', notifications: true }
```

## AST Structure

```typescript
interface DirectiveAST {
  directive: string;           // @prop, @block, etc.
  targetName: string;          // property/block name
  modifiers: string[];         // computed, reactive, etc.
  typeConstructor?: Function;  // String, parseInt, custom validator
  value?: any;                 // default value or expression
  content?: string;            // block content
  context: {
    componentName: string;
    aliases: Map<string, any>;
    directives: Map<string, Function>;
  };
}
```

## Compilation Process

### Phase 1: Parse @alias definitions
```javascript
const typeAliases = new Map([
  ['string', String],
  ['number', Number],
  ['email', (str) => { /* validation */ }]
]);

const modifierAliases = new Map([
  ['public', ['reactive', 'attribute']],
  ['internal', ['private', 'static']]
]);
```

### Phase 2: Expand modifier aliases
```javascript
// @prop (public) userName: string = "guest"
// becomes: @prop (reactive, attribute) userName: string = "guest"
```

### Phase 3: Process directives
```javascript
ast.blocks.forEach(block => {
  block.modifiers.forEach(modifier => {
    if (directives.has(modifier)) {
      const code = directives.get(modifier)(block);
      if (code) block.generatedCode.push(code);
    }
  });
});
```

### Phase 4: Generate Web Component
```javascript
class ${ComponentName} extends HTMLElement {
  ${generatedProperties}
  ${generatedMethods}
  ${generatedLifecycle}
}
```

## Benefits

1. **Unified Syntax** - Everything follows the same pattern
2. **JavaScript-Native Types** - Use constructor functions, not special syntax
3. **Composable Modifiers** - Mix and match behaviors cleanly
4. **Runtime Validation** - Type constructors provide runtime safety
5. **Minimal Core** - Only 5 directives, everything else is composition
6. **Predictable** - Clear AST structure makes directives easy to write

This creates a language that feels like enhanced JavaScript rather than a completely foreign syntax!
