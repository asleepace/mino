import * as path from 'path';

export class MinoCompiler {
  private readonly emitExports: boolean;
  private readonly emitFunctions: boolean;

  constructor(options?: { emitExports?: boolean; emitFunctions?: boolean }) {
    this.emitExports = options?.emitExports ?? true;
    this.emitFunctions = options?.emitFunctions ?? false;
  }

  async compile(source: string, fileName: string): Promise<string> {
    const transformed = this.transformSource(source);
    const banner = `// Generated from ${path.basename(fileName)}\n`;
    return banner + transformed;
  }

  private transformSource(source: string): string {
    let output = '';
    let index = 0;

    const assignmentRegex = /\b(?:(export)\s+)?(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*@(css|html)\s*(?:\(([^)]*)\)\s*)?\{/g;
    const bareRegex = /@(css|html)\s*(?:\(([^)]*)\)\s*)?\{/g;

    while (index < source.length) {
      // Find the next block (assignment or bare)
      assignmentRegex.lastIndex = index;
      bareRegex.lastIndex = index;
      const aMatch = assignmentRegex.exec(source);
      const bMatch = bareRegex.exec(source);

      // Choose the earliest match, prefer assignment when equal
      let nextMatch: RegExpExecArray | null = null;
      let isAssignment = false;
      if (aMatch && bMatch) {
        if (aMatch.index <= bMatch.index) {
          nextMatch = aMatch; isAssignment = true;
        } else {
          nextMatch = bMatch; isAssignment = false;
        }
      } else if (aMatch) {
        nextMatch = aMatch; isAssignment = true;
      } else if (bMatch) {
        nextMatch = bMatch; isAssignment = false;
      } else {
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
        const [, exportKw, decl, varName, blockType, explicitParams] = nextMatch as unknown as [string, string | undefined, string, string, string, string?];
        const params = this.detectParams(content);
        const paramList = Array.from(params).join(', ');
        const body = this.trimOuterWhitespace(content);
        const exportPrefix = (this.emitExports || !!exportKw) ? 'export ' : '';
        if (explicitParams && explicitParams.trim().length > 0) {
          const compiled = `${exportPrefix}const ${varName} = (${explicitParams.trim()}) => \`${body}\`;`;
          output += compiled;
        } else if (this.emitFunctions) {
          const compiled = `${exportPrefix}const ${varName} = (${paramList}) => \`${body}\`;`;
          output += compiled;
        } else {
          const compiled = `${exportPrefix}const ${varName} = \`${body}\`;`;
          output += compiled;
        }
      } else {
        // Bare block anywhere → compile to template literal so it works in expression context
        const body = this.trimOuterWhitespace(content);
        const compiled = `\`${body}\``;
        output += compiled;
      }

      index = endIndex + 1;
    }

    return output;
  }

  private readBalancedBraces(text: string, openBraceIndex: number): { content: string; endIndex: number } {
    let depth = 0;
    let i = openBraceIndex;
    for (; i < text.length; i++) {
      const ch = text[i];
      // Skip interpolation blocks ${ ... } entirely
      if (ch === '$' && i + 1 < text.length && text[i + 1] === '{') {
        i = this.skipInterpolation(text, i + 1); // returns at closing '}' index
        continue;
      }
      if (ch === '{') depth++;
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
      } else if (ch === '/' && i + 1 < text.length && text[i + 1] === '*') {
        i = this.skipBlockComment(text, i);
      } else if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
        i = this.skipLine(text, i);
      }
    }
    return { content: '', endIndex: -1 };
  }

  private skipQuoted(text: string, start: number): number {
    const quote = text[start];
    let i = start + 1;
    while (i < text.length) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i] === quote) return i;
      i++;
    }
    return i;
  }

  private skipBlockComment(text: string, start: number): number {
    // Assumes text[start] === '/' and text[start+1] === '*'
    let i = start + 2;
    while (i + 1 < text.length) {
      if (text[i] === '*' && text[i + 1] === '/') return i + 1;
      i++;
    }
    return i;
  }

  private skipLine(text: string, start: number): number {
    let i = start + 2;
    while (i < text.length && text[i] !== '\n') i++;
    return i;
  }

  private detectParams(content: string): Set<string> {
    const params = new Set<string>();
    const interp = /\$\{([\s\S]*?)\}/g;
    let m: RegExpExecArray | null;
    while ((m = interp.exec(content)) !== null) {
      const expr = m[1].trim();
      const root = this.extractRootIdentifier(expr);
      if (root) params.add(root);
    }
    return params;
  }

  private extractRootIdentifier(expr: string): string | null {
    // Strip leading parentheses
    expr = expr.replace(/^\(+/, '');
    // Match identifier or function call at start
    const id = expr.match(/^([A-Za-z_$][\w$]*)(?=[\s\(\.\[\?\:,$`]|$)/);
    if (!id) return null;
    return id[1];
  }

  private skipInterpolation(text: string, openBraceIndex: number): number {
    // Called at position of '{' that follows '$'
    let depth = 0;
    let i = openBraceIndex;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return i; // index of closing '}'
      }
      if (ch === '"' || ch === '\'' || ch === '`') {
        i = this.skipQuoted(text, i);
      }
    }
    return i;
  }

  private trimOuterWhitespace(s: string): string {
    return s.trim();
  }
}


