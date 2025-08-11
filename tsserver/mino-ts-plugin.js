function create(info) {
  const ts = info.typescript;

  const origGetScriptSnapshot = info.languageServiceHost.getScriptSnapshot?.bind(info.languageServiceHost);

  function transformForTS(sourceText) {
    return transformMinoToJS(sourceText);
  }

  if (origGetScriptSnapshot) {
    info.languageServiceHost.getScriptSnapshot = (fileName) => {
      const snap = origGetScriptSnapshot(fileName);
      if (!snap) return snap;
      if (!fileName.endsWith('.jsxm') && !fileName.endsWith('.mino')) return snap;
      const text = snap.getText(0, snap.getLength());
      const out = transformForTS(text);
      return ts.ScriptSnapshot.fromString(out);
    };
  }

  return info.languageService;
}

function transformMinoToJS(src) {
  // Convert @html/@css blocks to template strings for TS parsing
  let out = '';
  let i = 0;
  const re = /@(html|css)\s*(?:\([^)]*\)\s*)?\{/g;
  while (i < src.length) {
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) { out += src.slice(i); break; }
    out += src.slice(i, m.index);
    const open = src.indexOf('{', m.index);
    const { content, endIndex } = readBalancedBraces(src, open);
    if (endIndex < 0) { out += src.slice(m.index); break; }
    out += '`' + trimOuter(content) + '`';
    i = endIndex + 1;
  }
  return out;
}

function readBalancedBraces(text, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === '$' && text[i + 1] === '{') { i = skipInterpolation(text, i + 1); continue; }
    if (ch === '"' || ch === '\'' || ch === '`') { i = skipQuoted(text, i); continue; }
    if (ch === '/' && text[i + 1] === '*') { i = skipBlockComment(text, i); continue; }
    if (ch === '/' && text[i + 1] === '/') { i = skipLine(text, i); continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { content: text.slice(openBraceIndex + 1, i), endIndex: i };
      }
    }
  }
  return { content: '', endIndex: -1 };
}

function skipQuoted(text, start) {
  const q = text[start];
  let i = start + 1;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === q) return i;
    i++;
  }
  return i;
}
function skipBlockComment(text, start) {
  let i = start + 2;
  while (i + 1 < text.length) {
    if (text[i] === '*' && text[i + 1] === '/') return i + 1;
    i++;
  }
  return i;
}
function skipLine(text, start) { let i = start + 2; while (i < text.length && text[i] !== '\n') i++; return i; }
function skipInterpolation(text, openIdx) { let d = 0; let i = openIdx; for (; i < text.length; i++) { const c = text[i]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) return i; } if (c === '"' || c === '\'' || c === '`') i = skipQuoted(text, i); } return i; }
function trimOuter(s) { return s.replace(/^\s*\r?\n/, '').replace(/\r?\n\s*$/, ''); }

module.exports = { create };


