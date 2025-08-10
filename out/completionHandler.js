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
exports.MinoCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
class MinoCompletionProvider {
    provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        // Directive completions
        if (linePrefix.endsWith('@')) {
            return this.getDirectiveCompletions();
        }
        // Modifier completions
        if (linePrefix.includes('@') && linePrefix.includes('(') && !linePrefix.includes(')')) {
            return this.getModifierCompletions();
        }
        // Property interpolation completions
        if (linePrefix.includes('{') && !linePrefix.includes('}')) {
            return this.getInterpolationCompletions(document);
        }
        return [];
    }
    getDirectiveCompletions() {
        const directives = [
            { name: 'prop', detail: 'Component property', kind: vscode.CompletionItemKind.Property },
            { name: 'template', detail: 'HTML template block', kind: vscode.CompletionItemKind.Module },
            { name: 'style', detail: 'CSS style block', kind: vscode.CompletionItemKind.Module },
            { name: 'script', detail: 'JavaScript block', kind: vscode.CompletionItemKind.Module },
            { name: 'method', detail: 'Component method', kind: vscode.CompletionItemKind.Method },
            { name: 'alias', detail: 'Alias definition', kind: vscode.CompletionItemKind.Reference },
            { name: 'directive', detail: 'Custom directive', kind: vscode.CompletionItemKind.Function },
            { name: 'onMounted', detail: 'Lifecycle: component mounted', kind: vscode.CompletionItemKind.Event },
            { name: 'onUpdated', detail: 'Lifecycle: component updated', kind: vscode.CompletionItemKind.Event },
            { name: 'onUnmounted', detail: 'Lifecycle: component unmounted', kind: vscode.CompletionItemKind.Event },
            { name: 'init', detail: 'Lifecycle: component initialization', kind: vscode.CompletionItemKind.Event },
            { name: 'render', detail: 'Lifecycle: render method', kind: vscode.CompletionItemKind.Event }
        ];
        return directives.map(directive => {
            const item = new vscode.CompletionItem(directive.name, directive.kind);
            item.detail = directive.detail;
            item.insertText = new vscode.SnippetString(this.getDirectiveSnippet(directive.name));
            return item;
        });
    }
    getModifierCompletions() {
        const modifiers = [
            'public', 'private', 'static', 'reactive', 'computed',
            'async', 'required', 'optional', 'scoped'
        ];
        return modifiers.map(modifier => {
            const item = new vscode.CompletionItem(modifier, vscode.CompletionItemKind.Keyword);
            return item;
        });
    }
    getInterpolationCompletions(document) {
        // Extract properties from @prop declarations
        const properties = [];
        const text = document.getText();
        const propRegex = /@prop\s*(?:\([^)]*\))?\s*([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = propRegex.exec(text)) !== null) {
            properties.push(match[1]);
        }
        return properties.map(prop => {
            const item = new vscode.CompletionItem(prop, vscode.CompletionItemKind.Property);
            item.detail = 'Component property';
            return item;
        });
    }
    getDirectiveSnippet(directive) {
        switch (directive) {
            case 'prop':
                return '@prop ${1:(${2:modifiers})} ${3:propName} = ${4:defaultValue}';
            case 'template':
                return '@template {\n  ${1:<!-- Template content -->}\n}\n@end';
            case 'style':
                return '@style {\n  ${1:/* Styles */}\n}\n@end';
            case 'script':
                return '@script {\n  ${1:// JavaScript code}\n}\n@end';
            case 'method':
                return '@method ${1:(${2:modifiers})} ${3:methodName}(${4:parameters}) {\n  ${5:// Method implementation}\n}\n@end';
            case 'onMounted':
                return '@onMounted {\n  ${1:// Component mounted}\n}\n@end';
            case 'onUpdated':
                return '@onUpdated(${1:name, oldValue, newValue}) {\n  ${2:// Attribute changed}\n}\n@end';
            case 'onUnmounted':
                return '@onUnmounted {\n  ${1:// Component cleanup}\n}\n@end';
            case 'init':
                return '@init {\n  ${1:// Initialization code}\n}\n@end';
            case 'render':
                return '@render {\n  ${1:// Render logic}\n}\n@end';
            case 'alias':
                return '@alias ${1:(${2:type})} ${3:aliasName} = ${4:value}';
            case 'directive':
                return '@directive ${1:directiveName}(ast) {\n  ${2:// Code generation}\n  return ${3:generatedCode};\n}\n@end';
            default:
                return directive;
        }
    }
}
exports.MinoCompletionProvider = MinoCompletionProvider;
//# sourceMappingURL=completionHandler.js.map