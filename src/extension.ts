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
                        new vscode.MarkdownString('**Mino CSS Block**\n\nDefine reusable CSS styles with variable assignment.\n\n```mino\nconst styles = @css {\n  .btn { background: ${color}; }\n}\n```')
                    );
                case '@html':
                    return new vscode.Hover(
                        new vscode.MarkdownString('**Mino HTML Block**\n\nDefine reusable HTML templates with `${variable}` interpolation.\n\n```mino\nconst template = @html {\n  <div>${content}</div>\n}\n```')
                    );
                default:
                    return undefined;
            }
        }
    });

    // Register a completion provider for Mino directives
    const completionProvider = vscode.languages.registerCompletionItemProvider('mino', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[]> {
            const linePrefix = document.lineAt(position).text.substring(0, position.character);
            
            // Check for variable assignment context
            if (linePrefix.match(/\b(const|let|var)\s+\w+\s*=\s*@?$/)) {
                const cssCompletion = new vscode.CompletionItem('@css', vscode.CompletionItemKind.Keyword);
                cssCompletion.insertText = new vscode.SnippetString('@css {\n\t${1:/* CSS styles */}\n}');
                cssCompletion.documentation = new vscode.MarkdownString('Create a CSS block with template interpolation');

                const htmlCompletion = new vscode.CompletionItem('@html', vscode.CompletionItemKind.Keyword);
                htmlCompletion.insertText = new vscode.SnippetString('@html {\n\t${1:<!-- HTML content -->}\n}');
                htmlCompletion.documentation = new vscode.MarkdownString('Create an HTML block with template interpolation');

                return [cssCompletion, htmlCompletion];
            }

            // Provide full variable assignment snippets when typing 'const', 'let', or 'var'
            if (linePrefix.match(/\b(const|let|var)\s*$/)) {
                const cssVariableCompletion = new vscode.CompletionItem('CSS Block', vscode.CompletionItemKind.Snippet);
                cssVariableCompletion.insertText = new vscode.SnippetString('const ${1:styles} = @css {\n\t${2:/* CSS styles */}\n}');
                cssVariableCompletion.documentation = new vscode.MarkdownString('Create a CSS block variable');

                const htmlVariableCompletion = new vscode.CompletionItem('HTML Block', vscode.CompletionItemKind.Snippet);
                htmlVariableCompletion.insertText = new vscode.SnippetString('const ${1:template} = @html {\n\t${2:<!-- HTML content -->}\n}');
                htmlVariableCompletion.documentation = new vscode.MarkdownString('Create an HTML block variable');

                return [cssVariableCompletion, htmlVariableCompletion];
            }

            return undefined;
        }
    }, '@', 't', 'l', 'c'); // Trigger on @, const/let keywords

    // Register diagnostic provider for syntax validation
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('mino');
    
    const validateDocument = (document: vscode.TextDocument) => {
        if (document.languageId !== 'mino') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        // Track declared block variables to detect duplicates
        const declaredVariables = new Map<string, number>();
        
        // Updated regex for variable assignment syntax: const name = @css { ... }
        const blockPattern = /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*@(css|html)\s*\{/g;
        
        // Check for valid block declarations
        let match;
        while ((match = blockPattern.exec(text)) !== null) {
            const [fullMatch, varType, varName, blockType] = match;
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + fullMatch.length);
            
            // Check for duplicate variable names
            if (declaredVariables.has(varName)) {
                const firstDeclarationLine = declaredVariables.get(varName)!;
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(startPos, endPos),
                    `Duplicate variable name '${varName}'. First declared on line ${firstDeclarationLine + 1}.`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            } else {
                declaredVariables.set(varName, startPos.line);
            }
        }
        
        // Check for invalid variable names
        const invalidVariablePattern = /\b(const|let|var)\s+([^a-zA-Z_$]|\d\w*)\s*=\s*@(css|html)/g;
        let invalidMatch;
        while ((invalidMatch = invalidVariablePattern.exec(text)) !== null) {
            const startPos = document.positionAt(invalidMatch.index);
            const endPos = document.positionAt(invalidMatch.index + invalidMatch[0].length);
            
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(startPos, endPos),
                'Variable names must be valid JavaScript identifiers (start with letter, $, or _)',
                vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
        }
        
        // Check for invalid @css/@html usage: allow bare blocks and assignment blocks
        const invalidBlockPattern = /@(css|html)(?!\s*\{|\s*[a-zA-Z])/g;
        let invalidMatch2;
        while ((invalidMatch2 = invalidBlockPattern.exec(text)) !== null) {
            // If not followed by '{' or an identifier, flag usage
                const startPos = document.positionAt(invalidMatch2.index);
                const endPos = document.positionAt(invalidMatch2.index + invalidMatch2[0].length);
                
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(startPos, endPos),
                    `@${invalidMatch2[1]} must be followed by '{' or used in variable assignment`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
        }
        
        // Check for nested variable-declared blocks (not allowed). Bare blocks could appear inside JS blocks; keep rule for assignments only.
        lines.forEach((line, lineIndex) => {
            if (line.match(/^\s+(const|let|var)\s+\w+\s*=\s*@(css|html)/)) {
                const startPos = new vscode.Position(lineIndex, 0);
                const endPos = new vscode.Position(lineIndex, line.length);
                
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(startPos, endPos),
                    'Nested blocks are not allowed. Blocks must be declared at the top level.',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        });

        // Check for unmatched braces in blocks
        const bracePattern = /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*@(css|html)\s*\{/g;
        let braceMatch;
        while ((braceMatch = bracePattern.exec(text)) !== null) {
            const blockStart = braceMatch.index + braceMatch[0].length - 1; // Position of opening brace
            let braceCount = 1;
            let pos = blockStart + 1;
            
            while (pos < text.length && braceCount > 0) {
                if (text[pos] === '{') braceCount++;
                else if (text[pos] === '}') braceCount--;
                pos++;
            }
            
            if (braceCount > 0) {
                const startPos = document.positionAt(braceMatch.index);
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(startPos, startPos),
                    `Unmatched opening brace in ${braceMatch[3]} block '${braceMatch[2]}'`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
        }

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
            
            // Look for variable declarations: const word = @css/@html
            const blockPattern = new RegExp(`\\b(const|let|var)\\s+(${word})\\s*=\\s*@(css|html)`, 'g');
            const match = blockPattern.exec(text);
            
            if (match) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                return new vscode.Location(document.uri, new vscode.Range(startPos, endPos));
            }
            
            return undefined;
        }
    });

    // Register a code action provider for common fixes
    const codeActionProvider = vscode.languages.registerCodeActionsProvider('mino', {
        provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeAction[]> {
            const actions: vscode.CodeAction[] = [];
            
            for (const diagnostic of context.diagnostics) {
                if (diagnostic.message.includes('@css must be used in variable assignment')) {
                    const action = new vscode.CodeAction('Wrap in variable assignment', vscode.CodeActionKind.QuickFix);
                    action.edit = new vscode.WorkspaceEdit();
                    
                    const line = document.lineAt(diagnostic.range.start);
                    const newText = `const styles = @css {`;
                    const range = new vscode.Range(diagnostic.range.start, diagnostic.range.start);
                    action.edit.replace(document.uri, range, newText);
                    
                    actions.push(action);
                }
                
                if (diagnostic.message.includes('@html must be used in variable assignment')) {
                    const action = new vscode.CodeAction('Wrap in variable assignment', vscode.CodeActionKind.QuickFix);
                    action.edit = new vscode.WorkspaceEdit();
                    
                    const line = document.lineAt(diagnostic.range.start);
                    const newText = `const template = @html {`;
                    const range = new vscode.Range(diagnostic.range.start, diagnostic.range.start);
                    action.edit.replace(document.uri, range, newText);
                    
                    actions.push(action);
                }
            }
            
            return actions;
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
        definitionProvider,
        codeActionProvider
    );
}

export function deactivate() {
    // Clean up resources if needed
}