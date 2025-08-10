// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Mino v2.0 language extension is now active!');

    // Register a command for formatting Mino files
    const formatCommand = vscode.commands.registerCommand('mino.format', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'mino') {
            vscode.window.showInformationMessage('Mino formatting coming soon!');
        } else {
            vscode.window.showWarningMessage('Please open a .mino file to format.');
        }
    });

    // Register a hover provider for Mino syntax
    const hoverProvider = vscode.languages.registerHoverProvider('mino', {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return undefined;
            }
            
            const word = document.getText(range);
            
            switch (word) {
                case '@css':
                    return new vscode.Hover(
                        new vscode.MarkdownString('**Mino CSS Block**\n\nDefine reusable CSS styles with optional parameters.\n\n```mino\n@css buttonStyles(color) {\n  .btn { background: ${color}; }\n}\n```')
                    );
                case '@html':
                    return new vscode.Hover(
                        new vscode.MarkdownString('**Mino HTML Block**\n\nDefine reusable HTML templates with parameters and `${variable}` interpolation.\n\n```mino\n@html userCard(user) {\n  <div>${user.name}</div>\n}\n```')
                    );
                default:
                    return undefined;
            }
        }
    });

    // Register a completion provider for Mino directives
    const completionProvider = vscode.languages.registerCompletionItemProvider('mino', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[]> {
            // FIX: Use substring instead of deprecated substr
            const linePrefix = document.lineAt(position).text.substring(0, position.character);
            
            if (!linePrefix.endsWith('@')) {
                return undefined;
            }

            const cssCompletion = new vscode.CompletionItem('@css', vscode.CompletionItemKind.Keyword);
            cssCompletion.insertText = new vscode.SnippetString('css ${1:styleName}(${2:params}) {\n\t${3:/* CSS styles */}\n}');
            cssCompletion.documentation = new vscode.MarkdownString('Create a CSS block with named parameters');

            const htmlCompletion = new vscode.CompletionItem('@html', vscode.CompletionItemKind.Keyword);
            htmlCompletion.insertText = new vscode.SnippetString('html ${1:templateName}(${2:params}) {\n\t${3:<!-- HTML content -->}\n}');
            htmlCompletion.documentation = new vscode.MarkdownString('Create an HTML block with named parameters');

            return [cssCompletion, htmlCompletion];
        }
    }, '@');

    // Register diagnostic provider for syntax validation
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('mino');
    
    const validateDocument = (document: vscode.TextDocument) => {
        if (document.languageId !== 'mino') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        // Track declared block names to detect duplicates
        const declaredBlocks = new Map<string, number>();
        
        // FIX: More robust regex with word boundaries and better parameter parsing
        const blockPattern = /\b@(css|html)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{/g;
        
        // Check for valid block declarations
        let match;
        while ((match = blockPattern.exec(text)) !== null) {
            const [fullMatch, blockType, blockName, params] = match;
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + fullMatch.length);
            
            // Check for duplicate block names
            if (declaredBlocks.has(blockName)) {
                const firstDeclarationLine = declaredBlocks.get(blockName)!;
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(startPos, endPos),
                    `Duplicate block name '${blockName}'. First declared on line ${firstDeclarationLine + 1}.`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            } else {
                declaredBlocks.set(blockName, startPos.line);
            }
            
            // Validate parameter syntax
            if (params.trim()) {
                const paramList = params.split(',').map(p => p.trim()).filter(p => p);
                for (const param of paramList) {
                    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(param)) {
                        const diagnostic = new vscode.Diagnostic(
                            new vscode.Range(startPos, endPos),
                            `Invalid parameter name '${param}'. Must be a valid JavaScript identifier.`,
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
        
        // Check for invalid block identifiers
        const invalidIdentifierPattern = /\b@(css|html)\s+([^a-zA-Z_$]|\d)/g;
        let invalidMatch;
        while ((invalidMatch = invalidIdentifierPattern.exec(text)) !== null) {
            const startPos = document.positionAt(invalidMatch.index);
            const endPos = document.positionAt(invalidMatch.index + invalidMatch[0].length);
            
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(startPos, endPos),
                'Block names must be valid JavaScript identifiers (start with letter, $, or _)',
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
        
        // Check for nested blocks (not allowed in v2.0)
        lines.forEach((line, lineIndex) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('@css') || trimmed.startsWith('@html')) {
                // Check if this line is indented (suggesting nesting)
                if (line.match(/^\s+@(css|html)/)) {
                    const startPos = new vscode.Position(lineIndex, 0);
                    const endPos = new vscode.Position(lineIndex, line.length);
                    
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(startPos, endPos),
                        'Nested blocks are not allowed. Blocks must be declared at the top level.',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
            }
        });

        diagnosticCollection.set(document.uri, diagnostics);
    };

    // Validate document on change
    const onDocumentChange = vscode.workspace.onDidChangeTextDocument(event => {
        validateDocument(event.document);
    });

    // Validate document on open
    const onDocumentOpen = vscode.workspace.onDidOpenTextDocument(document => {
        validateDocument(document);
    });

    // Register a definition provider for block references
    const definitionProvider = vscode.languages.registerDefinitionProvider('mino', {
        provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return undefined;
            }
            
            const word = document.getText(range);
            const text = document.getText();
            
            // FIX: Improved regex with word boundaries
            const blockPattern = new RegExp(`\\b@(css|html)\\s+(${word})\\s*\\(`, 'g');
            const match = blockPattern.exec(text);
            
            if (match) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                return new vscode.Location(document.uri, new vscode.Range(startPos, endPos));
            }
            
            return undefined;
        }
    });

    // Add all subscriptions
    context.subscriptions.push(
        formatCommand,
        hoverProvider,
        completionProvider,
        diagnosticCollection,
        onDocumentChange,
        onDocumentOpen,
        definitionProvider
    );
}

export function deactivate() {
    // Clean up resources if needed
}