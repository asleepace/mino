"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinoCompiler = void 0;
const path = __importStar(require("path"));
class MinoCompiler {
    async compile(source, fileName) {
        // Basic compilation - replace with full Mino compiler
        try {
            const componentName = this.extractComponentName(fileName);
            const compiled = this.basicTransform(source, componentName);
            return compiled;
        }
        catch (error) {
            throw new Error(`Compilation failed: ${error}`);
        }
    }
    async validate(source, fileName) {
        // Basic validation - replace with full validator
        const lines = source.split('\n');
        let blockDepth = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('@') && line.includes('{')) {
                blockDepth++;
            }
            if (line === '@end') {
                blockDepth--;
                if (blockDepth < 0) {
                    throw new Error(`Unexpected @end at line ${i + 1}`);
                }
            }
        }
        if (blockDepth !== 0) {
            throw new Error('Unclosed blocks detected');
        }
    }
    extractComponentName(fileName) {
        const baseName = path.basename(fileName).replace(/\.mino$/, '');
        const parts = baseName.split(/[\s._-]+/).filter(Boolean);
        const pascal = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        return pascal || 'Component';
    }
    toKebabCase(input) {
        return input
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/[\s._]+/g, '-')
            .toLowerCase();
    }
    basicTransform(source, componentName) {
        // Very basic transformation for demo purposes
        const elementName = this.toKebabCase(componentName);
        return `// Generated from ${componentName}.mino
class ${componentName} extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        this.shadowRoot.innerHTML = \`
            <style>
                /* Compiled styles will go here */
            </style>
            <div>
                <!-- Compiled template will go here -->
                <p>Generated ${componentName} component</p>
            </div>
        \`;
    }
}

customElements.define('${elementName}', ${componentName});
export default ${componentName};
`;
    }
}
exports.MinoCompiler = MinoCompiler;
//# sourceMappingURL=compiler.js.map