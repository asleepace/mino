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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// src/extension.ts
const vscode = __importStar(require("vscode"));
const compiler_1 = require("./compiler");
function activate(context) {
    console.log('Mino v2.0 language extension is now active!');
    // Register a command to compile .mino -> .js in dist/
    const compiler = new compiler_1.MinoCompiler();
    const compileCommand = vscode.commands.registerCommand('mino.compileFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a .mino or .jsxm file to compile.');
            return;
        }
        try {
            const cfg = vscode.workspace.getConfiguration();
            const emitExports = cfg.get('mino.compiler.emitExports', true);
            const emitFunctions = cfg.get('mino.compiler.emitFunctions', false);
            const compiler = new compiler_1.MinoCompiler({ emitExports, emitFunctions });
            const src = editor.document.getText();
            const compiled = await compiler.compile(src, editor.document.fileName);
            const pathMod = require('path');
            const outDir = cfg.get('mino.outputDirectory', './dist');
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath || process.cwd();
            const fileBase = pathMod.basename(editor.document.fileName).replace(/\.(mino|jsxm)$/i, '');
            const outFsPath = pathMod.resolve(workspaceFolder, outDir, `${fileBase}.js`);
            const outUri = vscode.Uri.file(outFsPath);
            const outDirUri = vscode.Uri.file(pathMod.dirname(outFsPath));
            await vscode.workspace.fs.createDirectory(outDirUri);
            await vscode.workspace.fs.writeFile(outUri, Buffer.from(compiled, 'utf8'));
            vscode.window.showInformationMessage(`Compiled to ${outFsPath}`);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Mino compile error: ${err?.message || String(err)}`);
        }
    });
    // Register a hover provider for Mino syntax
    const hoverProvider = vscode.languages.registerHoverProvider('mino', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return undefined;
            }
            const word = document.getText(range);
            switch (word) {
                case '@css':
                    return new vscode.Hover(new vscode.MarkdownString('**Mino CSS Block**\n\nDefine reusable CSS styles with variable assignment.\n\n```mino\nconst styles = @css {\n  .btn { background: ${color}; }\n}\n```'));
                case '@html':
                    return new vscode.Hover(new vscode.MarkdownString('**Mino HTML Block**\n\nDefine reusable HTML templates with `${variable}` interpolation.\n\n```mino\nconst template = @html {\n  <div>${content}</div>\n}\n```'));
                default:
                    return undefined;
            }
        }
    });
    // Register a completion provider for Mino directives
    const completionProvider = vscode.languages.registerCompletionItemProvider('mino', {
        provideCompletionItems(document, position, token, context) {
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
    const validateDocument = (document) => {
        if (document.languageId !== 'mino') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        const lines = text.split('\n');
        // Track declared block variables to detect duplicates
        const declaredVariables = new Map();
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
                const firstDeclarationLine = declaredVariables.get(varName);
                const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), `Duplicate variable name '${varName}'. First declared on line ${firstDeclarationLine + 1}.`, vscode.DiagnosticSeverity.Error);
                diagnostics.push(diagnostic);
            }
            else {
                declaredVariables.set(varName, startPos.line);
            }
        }
        // Check for invalid variable names
        const invalidVariablePattern = /\b(const|let|var)\s+([^a-zA-Z_$]|\d\w*)\s*=\s*@(css|html)/g;
        let invalidMatch;
        while ((invalidMatch = invalidVariablePattern.exec(text)) !== null) {
            const startPos = document.positionAt(invalidMatch.index);
            const endPos = document.positionAt(invalidMatch.index + invalidMatch[0].length);
            const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), 'Variable names must be valid JavaScript identifiers (start with letter, $, or _)', vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        }
        // Check for invalid @css/@html usage: allow bare blocks, shorthand params, and assignment blocks
        const invalidBlockPattern = /@(css|html)(?!\s*(\{|\(|[a-zA-Z]))/g;
        let invalidMatch2;
        while ((invalidMatch2 = invalidBlockPattern.exec(text)) !== null) {
            // If not followed by '{' or an identifier, flag usage
            const startPos = document.positionAt(invalidMatch2.index);
            const endPos = document.positionAt(invalidMatch2.index + invalidMatch2[0].length);
            const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), `@${invalidMatch2[1]} must be followed by '{' or '(...) {' or used in variable assignment`, vscode.DiagnosticSeverity.Error);
            diagnostics.push(diagnostic);
        }
        // Check for nested variable-declared blocks (not allowed). Bare blocks could appear inside JS blocks; keep rule for assignments only.
        lines.forEach((line, lineIndex) => {
            if (line.match(/^\s+(const|let|var)\s+\w+\s*=\s*@(css|html)/)) {
                const startPos = new vscode.Position(lineIndex, 0);
                const endPos = new vscode.Position(lineIndex, line.length);
                const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, endPos), 'Nested blocks are not allowed. Blocks must be declared at the top level.', vscode.DiagnosticSeverity.Error);
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
                if (text[pos] === '{')
                    braceCount++;
                else if (text[pos] === '}')
                    braceCount--;
                pos++;
            }
            if (braceCount > 0) {
                const startPos = document.positionAt(braceMatch.index);
                const diagnostic = new vscode.Diagnostic(new vscode.Range(startPos, startPos), `Unmatched opening brace in ${braceMatch[3]} block '${braceMatch[2]}'`, vscode.DiagnosticSeverity.Error);
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
    // Auto-compile on save if enabled
    const onDidSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const pathMod = require('path');
        const ext = pathMod.extname(document.fileName).toLowerCase();
        const cfg = vscode.workspace.getConfiguration();
        const watchExts = cfg.get('mino.compileOnSaveExtensions', ['.mino', '.jsxm']).map(s => s.toLowerCase());
        if (!watchExts.includes(ext))
            return;
        const auto = cfg.get('mino.autoCompile', true);
        if (!auto)
            return;
        try {
            const emitExports = cfg.get('mino.compiler.emitExports', true);
            const emitFunctions = cfg.get('mino.compiler.emitFunctions', false);
            const compiler = new compiler_1.MinoCompiler({ emitExports, emitFunctions });
            const compiled = await compiler.compile(document.getText(), document.fileName);
            const outDir = cfg.get('mino.outputDirectory', './dist');
            const root = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || process.cwd();
            const fileBase = pathMod.basename(document.fileName).replace(/\.(mino|jsxm)$/i, '');
            const outFsPath = pathMod.resolve(root, outDir, `${fileBase}.js`);
            const outUri = vscode.Uri.file(outFsPath);
            const outDirUri = vscode.Uri.file(pathMod.dirname(outFsPath));
            await vscode.workspace.fs.createDirectory(outDirUri);
            await vscode.workspace.fs.writeFile(outUri, Buffer.from(compiled, 'utf8'));
            if (cfg.get('mino.showCompileNotifications', true)) {
                vscode.window.showInformationMessage(`Mino: Compiled ${document.uri.path} → ${outFsPath}`);
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`Mino compile error: ${err?.message || String(err)}`);
        }
    });
    // Register a definition provider for block references
    const definitionProvider = vscode.languages.registerDefinitionProvider('mino', {
        provideDefinition(document, position, token) {
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
        provideCodeActions(document, range, context, token) {
            const actions = [];
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
    context.subscriptions.push(compileCommand, hoverProvider, completionProvider, diagnosticCollection, onDocumentChange, onDocumentOpen, definitionProvider, codeActionProvider, onDidSave);
    // Note: We intentionally do not register a FileDecorationProvider to avoid extra badges
    // Semantic tokens to mark variables assigned from @html/@css
    const tokenTypes = ['function'];
    const tokenModifiers = ['declaration', 'html', 'css'];
    const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
    const semanticProvider = {
        provideDocumentSemanticTokens(document) {
            const builder = new vscode.SemanticTokensBuilder(legend);
            const text = document.getText();
            const lines = text.split(/\r?\n/);
            const htmlAssign = /\b(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*@html\b/;
            const cssAssign = /\b(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*@css\b/;
            for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const line = lines[lineIdx];
                let m = htmlAssign.exec(line);
                if (m) {
                    const varName = m[2];
                    const start = line.indexOf(varName);
                    if (start >= 0) {
                        const mods = (1 << 0) | (1 << 1); // declaration + html
                        builder.push(lineIdx, start, varName.length, 0 /* function */, mods);
                    }
                }
                m = cssAssign.exec(line);
                if (m) {
                    const varName = m[2];
                    const start = line.indexOf(varName);
                    if (start >= 0) {
                        const mods = (1 << 0) | (1 << 2); // declaration + css
                        builder.push(lineIdx, start, varName.length, 0 /* function */, mods);
                    }
                }
            }
            return builder.build();
        }
    };
    // Apply to both 'mino' and 'javascript' so .mino and .jsxm get tags
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'mino' }, semanticProvider, legend), vscode.languages.registerDocumentSemanticTokensProvider({ language: 'javascript' }, semanticProvider, legend));
    // Simple formatter (2-space indent) for Mino and .jsxm JavaScript
    const formatDoc = (document) => {
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        let depth = 0;
        const formatted = [];
        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i].replace(/\s+$/g, '');
            const trimmed = raw.trim();
            // De-dent on leading closers
            const leading = trimmed.match(/^[}\)]/);
            if (leading)
                depth = Math.max(0, depth - 1);
            const indent = '  '.repeat(depth);
            formatted.push(trimmed ? indent + trimmed : '');
            // Adjust depth after line for openers/closers
            const opens = (trimmed.match(/[\{\(]/g) || []).length;
            const closes = (trimmed.match(/[\}\)]/g) || []).length;
            depth = Math.max(0, depth + opens - closes);
        }
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
        return [vscode.TextEdit.replace(fullRange, formatted.join('\n'))];
    };
    const minoFormatter = vscode.languages.registerDocumentFormattingEditProvider({ language: 'mino' }, {
        provideDocumentFormattingEdits: (document) => formatDoc(document)
    });
    const jsxmFormatter = vscode.languages.registerDocumentFormattingEditProvider({ language: 'javascript', pattern: '**/*.jsxm' }, {
        provideDocumentFormattingEdits: (document) => formatDoc(document)
    });
    context.subscriptions.push(minoFormatter, jsxmFormatter);
}
exports.activate = activate;
function deactivate() {
    // Clean up resources if needed
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map