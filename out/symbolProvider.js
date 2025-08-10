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
exports.MinoDocumentSymbolProvider = void 0;
const vscode = __importStar(require("vscode"));
class MinoDocumentSymbolProvider {
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Find @prop declarations
            const propMatch = line.match(/@prop\s*(?:\([^)]*\))?\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (propMatch) {
                const symbol = new vscode.DocumentSymbol(propMatch[1], 'Property', vscode.SymbolKind.Property, new vscode.Range(i, 0, i, line.length), new vscode.Range(i, 0, i, line.length));
                symbols.push(symbol);
            }
            // Find @method declarations
            const methodMatch = line.match(/@method\s*(?:\([^)]*\))?\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (methodMatch) {
                const symbol = new vscode.DocumentSymbol(methodMatch[1], 'Method', vscode.SymbolKind.Method, new vscode.Range(i, 0, i, line.length), new vscode.Range(i, 0, i, line.length));
                symbols.push(symbol);
            }
            // Find lifecycle methods
            const lifecycleMatch = line.match(/@(onMounted|onUpdated|onUnmounted|init|render)/);
            if (lifecycleMatch) {
                const symbol = new vscode.DocumentSymbol(lifecycleMatch[1], 'Lifecycle', vscode.SymbolKind.Event, new vscode.Range(i, 0, i, line.length), new vscode.Range(i, 0, i, line.length));
                symbols.push(symbol);
            }
            // Find @template and @style blocks
            const blockMatch = line.match(/@(template|style|script)/);
            if (blockMatch) {
                const symbol = new vscode.DocumentSymbol(blockMatch[1], 'Block', vscode.SymbolKind.Module, new vscode.Range(i, 0, i, line.length), new vscode.Range(i, 0, i, line.length));
                symbols.push(symbol);
            }
        }
        return symbols;
    }
}
exports.MinoDocumentSymbolProvider = MinoDocumentSymbolProvider;
//# sourceMappingURL=symbolProvider.js.map