import * as vscode from 'vscode';
import * as path from 'path';

import { MinoCompiler } from './compiler';
import { MinoDocumentSymbolProvider } from './symbolProvider';
import { MinoCompletionProvider } from './completionHandler';

export function activate(context: vscode.ExtensionContext) {
    console.log('Mino Language Extension is now active!');

    const compiler = new MinoCompiler();

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
            '@', '(', '.'
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
            const compiled = await compiler.compile(editor.document.getText(), editor.document.fileName);
            const { outputDir, outputPath } = getOutputPath(editor.document.fileName);

            await vscode.workspace.fs.createDirectory(vscode.Uri.file(outputDir));
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
            prompt: 'Enter component name',
            placeHolder: 'MyComponent'
        });

        if (!componentName) {
            return;
        }

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
                await compiler.validate(document.getText(), document.fileName);
                diagnosticCollection.set(document.uri, []);
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

function getOutputPath(inputPath: string): { outputDir: string; outputPath: string } {
    const config = vscode.workspace.getConfiguration('mino');
    const outputDirSetting = config.get<string>('outputDirectory', './dist');
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceRoot = workspaceFolders && workspaceFolders.length > 0
        ? workspaceFolders[0].uri.fsPath
        : process.cwd();

    const outputDir = path.isAbsolute(outputDirSetting)
        ? outputDirSetting
        : path.join(workspaceRoot, outputDirSetting);

    const fileName = path.basename(inputPath).replace(/\.mino$/, '.js');
    const outputPath = path.join(outputDir, fileName);

    return { outputDir, outputPath };
}

function createComponentTemplate(componentName: string): string {
    const kebabName = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    
    return `// ${componentName}.mino

@template {
  <div class="${kebabName}">
    <h2>{title}</h2>
    <p>{description}</p>
    <button onclick="{handleClick}">Click me</button>
  </div>
}
@end

@style {
  .${kebabName} {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: Arial, sans-serif;
  }
  
  .${kebabName} h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .${kebabName} button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .${kebabName} button:hover {
    background: #0056b3;
  }
}
@end

@prop (reactive) title = "${componentName}"
@prop (reactive) description = "A new Mino component"

@method (private) handleClick() {
  this.emit('component-click', { 
    title: this.title,
    timestamp: Date.now()
  });
}
@end

@onMounted {
  console.log('${componentName} mounted');
}
@end
`;
}

export function deactivate() {}
