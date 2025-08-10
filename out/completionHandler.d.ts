import * as vscode from 'vscode';
export declare class MinoCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[];
    private getDirectiveCompletions;
    private getModifierCompletions;
    private getInterpolationCompletions;
    private getDirectiveSnippet;
}
//# sourceMappingURL=completionHandler.d.ts.map