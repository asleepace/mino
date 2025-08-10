import * as path from 'path';

export class MinoCompiler {
    async compile(source: string, fileName: string): Promise<string> {
        // Basic compilation - replace with full Mino compiler
        try {
            const componentName = this.extractComponentName(fileName);
            const compiled = this.basicTransform(source, componentName);
            return compiled;
        } catch (error) {
            throw new Error(`Compilation failed: ${error}`);
        }
    }

    async validate(source: string, fileName: string): Promise<void> {
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

    private extractComponentName(fileName: string): string {
        const baseName = path.basename(fileName).replace(/\.mino$/, '');
        const parts = baseName.split(/[\s._-]+/).filter(Boolean);
        const pascal = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        return pascal || 'Component';
    }

    private toKebabCase(input: string): string {
        return input
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/[\s._]+/g, '-')
            .toLowerCase();
    }

    private basicTransform(source: string, componentName: string): string {
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
