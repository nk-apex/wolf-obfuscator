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

function extractStrings(code: string): { strings: string[]; code: string } {
  const strings: string[] = [];
  let modified = code;
  const regex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const str = match[0];
    const inner = str.slice(1, -1);
    if (inner.length > 0) {
      strings.push(inner);
      const arrName = '_0xstrArr';
      modified = modified.replace(str, `${arrName}[${strings.length - 1}]`);
    }
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
  const lines = code.split(';').filter(l => l.trim().length > 0);
  if (lines.length < 3) return code;

  const stateVar = generateRandomName(6);
  const whileVar = generateRandomName(4);
  
  const order = Array.from({ length: lines.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const cases = order.map((originalIdx, caseIdx) => {
    const nextState = caseIdx < order.length - 1 ? `${stateVar}=${caseIdx + 1}` : `${whileVar}=false`;
    return `case ${caseIdx}:${lines[originalIdx]};${nextState};break`;
  }).join(';');

  return `var ${stateVar}=0,${whileVar}=true;while(${whileVar}){switch(${stateVar}){${cases};}}`;
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
    'charCodeAt', 'fromCharCode', 'charAt',
  ]);

  const identRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
  const identMap = new Map<string, string>();

  let result = code;
  let match;
  const allIdents = new Set<string>();

  while ((match = identRegex.exec(code)) !== null) {
    const ident = match[1];
    if (!reserved.has(ident) && ident.length > 1 && !ident.startsWith('_0x') && !ident.startsWith('_$') && !ident.startsWith('$_') && !ident.startsWith('_W') && !ident.startsWith('_O') && !ident.startsWith('_L') && !ident.startsWith('_F')) {
      allIdents.add(ident);
    }
  }

  for (const ident of allIdents) {
    if (!identMap.has(ident)) {
      identMap.set(ident, generateRandomName(8));
    }
  }

  for (const [original, mangled] of identMap) {
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escapedOriginal}\\b`, 'g'), mangled);
  }

  return result;
}

function addSelfDefense(code: string): string {
  const checkFn = generateRandomName(8);
  const timerFn = generateRandomName(8);

  const selfDefense = `(function(){` +
    `var ${checkFn}=function(){` +
    `var _test=function(){return 'dev';}['constructor']('return /" + this + "/')()['compile']('^([^ ]+( +[^ ]+)+)+[^ ]}');` +
    `try{var _result=_test['test'](${checkFn}['toString']());` +
    `if(!_result){(function(){return false;})['constructor']('debugger')['apply']('stateObject');}` +
    `else{(function(){return false;})['constructor']('debugger')['apply']('stateObject');}` +
    `}catch(_e){}};` +
    `var ${timerFn}=setInterval(function(){${checkFn}();},0x${(Math.floor(Math.random()*3000)+1000).toString(16)});` +
    `})();`;

  return selfDefense + code;
}

function addDebugProtection(code: string): string {
  const trap = `(function(){` +
    `var _c=new RegExp('function *\\\\( *\\\\)');` +
    `var _t=new RegExp('\\\\+\\\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)','i');` +
    `var _f=function(_a){if(!_c['test'](_a+'chain')||!_t['test'](_a+'input')){_a('0');}else{(function(){return false;})['constructor']('debugger')['call']('action');}` +
    `_f(++_a);};` +
    `try{_f(0);}catch(_e){}` +
    `})();`;
  return trap + code;
}

function addDomainLock(code: string, domain: string): string {
  if (!domain) return code;
  const encoded = customB64Encode(domain);
  const decVar = generateRandomName(6);
  return `(function(){` +
    `var ${decVar}='${encoded}';` +
    `var _h=typeof window!=='undefined'?window['location']['hostname']:'';` +
    `if(_h&&_h.indexOf(${decVar})===-1){return;}` +
    `})();` + code;
}

function compressWhitespace(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1')
    .trim();
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
      const sections = result.split(/(?<=;)/).filter(s => s.trim());
      if (sections.length > 4) {
        const mid = Math.floor(sections.length / 2);
        const chunk1 = sections.slice(0, mid).join('');
        const chunk2 = sections.slice(mid).join('');
        result = chunk1 + flattenControlFlow(chunk2);
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

  const classMap = new Map<string, string>();
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match;
  while ((match = classRegex.exec(code)) !== null) {
    const cls = match[1];
    if (!classMap.has(cls)) {
      classMap.set(cls, `_${generateRandomName(6).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    }
  }

  for (const [original, mangled] of classMap) {
    const escaped = original.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
    result = result.replace(new RegExp(`\\.${escaped}\\b`, 'g'), `.${mangled}`);
  }

  if (options.compressCode) {
    result = result
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();
  }

  if (options.stringEncryption) {
    const encoded = customB64Encode(result);
    result = `/* W0LF-${generateRandomName(4)} */` +
      `(function(){var _s='${encoded}',_b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_d='';` +
      `for(var _i=0;_i<_s.length;_i++){var _x=_b.indexOf(_s[_i]);_d+=_x>=0?_s2[_x]:_s[_i];}` +
      `_d=decodeURIComponent(escape(atob(_d)));` +
      `var _el=document.createElement('style');_el.textContent=_d;document.head.appendChild(_el);` +
      `})();`;
  }

  return result;
}

function obfuscateHTML(code: string, options: ObfuscationOptions): string {
  let result = code;

  if (options.identifierMangling) {
    const idRegex = /id=["']([^"']+)["']/g;
    const classRegex = /class=["']([^"']+)["']/g;
    const idMap = new Map<string, string>();
    const clsMap = new Map<string, string>();
    let match;

    while ((match = idRegex.exec(code)) !== null) {
      if (!idMap.has(match[1])) idMap.set(match[1], `_${generateRandomName(5)}`);
    }
    while ((match = classRegex.exec(code)) !== null) {
      const classes = match[1].split(/\s+/);
      for (const cls of classes) {
        if (!clsMap.has(cls)) clsMap.set(cls, `_${generateRandomName(5)}`);
      }
    }

    for (const [orig, mangled] of idMap) {
      result = result.replace(new RegExp(`id=["']${orig}["']`, 'g'), `id="${mangled}"`);
    }
    for (const [orig, mangled] of clsMap) {
      result = result.replace(new RegExp(`\\b${orig}\\b`, 'g'), mangled);
    }
  }

  if (options.compressCode) {
    result = result
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  if (options.stringEncryption) {
    const encoded = customB64Encode(result);
    result = `<script>(function(){var _s='${encoded}',_b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_d='';` +
      `for(var _i=0;_i<_s.length;_i++){var _x=_b.indexOf(_s[_i]);_d+=_x>=0?_s2[_x]:_s[_i];}` +
      `_d=decodeURIComponent(escape(atob(_d)));document.write(_d);` +
      `})();</script>`;
  }

  return result;
}

function obfuscateBatch(code: string, options: ObfuscationOptions): string {
  let result = code;

  result = result.replace(/^REM .*/gmi, '');
  result = result.replace(/^:: .*/gm, '');

  if (options.identifierMangling) {
    const varRegex = /%%?([a-zA-Z_][a-zA-Z0-9_]*)%%?/g;
    const setRegex = /set\s+\/?\w?\s*"?([a-zA-Z_]\w*)=/gi;
    const varMap = new Map<string, string>();
    let match;

    const reserved = new Set(['errorlevel', 'cd', 'date', 'time', 'random', 'path', 'pathext', 'comspec', 'os', 'userprofile', 'temp', 'tmp', 'homedrive', 'homepath', 'username', 'appdata', 'programfiles', 'systemroot', 'windir']);

    while ((match = varRegex.exec(code)) !== null) {
      const v = match[1].toLowerCase();
      if (!reserved.has(v) && !varMap.has(match[1])) {
        varMap.set(match[1], `_W${generateRandomName(4)}`);
      }
    }
    while ((match = setRegex.exec(code)) !== null) {
      const v = match[1].toLowerCase();
      if (!reserved.has(v) && !varMap.has(match[1])) {
        varMap.set(match[1], `_W${generateRandomName(4)}`);
      }
    }

    for (const [orig, mangled] of varMap) {
      result = result.replace(new RegExp(`%${orig}%`, 'g'), `%${mangled}%`);
      result = result.replace(new RegExp(`%%${orig}%%`, 'g'), `%%${mangled}%%`);
      const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`(set\\s+(?:\\/\\w\\s+)?"?)${escaped}(=)`, 'gi'), `$1${mangled}$2`);
    }
  }

  if (options.deadCodeInjection) {
    const deadLabels = Array.from({ length: 3 }, () => {
      const label = `:_W${generateRandomName(4)}`;
      return `${label}\r\nif 1==0 (\r\necho %random%\r\ngoto :eof\r\n)`;
    });
    result = deadLabels.join('\r\n') + '\r\n' + result;
  }

  if (options.stringEncryption) {
    const lines = result.split(/\r?\n/);
    const encodedLines = lines.map(line => {
      if (line.trim().startsWith('@') || line.trim().startsWith(':') || line.trim() === '') return line;
      const chars = line.split('').map(c => `%=exitcodeAscii%` === '' ? c : c);
      return line;
    });
    result = '@echo off\r\n' + encodedLines.join('\r\n');

    const encoded = customB64Encode(result);
    const ps = `powershell -NoProfile -ExecutionPolicy Bypass -Command "` +
      `$b='${CUSTOM_ALPHABET}';$s='${STANDARD_B64}';$e='${encoded}';$d='';` +
      `for($i=0;$i -lt $e.Length;$i++){$x=$b.IndexOf($e[$i]);if($x -ge 0){$d+=$s[$x]}else{$d+=$e[$i]}};` +
      `$r=[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($d));` +
      `$t=[System.IO.Path]::GetTempFileName()+'.bat';` +
      `[System.IO.File]::WriteAllText($t,$r);& $t;Remove-Item $t -Force"`;
    result = `@echo off\r\n${ps}`;
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
