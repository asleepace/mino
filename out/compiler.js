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
    constructor(options) {
        this.emitExports = options?.emitExports ?? true;
        this.emitFunctions = options?.emitFunctions ?? false;
    }
    async compile(source, fileName) {
        const transformed = this.transformSource(source);
        const banner = `// Generated from ${path.basename(fileName)}\n`;
        return banner + transformed;
    }
    transformSource(source) {
        let output = '';
        let index = 0;
        let usedFlattenHelper = false;
        const assignmentRegex = /\b(?:(export)\s+)?(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*@(css|html)\s*(?:\(([^)]*)\)\s*)?(\{|\()/g;
        const bareRegex = /@(css|html)\s*(?:\(([^)]*)\)\s*)?(\{|\()/g;
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
            // Find the block opening brace that this regex matched (not parameter braces)
            const matchedText = nextMatch[0];
            // Prefer the delimiter actually captured by the regex (group 6 for assignment, group 3 for bare)
            const openDelim = isAssignment ? nextMatch[6] : nextMatch[3];
            let openTokenIndex = -1;
            if (openDelim === '{' || openDelim === '(') {
                openTokenIndex = matchedText.lastIndexOf(openDelim);
            }
            else {
                // Fallback: choose the rightmost of '{' or '('
                const idxBrace = matchedText.lastIndexOf('{');
                const idxParen = matchedText.lastIndexOf('(');
                openTokenIndex = Math.max(idxBrace, idxParen);
            }
            const openPos = openTokenIndex >= 0 ? (nextMatch.index + openTokenIndex) : -1;
            if (openPos < 0) {
                // Malformed; just emit the rest and stop
                output += source.slice(nextMatch.index);
                break;
            }
            const openChar = source[openPos];
            const { content, endIndex } = openChar === '{' ? this.readBalancedBraces(source, openPos) : this.readBalancedParens(source, openPos);
            if (endIndex < 0) {
                // Unbalanced; emit as-is
                output += source.slice(nextMatch.index);
                break;
            }
            if (isAssignment) {
                const [, exportKw, decl, varName, blockType, explicitParams] = nextMatch;
                const params = this.detectParams(content);
                const paramList = Array.from(params).join(', ');
                let body = this.trimOuterWhitespace(content);
                // JSX-like braces to template interpolation for HTML blocks
                if (blockType === 'html') {
                    body = this.convertJsxBracesToTemplate(body);
                }
                // Auto-spread arrays: ${...expr} → ${__mino_flat(expr)}
                if (/\$\{\s*\.\.\./.test(body)) {
                    usedFlattenHelper = true;
                    body = body.replace(/\$\{\s*\.\.\.([\s\S]*?)\}/g, (_m, expr) => '${' + '__mino_flat' + '(' + expr.trim() + ')}');
                }
                // Positional args: $0, $1 triggers function with (...args)
                const positionalMatches = Array.from(body.matchAll(/\$(\d+)/g));
                const hasPositional = positionalMatches.length > 0;
                const exportPrefix = (this.emitExports || !!exportKw) ? 'export ' : '';
                const isHtml = blockType === 'html';
                const jsDocHeader = this.buildJsDocForAssignment(varName, isHtml, explicitParams, hasPositional || this.emitFunctions || (!!explicitParams && explicitParams.trim().length > 0), params);
                let bodyEsc = body.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
                bodyEsc = bodyEsc.replace(/\$\$\{/g, '${');
                if (explicitParams && explicitParams.trim().length > 0) {
                    // Allow explicit params; keep as arrow with those params
                    const compiled = jsDocHeader + exportPrefix + 'const ' + varName + ' = (' + explicitParams.trim() + ') => ' + '`' + bodyEsc + '`;';
                    output += compiled;
                }
                else if (hasPositional || this.emitFunctions) {
                    // Use rest args and replace $n with args[n]
                    const bodyPos = body.replace(/\$(\d+)/g, (_m, d) => '${args[' + Number(d) + '] ?? \'\'}');
                    let bodyPosEsc = bodyPos.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
                    bodyPosEsc = bodyPosEsc.replace(/\$\$\{/g, '${');
                    const compiled = jsDocHeader + exportPrefix + 'const ' + varName + ' = (...args) => ' + '`' + bodyPosEsc + '`;';
                    output += compiled;
                }
                else {
                    const compiled = jsDocHeader + exportPrefix + 'const ' + varName + ' = ' + '`' + bodyEsc + '`;';
                    output += compiled;
                }
            }
            else {
                // Bare block anywhere → compile to template literal so it works in expression context
                let body = this.trimOuterWhitespace(content);
                const isHtmlBare = nextMatch[1] === 'html';
                if (isHtmlBare) {
                    body = this.convertJsxBracesToTemplate(body);
                }
                if (/\$\{\s*\.\.\./.test(body)) {
                    usedFlattenHelper = true;
                    body = body.replace(/\$\{\s*\.\.\.([\s\S]*?)\}/g, (_m, expr) => '${' + '__mino_flat' + '(' + expr.trim() + ')}');
                }
                let bodyEsc = body.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
                bodyEsc = bodyEsc.replace(/\$\$\{/g, '${');
                const compiled = '`' + bodyEsc + '`';
                output += compiled;
            }
            index = endIndex + 1;
        }
        // Prepend helper if used
        if (usedFlattenHelper) {
            const helper = `function __mino_flat(v){return Array.isArray(v)?v.join(''): (v ?? '')}`;
            output = helper + '\n' + output;
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
    buildJsDocForAssignment(name, isHtml, explicitParams, isFunction, inferredParams) {
        const lines = [];
        lines.push('/**');
        lines.push(` * ${isHtml ? 'HTML' : 'CSS'} template ${isFunction ? 'function' : 'string'} generated by Mino`);
        if (explicitParams && explicitParams.trim()) {
            const raw = explicitParams.trim();
            // Split top-level params by comma (ignore commas inside braces)
            const parts = [];
            let buf = '';
            let depth = 0;
            for (let i = 0; i < raw.length; i++) {
                const ch = raw[i];
                if (ch === '{' || ch === '[')
                    depth++;
                if (ch === '}' || ch === ']')
                    depth--;
                if (ch === ',' && depth === 0) {
                    parts.push(buf.trim());
                    buf = '';
                    continue;
                }
                buf += ch;
            }
            if (buf.trim())
                parts.push(buf.trim());
            parts.forEach((p, idx) => {
                const token = p.trim();
                if (!token)
                    return;
                if (token.startsWith('{') || token.startsWith('[')) {
                    const name = parts.length === 1 ? 'params' : `arg${idx}`;
                    lines.push(` * @param {object} ${name}`);
                }
                else {
                    // Strip default initializer
                    const name = token.split('=')[0].trim();
                    lines.push(` * @param ${name}`);
                }
            });
        }
        else if (isFunction && inferredParams && inferredParams.size > 0) {
            lines.push(' * @param {...any} args Positional parameters used as $0, $1, ...');
        }
        lines.push(' * @returns {string}');
        lines.push(' */\n');
        return lines.join('\n');
    }
    readBalancedParens(text, openParenIndex) {
        let depth = 0;
        for (let i = openParenIndex; i < text.length; i++) {
            const ch = text[i];
            if (ch === '$' && text[i + 1] === '{') {
                i = this.skipInterpolation(text, i + 1);
                continue;
            }
            if (ch === '(')
                depth++;
            else if (ch === ')') {
                depth--;
                if (depth === 0)
                    return { content: text.slice(openParenIndex + 1, i), endIndex: i };
            }
            if (ch === '"' || ch === '\'' || ch === '`')
                i = this.skipQuoted(text, i);
        }
        return { content: '', endIndex: -1 };
    }
    convertJsxBracesToTemplate(body) {
        // Replace occurrences of {...} that are not ${...} into ${...}
        return body.replace(/\{(?!\$)\s*([\s\S]*?)\s*\}/g, (_m, expr) => '${' + expr + '}');
    }
}
exports.MinoCompiler = MinoCompiler;
//# sourceMappingURL=compiler.js.map