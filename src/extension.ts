// src/extension.ts (fixed for Mino DSL)
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Mino Language Extension is now active!');

    // Register language providers
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            { language: 'mino' },
            new MinoDocumentSymbolProvider()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'mino' },
            new MinoCompletionProvider(),
            '@', ':', '$'
        )
    );

    // Register commands
    const compileCommand = vscode.commands.registerCommand('mino.compile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active Mino file');
            return;
        }

        if (editor.document.languageId !== 'mino') {
            vscode.window.showErrorMessage('Active file is not a Mino file');
            return;
        }

        try {
            const compiler = new MinoCompiler();
            const compiled = await compiler.compile(editor.document.getText(), editor.document.fileName);
            const outputPath = getOutputPath(editor.document.fileName);
            
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(outputPath),
                Buffer.from(compiled, 'utf8')
            );

            const config = vscode.workspace.getConfiguration('mino');
            if (config.get('showCompileNotifications')) {
                vscode.window.showInformationMessage(`Compiled: ${outputPath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Compilation failed: ${error}`);
        }
    });

    const createComponentCommand = vscode.commands.registerCommand('mino.createComponent', async () => {
        const componentName = await vscode.window.showInputBox({
            prompt: 'Enter component name (snake_case)',
            placeHolder: 'my_component'
        });

        if (!componentName) return;

        const template = createComponentTemplate(componentName);
        const fileName = `${componentName}.mino`;
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName);
        
        try {
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(template, 'utf8'));
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create component: ${error}`);
        }
    });

    context.subscriptions.push(compileCommand, createComponentCommand);

    // Auto-compile on save
    const autoCompileDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'mino') {
            const config = vscode.workspace.getConfiguration('mino');
            if (config.get('autoCompile')) {
                await vscode.commands.executeCommand('mino.compile');
            }
        }
    });

    context.subscriptions.push(autoCompileDisposable);

    // Provide diagnostics
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('mino');
    context.subscriptions.push(diagnosticCollection);

    const updateDiagnostics = async (document: vscode.TextDocument) => {
        if (document.languageId === 'mino') {
            try {
                const compiler = new MinoCompiler();
                const diagnostics = await compiler.validate(document.getText(), document.fileName);
                diagnosticCollection.set(document.uri, diagnostics);
            } catch (error) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    `Mino validation error: ${error}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnosticCollection.set(document.uri, [diagnostic]);
            }
        }
    };

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
        vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document))
    );
}

function getOutputPath(inputPath: string): string {
    const config = vscode.workspace.getConfiguration('mino');
    const outputDir = config.get('outputDirectory', './dist');
    const fileName = inputPath.replace(/\.mino$/, '.js');
    return `${outputDir}/${fileName.split('/').pop()}`;
}

function createComponentTemplate(componentName: string): string {
    return `// ${componentName}.mino

@html greeting: name
  <h1>Hello $0!</h1>
  <p>Welcome to the component</p>
@end

@html button: text, onclick
  <button class="btn" onclick="$1">$0</button>
@end

@css styles: primary_color
  .greeting {
    padding: 2rem;
    text-align: center;
    font-family: Arial, sans-serif;
  }
  
  .greeting h1 {
    color: $0;
    margin-bottom: 1rem;
  }
  
  .btn {
    background: $0;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .btn:hover {
    opacity: 0.9;
  }
@end

@component ${componentName}: greeting, button, styles
  // Initialization
  self.name = "World"
  self.count = 0
  self.primaryColor = "#007bff"
  
  // Render function
  return () => {
    const greetingHtml = greeting(self.name);
    const buttonHtml = button("Click me", "this.component.increment()");
    const stylesHtml = styles(self.primaryColor);
    
    return \`
      <style>\${stylesHtml}</style>
      \${greetingHtml}
      \${buttonHtml}
      <p>Clicked \${self.count} times</p>
    \`;
  }
@end
`;
}

export function deactivate() {}

// MinoCompiler class with improved parsing
class MinoCompiler {
    async compile(source: string, fileName: string): Promise<string> {
        try {
            const componentName = this.extractComponentName(fileName);
            const blocks = this.parseBlocks(source);
            const compiled = this.generateCode(blocks, componentName);
            return compiled;
        } catch (error) {
            throw new Error(`Compilation failed: ${error}`);
        }
    }

    async validate(source: string, fileName: string): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        
        try {
            this.parseBlocks(source);
        } catch (error) {
            // Parse error details if available
            const errorMessage = error instanceof Error ? error.message : String(error);
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                `Validation error: ${errorMessage}`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
        
        return diagnostics;
    }

    private extractComponentName(fileName: string): string {
        const baseName = fileName.split('/').pop()?.replace('.mino', '') || 'Component';
        return this.toPascalCase(baseName);
    }

    private parseBlocks(source: string): MinoBlock[] {
        const blocks: MinoBlock[] = [];
        
        // Extract all directive blocks
        const directives = ['@html', '@css', '@component', '@macro'];
        
        for (const directive of directives) {
            const directiveBlocks = this.extractBlocks(source, directive);
            directiveBlocks.forEach(block => {
                const parsed = this.parseBlockHeader(block);
                if (parsed) {
                    blocks.push({
                        directive: directive.slice(1), // Remove @
                        name: parsed.name,
                        params: parsed.params,
                        content: parsed.content
                    });
                }
            });
        }
        
        return blocks;
    }
    
    private extractBlocks(source: string, directive: string): string[] {
        const blocks: string[] = [];
        const lines = source.split('\n');
        
        let inBlock = false;
        let currentBlock: string[] = [];
        let blockStartLine = -1;
        let baseIndentation = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Skip empty lines
            if (!trimmed) {
                if (inBlock) {
                    currentBlock.push(line);
                }
                continue;
            }
            
            // Start of block
            if (trimmed.startsWith(directive + ' ') || trimmed === directive) {
                if (inBlock) {
                    // Save previous block
                    blocks.push(currentBlock.join('\n'));
                }
                inBlock = true;
                blockStartLine = i;
                currentBlock = [line];
                baseIndentation = line.length - line.trimStart().length;
                continue;
            }
            
            if (inBlock) {
                const currentIndentation = line.length - line.trimStart().length;
                
                // Check if this line starts a new directive (unindented)
                if (currentIndentation <= baseIndentation && 
                    (trimmed.startsWith('@html ') || 
                     trimmed.startsWith('@css ') || 
                     trimmed.startsWith('@component ') || 
                     trimmed.startsWith('@macro ') ||
                     trimmed.startsWith('//'))) {
                    // End current block and start processing this line again
                    blocks.push(currentBlock.join('\n'));
                    inBlock = false;
                    
                    // Reprocess this line
                    i--;
                    continue;
                }
                
                // Content inside block (must be indented)
                if (currentIndentation > baseIndentation || trimmed.startsWith('//')) {
                    currentBlock.push(line);
                } else {
                    // Non-indented content that's not a directive - end the block
                    blocks.push(currentBlock.join('\n'));
                    inBlock = false;
                    // Don't reprocess this line as it's not part of our directive
                }
            }
        }
        
        // Handle block at end of file
        if (inBlock && currentBlock.length > 0) {
            blocks.push(currentBlock.join('\n'));
        }
        
        return blocks;
    }
    
    private parseBlockHeader(block: string): { name: string; params: string[]; content: string } | null {
        const lines = block.split('\n');
        if (lines.length === 0) return null;
        
        const firstLine = lines[0].trim();
        const contentLines = lines.slice(1);
        
        // Handle cases like "@html" with no name/params
        if (!firstLine.includes(' ')) {
            throw new Error(`Invalid directive header: ${firstLine} (missing name)`);
        }
        
        // Parse: @directive name: param1, param2
        // or: @directive name
        const parts = firstLine.split(':');
        const prefix = parts[0].trim();
        const paramList = parts.length > 1 ? parts[1].trim() : '';
        
        // Split prefix into directive and name
        const prefixParts = prefix.split(/\s+/);
        if (prefixParts.length < 2) {
            throw new Error(`Invalid directive header: ${firstLine} (missing name)`);
        }
        
        const directive = prefixParts[0]; // @html, @css, @component, @macro
        const name = prefixParts.slice(1).join(' ').trim(); // everything after directive
        
        // Validate name
        if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
            throw new Error(`Invalid name: ${name} (must be valid identifier)`);
        }
        
        // Parse parameters
        const params = paramList ? 
            paramList.split(',').map(str => str.trim()).filter(str => str) : 
            [];
        
        // Validate parameters
        for (const param of params) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param)) {
                throw new Error(`Invalid parameter: ${param} (must be valid identifier)`);
            }
        }
        
        // Get content (everything except first line)
        const content = contentLines.join('\n').trim();
        
        return { name, params, content };
    }

    private generateCode(blocks: MinoBlock[], componentName: string): string {
        const htmlFunctions = blocks.filter(b => b.directive === 'html');
        const cssFunctions = blocks.filter(b => b.directive === 'css');
        const components = blocks.filter(b => b.directive === 'component');
        const macros = blocks.filter(b => b.directive === 'macro');
        
        let output = '// Generated from Mino\n\n';
        
        // Generate HTML functions
        htmlFunctions.forEach(block => {
            output += this.generateHTMLFunction(block);
        });
        
        // Generate CSS functions  
        cssFunctions.forEach(block => {
            output += this.generateCSSFunction(block);
        });
        
        // Generate macro functions
        macros.forEach(block => {
            output += this.generateMacroFunction(block);
        });
        
        // Generate web components
        components.forEach(block => {
            output += this.generateWebComponent(block, componentName);
        });
        
        return output;
    }

    private generateHTMLFunction(block: MinoBlock): string {
        const paramList = block.params.join(', ');
        let content = block.content;
        
        // Replace $0, $1, $2... with parameter names
        block.params.forEach((param, index) => {
            content = content.replace(new RegExp(`\\$${index}\\b`, 'g'), `\${${param}}`);
        });
        
        // Handle $children placeholder
        content = content.replace(/\$children/g, '${children || ""}');
        
        // Add children parameter if not present but used
        const hasChildrenPlaceholder = block.content.includes('$children');
        const finalParams = hasChildrenPlaceholder && !block.params.includes('children') 
            ? [...block.params, 'children'].join(', ')
            : paramList;
        
        return `
function ${block.name}(${finalParams}) {
  return \`${content}\`;
}

`;
    }

    private generateCSSFunction(block: MinoBlock): string {
        const paramList = block.params.join(', ');
        let content = block.content;
        
        // Replace $0, $1, $2... with parameter names
        block.params.forEach((param, index) => {
            content = content.replace(new RegExp(`\\$${index}\\b`, 'g'), `\${${param}}`);
        });
        
        return `
function ${block.name}(${paramList}) {
  return \`${content}\`;
}

`;
    }

    private generateMacroFunction(block: MinoBlock): string {
        const paramList = block.params.join(', ');
        
        return `
function ${block.name}(${paramList}) {
  ${block.content}
}

`;
    }

    private generateWebComponent(block: MinoBlock, componentName: string): string {
        const kebabName = this.toKebabCase(componentName);
        const dependencies = block.params.join(', ');
        
        // Split the content into initialization and render parts
        const lines = block.content.split('\n');
        const returnIndex = lines.findIndex(line => line.trim().startsWith('return'));
        
        const initCode = returnIndex > 0 ? 
            lines.slice(0, returnIndex).join('\n') : 
            '';
        const renderCode = returnIndex >= 0 ? 
            lines.slice(returnIndex).join('\n').replace(/^return\s*/, '') : 
            '() => ""';
        
        return `
class ${componentName} extends HTMLElement {
  constructor() {
    super();
    this.self = {};
    this.component = this;
    
    // Dependencies: ${dependencies}
    
    // Initialization code
    ${initCode}
    
    // Render function
    this.renderFn = ${renderCode};
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    if (this.renderFn) {
      this.innerHTML = this.renderFn();
    }
  }
  
  // Helper methods
  updateSelf(updates) {
    Object.assign(this.self, updates);
    this.render();
  }
  
  increment() {
    if (typeof this.self.count === 'number') {
      this.self.count++;
      this.render();
    }
  }
}

customElements.define('${kebabName}', ${componentName});
export default ${componentName};

`;
    }

    private toPascalCase(str: string): string {
        return str
            .split(/[-_\s]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private toKebabCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '');
    }
}

interface MinoBlock {
    directive: string;
    name: string;
    params: string[];
    content: string;
}

// MinoDocumentSymbolProvider class
class MinoDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        
        // Match @directive name: params pattern
        const blockRegex = /@(\w+)\s+([^:\n]+)(?::\s*([^\n]+))?/g;
        const lines = text.split('\n');
        
        let match;
        while ((match = blockRegex.exec(text)) !== null) {
            const [fullMatch, directive, name, params] = match;
            const startPos = text.indexOf(fullMatch);
            const startLine = text.substring(0, startPos).split('\n').length - 1;
            
            // Find the end of this block
            const endPattern = new RegExp(`@${directive}\\s+${name.trim()}[^\\n]*\\n([\\s\\S]*?)^\\s*@end`, 'm');
            const blockMatch = text.match(endPattern);
            const endLine = blockMatch ? 
                text.substring(0, text.indexOf(blockMatch[0]) + blockMatch[0].length).split('\n').length - 1 :
                startLine;
            
            const symbolKind = this.getSymbolKind(directive);
            const detail = params ? `${directive}: ${params}` : directive;
            
            const symbol = new vscode.DocumentSymbol(
                name.trim(),
                detail,
                symbolKind,
                new vscode.Range(startLine, 0, endLine, 0),
                new vscode.Range(startLine, 0, startLine, fullMatch.length)
            );
            symbols.push(symbol);
        }

        return symbols;
    }
    
    private getSymbolKind(directive: string): vscode.SymbolKind {
        switch (directive) {
            case 'html': return vscode.SymbolKind.Function;
            case 'css': return vscode.SymbolKind.Function;
            case 'component': return vscode.SymbolKind.Class;
            case 'macro': return vscode.SymbolKind.Function;
            default: return vscode.SymbolKind.Function;
        }
    }
}

// MinoCompletionProvider class
class MinoCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.CompletionItem[] {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        
        // Directive completions
        if (linePrefix.endsWith('@')) {
            return this.getDirectiveCompletions();
        }
        
        // Token completions
        if (linePrefix.endsWith('$')) {
            return this.getTokenCompletions();
        }

        return [];
    }

    private getDirectiveCompletions(): vscode.CompletionItem[] {
        const directives = [
            { name: 'html', detail: 'HTML template function', kind: vscode.CompletionItemKind.Function },
            { name: 'css', detail: 'CSS style function', kind: vscode.CompletionItemKind.Function },
            { name: 'component', detail: 'Web component', kind: vscode.CompletionItemKind.Class },
            { name: 'macro', detail: 'Macro function', kind: vscode.CompletionItemKind.Function }
        ];

        return directives.map(directive => {
            const item = new vscode.CompletionItem(directive.name, directive.kind);
            item.detail = directive.detail;
            item.insertText = new vscode.SnippetString(this.getDirectiveSnippet(directive.name));
            return item;
        });
    }

    private getTokenCompletions(): vscode.CompletionItem[] {
        const tokens = [
            { name: '0', detail: 'First parameter ($0)' },
            { name: '1', detail: 'Second parameter ($1)' },
            { name: '2', detail: 'Third parameter ($2)' },
            { name: 'children', detail: 'Children placeholder' }
        ];

        return tokens.map(token => {
            const item = new vscode.CompletionItem(token.name, vscode.CompletionItemKind.Variable);
            item.detail = token.detail;
            return item;
        });
    }

    private getDirectiveSnippet(directive: string): string {
        switch (directive) {
            case 'html':
                return 'html ${1:function_name}: ${2:params}\n  ${3:<!-- HTML content with \\$0, \\$1 tokens -->}\n@end';
            case 'css':
                return 'css ${1:function_name}: ${2:params}\n  ${3:/* CSS styles with \\$0, \\$1 tokens */}\n@end';
            case 'component':
                return 'component ${1:component_name}: ${2:dependencies}\n  // Initialization\n  self.${3:property} = ${4:value}\n  \n  // Render function\n  return () => {\n    ${5:// Component logic}\n  }\n@end';
            case 'macro':
                return 'macro ${1:macro_name}: ${2:dependencies}\n  return (${3:params}) => {\n    ${4:// Macro logic}\n  }\n@end';
            default:
                return directive;
        }
    }
}