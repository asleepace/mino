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
exports.MinoCompiler = void 0;
const path = __importStar(require("path"));
class MinoCompiler {
    async compile(source, fileName) {
        const transformed = this.transformSource(source);
        const banner = `// Generated from ${path.basename(fileName)}\n`;
        return banner + transformed;
    }
    transformSource(source) {
        let output = '';
        let index = 0;
        const assignmentRegex = /\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*@(css|html)\s*\{/g;
        const bareRegex = /@(css|html)\s*\{/g;
        while (index < source.length) {
            // Find the next block (assignment or bare)
            assignmentRegex.lastIndex = index;
            bareRegex.lastIndex = index;
            const aMatch = assignmentRegex.exec(source);
            const bMatch = bareRegex.exec(source);
            // Choose the earliest match, prefer assignment when equal
            let nextMatch = null;
            let isAssignment = false;
            if (aMatch && bMatch) {
                if (aMatch.index <= bMatch.index) {
                    nextMatch = aMatch;
                    isAssignment = true;
                }
                else {
                    nextMatch = bMatch;
                    isAssignment = false;
                }
            }
            else if (aMatch) {
                nextMatch = aMatch;
                isAssignment = true;
            }
            else if (bMatch) {
                nextMatch = bMatch;
                isAssignment = false;
            }
            else {
                // No more matches
                output += source.slice(index);
                break;
            }
            // Emit code up to the match
            output += source.slice(index, nextMatch.index);
            // Find block content by matching braces
            const openBracePos = source.indexOf('{', nextMatch.index);
            if (openBracePos < 0) {
                // Malformed; just emit the rest and stop
                output += source.slice(nextMatch.index);
                break;
            }
            const { content, endIndex } = this.readBalancedBraces(source, openBracePos);
            if (endIndex < 0) {
                // Unbalanced; emit as-is
                output += source.slice(nextMatch.index);
                break;
            }
            if (isAssignment) {
                const [, decl, varName, blockType] = nextMatch;
                const params = this.detectParams(content);
                const paramList = Array.from(params).join(', ');
                const body = this.trimOuterWhitespace(content);
                const compiled = `const ${varName} = (${paramList}) => \`${body}\`;`;
                output += compiled;
            }
            else {
                // Bare block → compile to inert expression so output stays valid JS
                const body = this.trimOuterWhitespace(content);
                const compiled = `void \`${body}\`;`;
                output += compiled;
            }
            index = endIndex + 1;
        }
        return output;
    }
    readBalancedBraces(text, openBraceIndex) {
        let depth = 0;
        let i = openBraceIndex;
        for (; i < text.length; i++) {
            const ch = text[i];
            // Skip interpolation blocks ${ ... } entirely
            if (ch === '$' && i + 1 < text.length && text[i + 1] === '{') {
                i = this.skipInterpolation(text, i + 1); // returns at closing '}' index
                continue;
            }
            if (ch === '{')
                depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) {
                    const inner = text.slice(openBraceIndex + 1, i);
                    return { content: inner, endIndex: i };
                }
            }
            // Minimal string and escape handling to avoid counting braces in strings
            if (ch === '"' || ch === '\'' || ch === '`') {
                i = this.skipQuoted(text, i);
            }
            else if (ch === '/' && i + 1 < text.length && text[i + 1] === '*') {
                i = this.skipBlockComment(text, i);
            }
            else if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
                i = this.skipLine(text, i);
            }
        }
        return { content: '', endIndex: -1 };
    }
    skipQuoted(text, start) {
        const quote = text[start];
        let i = start + 1;
        while (i < text.length) {
            if (text[i] === '\\') {
                i += 2;
                continue;
            }
            if (text[i] === quote)
                return i;
            i++;
        }
        return i;
    }
    skipBlockComment(text, start) {
        // Assumes text[start] === '/' and text[start+1] === '*'
        let i = start + 2;
        while (i + 1 < text.length) {
            if (text[i] === '*' && text[i + 1] === '/')
                return i + 1;
            i++;
        }
        return i;
    }
    skipLine(text, start) {
        let i = start + 2;
        while (i < text.length && text[i] !== '\n')
            i++;
        return i;
    }
    detectParams(content) {
        const params = new Set();
        const interp = /\$\{([\s\S]*?)\}/g;
        let m;
        while ((m = interp.exec(content)) !== null) {
            const expr = m[1].trim();
            const root = this.extractRootIdentifier(expr);
            if (root)
                params.add(root);
        }
        return params;
    }
    extractRootIdentifier(expr) {
        // Strip leading parentheses
        expr = expr.replace(/^\(+/, '');
        // Match identifier or function call at start
        const id = expr.match(/^([A-Za-z_$][\w$]*)(?=[\s\(\.\[\?\:,$`]|$)/);
        if (!id)
            return null;
        return id[1];
    }
    skipInterpolation(text, openBraceIndex) {
        // Called at position of '{' that follows '$'
        let depth = 0;
        let i = openBraceIndex;
        for (; i < text.length; i++) {
            const ch = text[i];
            if (ch === '{')
                depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0)
                    return i; // index of closing '}'
            }
            if (ch === '"' || ch === '\'' || ch === '`') {
                i = this.skipQuoted(text, i);
            }
        }
        return i;
    }
    trimOuterWhitespace(s) {
        return s.trim();
    }
}
exports.MinoCompiler = MinoCompiler;
//# sourceMappingURL=compiler.js.map