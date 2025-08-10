import * as vscode from 'vscode';

export class MinoDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Find @prop declarations
            const propMatch = line.match(/@prop\s*(?:\([^)]*\))?\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (propMatch) {
                const symbol = new vscode.DocumentSymbol(
                    propMatch[1],
                    'Property',
                    vscode.SymbolKind.Property,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                symbols.push(symbol);
            }

            // Find @method declarations
            const methodMatch = line.match(/@method\s*(?:\([^)]*\))?\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (methodMatch) {
                const symbol = new vscode.DocumentSymbol(
                    methodMatch[1],
                    'Method',
                    vscode.SymbolKind.Method,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                symbols.push(symbol);
            }

            // Find lifecycle methods
            const lifecycleMatch = line.match(/@(onMounted|onUpdated|onUnmounted|init|render)/);
            if (lifecycleMatch) {
                const symbol = new vscode.DocumentSymbol(
                    lifecycleMatch[1],
                    'Lifecycle',
                    vscode.SymbolKind.Event,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                symbols.push(symbol);
            }

            // Find @template and @style blocks
            const blockMatch = line.match(/@(template|style|script)/);
            if (blockMatch) {
                const symbol = new vscode.DocumentSymbol(
                    blockMatch[1],
                    'Block',
                    vscode.SymbolKind.Module,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                symbols.push(symbol);
            }
        }

        return symbols;
    }
}