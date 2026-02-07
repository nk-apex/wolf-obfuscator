type Language = 'javascript' | 'css' | 'html' | 'batch';

interface ObfuscationOptions {
  language: Language;
  stringEncryption: boolean;
  controlFlowFlattening: boolean;
  deadCodeInjection: boolean;
  identifierMangling: boolean;
  selfDefending: boolean;
  domainLock: string;
  debugProtection: boolean;
  compressCode: boolean;
  encryptionRounds: number;
}

const DEFAULT_OPTIONS: ObfuscationOptions = {
  language: 'javascript',
  stringEncryption: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  identifierMangling: true,
  selfDefending: true,
  domainLock: '',
  debugProtection: true,
  compressCode: true,
  encryptionRounds: 3,
};

const CUSTOM_ALPHABET = 'WOLF9876543210ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/=';
const STANDARD_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function customB64Encode(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  let result = '';
  for (let i = 0; i < b64.length; i++) {
    const idx = STANDARD_B64.indexOf(b64[i]);
    result += idx >= 0 ? CUSTOM_ALPHABET[idx] : b64[i];
  }
  return result;
}

function xorEncrypt(str: string, keys: number[]): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ keys[i % keys.length];
    result += String.fromCharCode(charCode);
  }
  return result;
}

function generateRandomName(length: number = 8): string {
  const prefixes = ['_0x', '_$', '__', '$_', '_W', '_O', '_L', '_F'];
  const chars = 'abcdef0123456789';
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let name = prefix;
  for (let i = 0; i < length; i++) {
    name += chars[Math.floor(Math.random() * chars.length)];
  }
  return name;
}

function generateDeadCode(): string {
  const templates = [
    () => {
      const fn = generateRandomName(6);
      const v1 = generateRandomName(4);
      const v2 = generateRandomName(4);
      return `function ${fn}(${v1}){var ${v2}=${v1}*0x${Math.floor(Math.random()*255).toString(16)};if(${v2}>${Math.floor(Math.random()*1000)}){return ${v2}+0x${Math.floor(Math.random()*255).toString(16)};}return ${v1};}`;
    },
    () => {
      const v1 = generateRandomName(5);
      return `var ${v1}=[${Array.from({length: Math.floor(Math.random()*5)+3}, () => `0x${Math.floor(Math.random()*65535).toString(16)}`).join(',')}];`;
    },
    () => {
      const fn = generateRandomName(6);
      const v1 = generateRandomName(4);
      return `function ${fn}(${v1}){try{return ${v1}['toString'](0x${(Math.floor(Math.random()*20)+2).toString(16)});}catch(_e){return ${v1};}}`;
    },
    () => {
      const v1 = generateRandomName(5);
      const v2 = generateRandomName(5);
      return `var ${v1}=function(${v2}){return typeof ${v2}==='undefined'?null:${v2};};`;
    },
  ];
  return templates[Math.floor(Math.random() * templates.length)]();
}

function splitStatements(code: string): string[] {
  const statements: string[] = [];
  let current = '';
  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      current += ch;
      escaped = true;
      continue;
    }

    if (inString) {
      current += ch;
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      current += ch;
      inString = ch;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') {
      depth++;
      current += ch;
      continue;
    }

    if (ch === ')' || ch === '}' || ch === ']') {
      depth--;
      current += ch;
      continue;
    }

    if (ch === ';' && depth === 0) {
      if (current.trim()) statements.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

function extractStrings(code: string): { strings: string[]; code: string } {
  const strings: string[] = [];
  let modified = '';
  let i = 0;
  let inString: string | null = null;
  let currentStr = '';
  let escaped = false;
  const arrName = '_0xstrArr';

  while (i < code.length) {
    const ch = code[i];

    if (escaped) {
      if (inString) currentStr += ch;
      else modified += ch;
      escaped = false;
      i++;
      continue;
    }

    if (ch === '\\') {
      if (inString) currentStr += ch;
      else modified += ch;
      escaped = true;
      i++;
      continue;
    }

    if (inString) {
      if (ch === inString) {
        if (currentStr.length > 0) {
          strings.push(currentStr);
          modified += `${arrName}[${strings.length - 1}]`;
        } else {
          modified += inString + inString;
        }
        currentStr = '';
        inString = null;
      } else {
        currentStr += ch;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inString = ch;
        currentStr = '';
      } else {
        modified += ch;
      }
    }
    i++;
  }

  if (inString) {
    modified += inString + currentStr;
  }

  return { strings, code: modified };
}

function encryptStringArray(strings: string[], keys: number[]): string {
  const arrName = '_0xstrArr';
  const decFn = '_0xstrDec';
  const keyArr = `[${keys.join(',')}]`;

  const encrypted = strings.map(s => {
    const enc = xorEncrypt(s, keys);
    return customB64Encode(enc);
  });

  const decoder = `var ${decFn}=function(_s,_k){` +
    `var _r='',_b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_d='';` +
    `for(var _i=0;_i<_s.length;_i++){var _x=_b.indexOf(_s[_i]);_d+=_x>=0?_s2[_x]:_s[_i];}` +
    `_d=decodeURIComponent(escape(atob(_d)));` +
    `for(var _j=0;_j<_d.length;_j++){_r+=String.fromCharCode(_d.charCodeAt(_j)^_k[_j%_k.length]);}` +
    `return _r;};`;

  const arrDecl = `var ${arrName}=[${encrypted.map(e => `${decFn}('${e}',${keyArr})`).join(',')}];`;

  return decoder + arrDecl;
}

function flattenControlFlow(code: string): string {
  const statements = splitStatements(code);
  if (statements.length < 3) return code;

  const stateVar = generateRandomName(6);
  const whileVar = generateRandomName(4);

  const order = Array.from({ length: statements.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const reverseMap = new Array(order.length);
  for (let i = 0; i < order.length; i++) {
    reverseMap[order[i]] = i;
  }

  const cases = order.map((originalIdx, shuffledIdx) => {
    const nextState = shuffledIdx < order.length - 1
      ? `${stateVar}=${reverseMap[originalIdx + 1 < order.length ? originalIdx + 1 : -1] ?? -1}`
      : `${whileVar}=false`;
    return `case ${shuffledIdx}:${statements[originalIdx]};${nextState};break`;
  }).join(';');

  return `var ${stateVar}=${reverseMap[0]},${whileVar}=true;while(${whileVar}){switch(${stateVar}){${cases};}}`;
}

function mangleIdentifiers(code: string): string {
  const reserved = new Set([
    'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'delete', 'typeof',
    'instanceof', 'void', 'this', 'throw', 'try', 'catch', 'finally', 'class',
    'extends', 'super', 'import', 'export', 'default', 'from', 'as', 'true',
    'false', 'null', 'undefined', 'in', 'of', 'with', 'debugger', 'yield',
    'await', 'async', 'static', 'get', 'set', 'arguments', 'eval',
    'console', 'window', 'document', 'Math', 'Date', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'RegExp', 'Error', 'JSON', 'Promise',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
    'decodeURIComponent', 'encodeURI', 'decodeURI', 'atob', 'btoa',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'prototype', 'constructor', 'toString', 'valueOf', 'hasOwnProperty',
    'length', 'push', 'pop', 'shift', 'unshift', 'splice', 'slice',
    'map', 'filter', 'reduce', 'forEach', 'indexOf', 'includes',
    'join', 'split', 'replace', 'match', 'test', 'exec', 'keys',
    'values', 'entries', 'assign', 'freeze', 'create',
    '_0xstrArr', '_0xstrDec', 'escape', 'unescape',
    'charCodeAt', 'fromCharCode', 'charAt', 'apply', 'call', 'bind',
    'fetch', 'Response', 'Request', 'Headers',
  ]);

  let result = '';
  let i = 0;
  let inString: string | null = null;
  let escaped = false;
  const identMap = new Map<string, string>();

  const declareRegex = /(?:var|let|const|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const paramRegex = /function\s*[a-zA-Z_$]*\s*\(([^)]*)\)/g;
  const declaredIdents = new Set<string>();

  let m;
  while ((m = declareRegex.exec(code)) !== null) {
    if (!reserved.has(m[1]) && m[1].length > 1 && !m[1].startsWith('_0x') && !m[1].startsWith('_$') && !m[1].startsWith('$_')) {
      declaredIdents.add(m[1]);
    }
  }
  while ((m = paramRegex.exec(code)) !== null) {
    const params = m[1].split(',').map(p => p.trim()).filter(Boolean);
    for (const p of params) {
      const name = p.replace(/\s*=.*$/, '').trim();
      if (name && !reserved.has(name) && name.length > 1 && !name.startsWith('_0x')) {
        declaredIdents.add(name);
      }
    }
  }

  for (const ident of declaredIdents) {
    identMap.set(ident, generateRandomName(8));
  }

  while (i < code.length) {
    const ch = code[i];

    if (escaped) {
      result += ch;
      escaped = false;
      i++;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escaped = true;
      i++;
      continue;
    }

    if (inString) {
      result += ch;
      if (ch === inString) inString = null;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      result += ch;
      inString = ch;
      i++;
      continue;
    }

    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        ident += code[i];
        i++;
      }
      if (identMap.has(ident)) {
        result += identMap.get(ident)!;
      } else {
        result += ident;
      }
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

function addSelfDefense(code: string): string {
  const checkFn = generateRandomName(8);
  const timerFn = generateRandomName(8);

  const selfDefense = `(function(){` +
    `var ${checkFn}=function(){` +
    `try{(function(){return false;})['constructor']('debugger')['apply']('stateObject');}` +
    `catch(_e){}};` +
    `var ${timerFn}=setInterval(function(){${checkFn}();},0x${(Math.floor(Math.random()*3000)+1000).toString(16)});` +
    `})();`;

  return selfDefense + code;
}

function addDebugProtection(code: string): string {
  const trap = `(function(){` +
    `var _c=function(){try{(function _d(){return ('' + _d / _d)['length']!==1 || _d % 20 === 0` +
    `?(function(){return true;})['constructor']('debugger')['call']('action'):` +
    `(function(){return false;})['constructor']('debugger')['apply']('stateObject');` +
    `_d();})();}catch(_e){}};_c();` +
    `})();`;
  return trap + code;
}

function addDomainLock(code: string, domain: string): string {
  if (!domain) return code;
  const encoded = customB64Encode(domain);
  const decVar = generateRandomName(6);
  return `(function(){` +
    `var _b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_e='${encoded}',_d='';` +
    `for(var _i=0;_i<_e.length;_i++){var _x=_b.indexOf(_e[_i]);_d+=_x>=0?_s2[_x]:_e[_i];}` +
    `_d=decodeURIComponent(escape(atob(_d)));` +
    `var _h=typeof window!=='undefined'?window['location']['hostname']:'';` +
    `if(_h&&_h.indexOf(_d)===-1){while(true){}}` +
    `})();` + code;
}

function compressWhitespace(code: string): string {
  let result = '';
  let inString: string | null = null;
  let escaped = false;
  let lastWasSpace = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (inString) {
      result += ch;
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      result += ch;
      inString = ch;
      lastWasSpace = false;
      continue;
    }

    if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && i + 1 < code.length && code[i + 1] === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i++;
      continue;
    }

    if (/\s/.test(ch)) {
      if (!lastWasSpace && result.length > 0) {
        const lastChar = result[result.length - 1];
        if (/[a-zA-Z0-9_$]/.test(lastChar)) {
          result += ' ';
          lastWasSpace = true;
        }
      }
      continue;
    }

    lastWasSpace = false;
    result += ch;
  }

  return result.trim();
}

function wrapInEval(code: string): string {
  const encoded = customB64Encode(code);
  const decFn = generateRandomName(8);
  return `(function(){` +
    `var ${decFn}=function(_s){var _b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_d='';` +
    `for(var _i=0;_i<_s.length;_i++){var _x=_b.indexOf(_s[_i]);_d+=_x>=0?_s2[_x]:_s[_i];}` +
    `return decodeURIComponent(escape(atob(_d)));};` +
    `eval(${decFn}('${encoded}'));` +
    `})();`;
}

function obfuscateJavaScript(code: string, options: ObfuscationOptions): string {
  let result = code;

  for (let round = 0; round < options.encryptionRounds; round++) {
    const keys = Array.from({ length: 6 }, () => Math.floor(Math.random() * 255) + 1);

    if (options.stringEncryption && round === 0) {
      const extracted = extractStrings(result);
      if (extracted.strings.length > 0) {
        const strDeclaration = encryptStringArray(extracted.strings, keys);
        result = strDeclaration + extracted.code;
      }
    }

    if (options.deadCodeInjection) {
      const deadCodes = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, generateDeadCode);
      const insertPos = Math.floor(result.length / 2);
      result = result.slice(0, insertPos) + deadCodes.join('') + result.slice(insertPos);
    }

    if (options.identifierMangling && round < 2) {
      result = mangleIdentifiers(result);
    }

    if (options.controlFlowFlattening && round === 0) {
      const statements = splitStatements(result);
      if (statements.length > 4) {
        const mid = Math.floor(statements.length / 2);
        const chunk1 = statements.slice(0, mid).join(';') + ';';
        const chunk2Stmts = statements.slice(mid);
        result = chunk1 + flattenControlFlow(chunk2Stmts.join(';'));
      }
    }

    if (options.compressCode) {
      result = compressWhitespace(result);
    }

    if (round < options.encryptionRounds - 1) {
      result = wrapInEval(result);
    }
  }

  if (options.domainLock) {
    result = addDomainLock(result, options.domainLock);
  }

  if (options.debugProtection) {
    result = addDebugProtection(result);
  }

  if (options.selfDefending) {
    result = addSelfDefense(result);
  }

  result = wrapInEval(result);

  return result;
}

function obfuscateCSS(code: string, options: ObfuscationOptions): string {
  let result = code;

  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  if (options.identifierMangling) {
    const classMap = new Map<string, string>();
    const idMap = new Map<string, string>();

    const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    let match;
    while ((match = classRegex.exec(code)) !== null) {
      const cls = match[1];
      if (!classMap.has(cls)) {
        classMap.set(cls, `_${generateRandomName(6).replace(/[^a-zA-Z0-9_-]/g, '')}`);
      }
    }

    const idRegex = /#([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    while ((match = idRegex.exec(code)) !== null) {
      const id = match[1];
      if (!idMap.has(id)) {
        idMap.set(id, `_${generateRandomName(6).replace(/[^a-zA-Z0-9_-]/g, '')}`);
      }
    }

    for (const [original, mangled] of classMap) {
      const escaped = original.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
      result = result.replace(new RegExp(`\\.${escaped}(?=[\\s{:,>+~\\[])`, 'g'), `.${mangled}`);
    }
    for (const [original, mangled] of idMap) {
      const escaped = original.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
      result = result.replace(new RegExp(`#${escaped}(?=[\\s{:,>+~\\[])`, 'g'), `#${mangled}`);
    }
  }

  if (options.deadCodeInjection) {
    const fakeRules = Array.from({ length: 3 }, () => {
      const sel = `.${generateRandomName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`;
      const props = [
        `visibility:hidden`,
        `position:absolute`,
        `left:-9999px`,
        `opacity:0`,
        `pointer-events:none`,
      ];
      return `${sel}{${props.join(';')}}`;
    });
    result = fakeRules.join('') + result;
  }

  if (options.stringEncryption) {
    const hexColors = result.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    for (const hex of hexColors) {
      if (hex.length === 7) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        result = result.replace(hex, `rgb(${r},${g},${b})`);
      }
    }
  }

  if (options.compressCode) {
    result = result
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();
  }

  return result;
}

function obfuscateHTML(code: string, options: ObfuscationOptions): string {
  let result = code;

  result = result.replace(/<!--[\s\S]*?-->/g, '');

  if (options.identifierMangling) {
    const idRegex = /id=["']([^"']+)["']/g;
    const classRegex = /class=["']([^"']+)["']/g;
    const idMap = new Map<string, string>();
    const clsMap = new Map<string, string>();
    let match;

    while ((match = idRegex.exec(code)) !== null) {
      if (!idMap.has(match[1])) idMap.set(match[1], `_${generateRandomName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    }
    while ((match = classRegex.exec(code)) !== null) {
      const classes = match[1].split(/\s+/);
      for (const cls of classes) {
        if (!clsMap.has(cls)) clsMap.set(cls, `_${generateRandomName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`);
      }
    }

    for (const [orig, mangled] of idMap) {
      const escaped = orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
      result = result.replace(new RegExp(`(id=["'])${escaped}(["'])`, 'g'), `$1${mangled}$2`);
    }
    for (const [orig, mangled] of clsMap) {
      const escaped = orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
      result = result.replace(new RegExp(`\\b${escaped}\\b`, 'g'), mangled);
    }
  }

  if (options.deadCodeInjection) {
    const fakeElements = [
      `<div style="display:none" data-${generateRandomName(4).replace(/[^a-z]/g, '')}="${Math.random().toString(36).slice(2)}"></div>`,
      `<span style="visibility:hidden;position:absolute" aria-hidden="true">${generateRandomName(3)}</span>`,
      `<!-- ${customB64Encode(generateRandomName(10))} -->`,
    ];
    const bodyClose = result.lastIndexOf('</body>');
    if (bodyClose > -1) {
      result = result.slice(0, bodyClose) + fakeElements.join('') + result.slice(bodyClose);
    } else {
      result += fakeElements.join('');
    }
  }

  if (options.stringEncryption) {
    const textRegex = />([^<]{3,})</g;
    let m;
    const replacements: [string, string][] = [];
    while ((m = textRegex.exec(result)) !== null) {
      const text = m[1].trim();
      if (text.length > 2) {
        const encoded = text.split('').map(c => `&#${c.charCodeAt(0)};`).join('');
        replacements.push([`>${m[1]}<`, `>${encoded}<`]);
      }
    }
    for (const [from, to] of replacements) {
      result = result.replace(from, to);
    }
  }

  if (options.compressCode) {
    result = result
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  return result;
}

function obfuscateBatch(code: string, options: ObfuscationOptions): string {
  let result = code;

  result = result.replace(/^REM .*/gmi, '');
  result = result.replace(/^:: .*/gm, '');

  if (options.identifierMangling) {
    const setRegex = /set\s+(?:\/\w\s+)?"?([a-zA-Z_]\w*)=/gi;
    const varMap = new Map<string, string>();
    let match;

    const reserved = new Set(['errorlevel', 'cd', 'date', 'time', 'random', 'path', 'pathext', 'comspec', 'os', 'userprofile', 'temp', 'tmp', 'homedrive', 'homepath', 'username', 'appdata', 'programfiles', 'systemroot', 'windir', 'counter']);

    while ((match = setRegex.exec(code)) !== null) {
      const v = match[1].toLowerCase();
      if (!reserved.has(v) && !varMap.has(match[1])) {
        varMap.set(match[1], `_W${generateRandomName(4).replace(/[^a-zA-Z0-9_]/g, '')}`);
      }
    }

    for (const [orig, mangled] of varMap) {
      const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`%${escaped}%`, 'gi'), `%${mangled}%`);
      result = result.replace(new RegExp(`(set\\s+(?:\\/\\w\\s+)?"?)${escaped}(=)`, 'gi'), `$1${mangled}$2`);
    }
  }

  if (options.deadCodeInjection) {
    const deadLabels = Array.from({ length: 3 }, () => {
      const label = `_W${generateRandomName(4).replace(/[^a-zA-Z0-9_]/g, '')}`;
      return `:${label}\r\nif 1==0 (\r\necho %random%%random%\r\ngoto :eof\r\n)`;
    });
    result = deadLabels.join('\r\n') + '\r\n' + result;
  }

  if (options.stringEncryption) {
    const lines = result.split(/\r?\n/);
    const obfLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('@') || trimmed.startsWith(':') || trimmed === '' || trimmed.startsWith('if ') || trimmed.startsWith('goto') || trimmed.startsWith('set ')) {
        return line;
      }
      if (trimmed.startsWith('echo ')) {
        const msg = trimmed.slice(5);
        const encoded = msg.split('').map(c => {
          const code = c.charCodeAt(0);
          return `!_c${code}!`;
        }).join('');
        return `echo ${encoded}`;
      }
      return line;
    });

    const charSetup: string[] = [];
    const usedCodes = new Set<number>();
    for (const line of obfLines) {
      const matches = line.match(/!_c(\d+)!/g);
      if (matches) {
        for (const m of matches) {
          const code = parseInt(m.slice(3, -1));
          usedCodes.add(code);
        }
      }
    }
    for (const code of usedCodes) {
      charSetup.push(`set "_c${code}=${String.fromCharCode(code)}"`);
    }

    if (charSetup.length > 0) {
      result = '@echo off\r\nsetlocal enabledelayedexpansion\r\n' + charSetup.join('\r\n') + '\r\n' + obfLines.join('\r\n');
    } else {
      result = obfLines.join('\r\n');
    }
  }

  if (options.compressCode) {
    result = result.replace(/\r?\n\s*\r?\n/g, '\r\n');
  }

  return result;
}

export function obfuscate(code: string, options: Partial<ObfuscationOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!code.trim()) return '';

  switch (opts.language) {
    case 'javascript':
      return obfuscateJavaScript(code, opts);
    case 'css':
      return obfuscateCSS(code, opts);
    case 'html':
      return obfuscateHTML(code, opts);
    case 'batch':
      return obfuscateBatch(code, opts);
    default:
      return obfuscateJavaScript(code, opts);
  }
}

export type { ObfuscationOptions, Language };
export { DEFAULT_OPTIONS };
