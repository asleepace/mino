// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Mino language extension is now active!');

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
                        new vscode.MarkdownString('**Mino CSS Block**\n\nEmbed CSS with full syntax highlighting and IntelliSense.')
                    );
                case '@html':
                    return new vscode.Hover(
                        new vscode.MarkdownString('**Mino HTML Block**\n\nEmbed HTML with template interpolation using `${variable}` syntax.')
                    );
                default:
                    return undefined;
            }
        }
    });

    // Register a completion provider for Mino directives
    const completionProvider = vscode.languages.registerCompletionItemProvider('mino', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[]> {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            
            if (!linePrefix.endsWith('@')) {
                return undefined;
            }

            const cssCompletion = new vscode.CompletionItem('@css', vscode.CompletionItemKind.Keyword);
            cssCompletion.insertText = new vscode.SnippetString('css {\n\t${1:/* CSS styles */}\n}');
            cssCompletion.documentation = new vscode.MarkdownString('Create a CSS block with syntax highlighting');

            const htmlCompletion = new vscode.CompletionItem('@html', vscode.CompletionItemKind.Keyword);
            htmlCompletion.insertText = new vscode.SnippetString('html {\n\t${1:<!-- HTML content -->}\n}');
            htmlCompletion.documentation = new vscode.MarkdownString('Create an HTML block with template interpolation');

            return [cssCompletion, htmlCompletion];
        }
    }, '@');

    // Register diagnostic provider for basic syntax validation
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('mino');
    
    const validateDocument = (document: vscode.TextDocument) => {
        if (document.languageId !== 'mino') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        
        // Check for unmatched braces in Mino blocks
        const cssMatches = text.matchAll(/@css\s*\{/g);
        const htmlMatches = text.matchAll(/@html\s*\{/g);
        
        for (const match of cssMatches) {
            if (match.index !== undefined) {
                const startPos = document.positionAt(match.index);
                // Simple brace counting - could be improved
                const afterMatch = text.slice(match.index + match[0].length);
                let braceCount = 1;
                let i = 0;
                while (i < afterMatch.length && braceCount > 0) {
                    if (afterMatch[i] === '{') braceCount++;
                    if (afterMatch[i] === '}') braceCount--;
                    i++;
                }
                if (braceCount > 0) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(startPos, startPos.translate(0, match[0].length)),
                        'Unmatched opening brace in @css block',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostics.push(diagnostic);
                }
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

    // Add all subscriptions
    context.subscriptions.push(
        formatCommand,
        hoverProvider,
        completionProvider,
        diagnosticCollection,
        onDocumentChange,
        onDocumentOpen
    );
}

export function deactivate() {
    // Clean up resources if needed
}