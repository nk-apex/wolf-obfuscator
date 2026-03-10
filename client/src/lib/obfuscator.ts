// ============================================================
// WOLF-OBFUSCATOR — core obfuscation engine
// Inspired by obfuscator.io & js-confuser.com techniques
// ============================================================

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
  hexNumbers: boolean;
  opaquePredicates: boolean;
  unicodeEncoding: boolean;
  bracketNotation: boolean;
  stringSplitting: boolean;
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
  hexNumbers: true,
  opaquePredicates: true,
  unicodeEncoding: false,
  bracketNotation: true,
  stringSplitting: true,
};

const CUSTOM_ALPHABET = 'WOLFABCDEGHIJKMNPQRSTUVXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const STANDARD_B64   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const GEN_PREFIXES   = ['_0x', '_$', '__', '$_'];

// ============================================================
// String-navigation helpers (used by every transform)
// ============================================================

function skipQuotedString(code: string, start: number): number {
  const q = code[start];
  let i = start + 1;
  while (i < code.length) {
    if (code[i] === '\\') { i += 2; continue; }
    if (code[i] === q) return i + 1;
    i++;
  }
  return i;
}

function skipTemplateLit(code: string, start: number): number {
  let i = start + 1;
  while (i < code.length) {
    const c = code[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '`') return i + 1;
    if (c === '$' && i + 1 < code.length && code[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < code.length && depth > 0) {
        const cc = code[i];
        if (cc === '\\') { i += 2; continue; }
        if (cc === '`') { i = skipTemplateLit(code, i); continue; }
        if (cc === '"' || cc === "'") { i = skipQuotedString(code, i); continue; }
        if (cc === '{') depth++;
        else if (cc === '}') { depth--; if (depth === 0) break; }
        i++;
      }
      i++;
      continue;
    }
    i++;
  }
  return i;
}

function isStr(ch: string) { return ch === '"' || ch === "'" || ch === '`'; }

function skipAnyString(code: string, i: number): number {
  if (code[i] === '`') return skipTemplateLit(code, i);
  return skipQuotedString(code, i);
}

// ============================================================
// Name generators
// ============================================================

function isGeneratedName(n: string): boolean {
  return GEN_PREFIXES.some(p => n.startsWith(p));
}

function hexName(len = 5): string {
  const chars = 'abcdef0123456789';
  let s = '_0x';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randName(len = 8): string {
  const pfx = GEN_PREFIXES[Math.floor(Math.random() * GEN_PREFIXES.length)];
  const chars = 'abcdef0123456789';
  let s = pfx;
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randKey(len = 16): string {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let k = '';
  for (let i = 0; i < len; i++) k += c[Math.floor(Math.random() * c.length)];
  return k;
}

// ============================================================
// Crypto — RC4 + custom base64 (inspired by obfuscator.io)
// ============================================================

function customB64Encode(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  let r = '';
  for (let i = 0; i < b64.length; i++) {
    const idx = STANDARD_B64.indexOf(b64[i]);
    r += idx >= 0 ? CUSTOM_ALPHABET[idx] : b64[i];
  }
  return r;
}

function rc4(key: string, data: string): string {
  const S: number[] = [];
  for (let i = 0; i < 256; i++) S[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key.charCodeAt(i % key.length)) & 0xff;
    [S[i], S[j]] = [S[j], S[i]];
  }
  let i2 = 0, j2 = 0;
  let out = '';
  for (let y = 0; y < data.length; y++) {
    i2 = (i2 + 1) & 0xff;
    j2 = (j2 + S[i2]) & 0xff;
    [S[i2], S[j2]] = [S[j2], S[i2]];
    out += String.fromCharCode(data.charCodeAt(y) ^ S[(S[i2] + S[j2]) & 0xff]);
  }
  return out;
}

// ============================================================
// Dead code injection
// ============================================================

function deadCode(): string {
  const fn = randName(6), v1 = hexName(4), v2 = hexName(4);
  const n1 = Math.floor(Math.random() * 0xfe) + 1;
  const n2 = Math.floor(Math.random() * 0xfe) + 1;
  const pick = Math.floor(Math.random() * 7);
  switch (pick) {
    case 0: return `function ${fn}(${v1}){var ${v2}=${v1}*(0x${n1.toString(16)});if(${v2}>(0x${n2.toString(16)})){return ${v2}+(0x${n1.toString(16)});}return ${v1};}`;
    case 1: return `var ${v1}=[(0x${n1.toString(16)}),(0x${n2.toString(16)}),(0x${(n1^n2).toString(16)}),(0x${(n1+n2&0xffff).toString(16)})];`;
    case 2: return `function ${fn}(${v1}){try{return ${v1}['toString']((0x10));}catch(${v2}){return ${v1};}}`;
    case 3: return `var ${v1}=function(${v2}){return typeof ${v2}==='undefined'?null:${v2};};`;
    case 4: {
      const a = Math.floor(Math.random() * 50) + 2, b = Math.floor(Math.random() * 50) + 2;
      return `function ${fn}(${v1}){if(((0x${a.toString(16)})*(0x${b.toString(16)}))===(0x${(a*b+1).toString(16)})){return ${v1}+(0x${n1.toString(16)});}return ${v1};}`;
    }
    case 5: return `var ${v1}=[];if(${v1}['length']===(0x0)){}`;
    case 6: return `var ${v1}=(0x${n1.toString(16)});while((0x0)>(0x1)){${v1}++;}`;
    default: return `var ${v1}=(0x${n1.toString(16)});`;
  }
}

// ============================================================
// Opaque predicates
// ============================================================

function opaquePredicate(): string {
  const v = randName(5);
  const n = Math.floor(Math.random() * 100) + 1;
  const pick = Math.floor(Math.random() * 4);
  switch (pick) {
    case 0: return `if(typeof ${v}==='undefined'||(0x${(n*n).toString(16)})===(0x${(n*n).toString(16)})){}`;
    case 1: { const a = Math.floor(Math.random()*50)+2, b = Math.floor(Math.random()*50)+2; return `if((0x${(a*b).toString(16)})===(0x${(a*b).toString(16)})){}`; }
    case 2: return `var ${v}=[];if(${v}['length']===(0x0)){}`;
    case 3: return `var ${v}=(0x${n.toString(16)});while((0x0)>(0x1)){${v}++;}`;
    default: return `if((0x1)===(0x1)){}`;
  }
}

// ============================================================
// Comment stripping
// ============================================================

function stripComments(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (isStr(ch)) { const e = skipAnyString(code, i); out += code.slice(i, e); i = e; continue; }
    if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && i + 1 < code.length && code[i + 1] === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// ============================================================
// Number obfuscation — hex with mandatory parentheses
// (parens prevent 0xff.method() syntax errors)
// ============================================================

function obfuscateNumbers(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (isStr(ch)) { const e = skipAnyString(code, i); out += code.slice(i, e); i = e; continue; }

    if (/\d/.test(ch)) {
      const prev = out.length > 0 ? out[out.length - 1] : '';
      if (/[a-zA-Z0-9_$.]/.test(prev)) { out += ch; i++; continue; }

      let num = '';
      while (i < code.length && /\d/.test(code[i])) { num += code[i]; i++; }

      const next = i < code.length ? code[i] : '';
      if (/[a-zA-Z_$.]/.test(next)) { out += num; continue; }

      let la = i;
      while (la < code.length && /[ \t\r\n]/.test(code[la])) la++;
      if (la < code.length && code[la] === '.') { out += num; continue; }

      const n = parseInt(num, 10);
      if (isNaN(n) || n > 0xffff || num.length > 5) { out += num; continue; }

      out += `(0x${n.toString(16)})`;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// ============================================================
// String splitting (only long strings, skip obj keys)
// ============================================================

function splitStrings(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '`') { const e = skipTemplateLit(code, i); out += code.slice(i, e); i = e; continue; }
    if (ch === '"' || ch === "'") {
      const q = ch;
      let inner = '';
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') { inner += code[j] + (code[j + 1] || ''); j += 2; continue; }
        if (code[j] === q) { j++; break; }
        inner += code[j]; j++;
      }
      let peek = j;
      while (peek < code.length && (code[peek] === ' ' || code[peek] === '\t')) peek++;
      const isObjKey = peek < code.length && code[peek] === ':' && code[peek + 1] !== ':';
      if (!isObjKey && inner.length >= 8 && !inner.includes('\\n') && !inner.includes('\n')) {
        const mid = Math.max(2, Math.min(inner.length - 2, Math.floor(inner.length / 2)));
        out += `(${q}${inner.slice(0, mid)}${q}+${q}${inner.slice(mid)}${q})`;
      } else {
        out += q + inner + q;
      }
      i = j; continue;
    }
    out += ch; i++;
  }
  return out;
}

// ============================================================
// Bracket notation conversion
// ============================================================

function convertBracketNotation(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (isStr(ch)) { const e = skipAnyString(code, i); out += code.slice(i, e); i = e; continue; }

    if (ch === '.' && i + 1 < code.length && /[a-zA-Z_$]/.test(code[i + 1])) {
      let prop = '';
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) { prop += code[j]; j++; }
      const nxt = j < code.length ? code[j] : '';
      if (nxt !== '(' && prop.length > 2 && Math.random() > 0.4) {
        out += `['${prop}']`;
        i = j; continue;
      }
    }
    out += ch; i++;
  }
  return out;
}

// ============================================================
// Statement splitter (template-literal aware)
// ============================================================

function splitStatements(code: string): string[] {
  const stmts: string[] = [];
  let cur = '';
  let depth = 0;
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (isStr(ch)) { const e = skipAnyString(code, i); cur += code.slice(i, e); i = e; continue; }
    if (ch === '(' || ch === '{' || ch === '[') { depth++; cur += ch; i++; continue; }
    if (ch === ')' || ch === '}' || ch === ']') { depth--; cur += ch; i++; continue; }
    if (ch === ';' && depth === 0) { if (cur.trim()) stmts.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur.trim()) stmts.push(cur.trim());
  return stmts;
}

// ============================================================
// String extraction — leaves template literals untouched
// ============================================================

function escChar(ch: string): string {
  switch (ch) {
    case 'n': return '\n'; case 't': return '\t'; case 'r': return '\r';
    case '0': return '\0'; case 'b': return '\b'; case 'f': return '\f'; case 'v': return '\v';
    default: return ch;
  }
}

const STR_ARR = '_0xstrArr';

function extractStrings(code: string): { strings: string[]; code: string } {
  const strings: string[] = [];
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '`') { const e = skipTemplateLit(code, i); out += code.slice(i, e); i = e; continue; }
    if (ch === '"' || ch === "'") {
      const q = ch;
      let str = '';
      let j = i + 1;
      let esc = false;
      while (j < code.length) {
        const c = code[j];
        if (esc) { str += escChar(c); esc = false; j++; continue; }
        if (c === '\\') { esc = true; j++; continue; }
        if (c === q) { j++; break; }
        str += c; j++;
      }
      let peek = j;
      while (peek < code.length && /[ \t\n\r]/.test(code[peek])) peek++;
      const isColon = peek < code.length && code[peek] === ':' && (peek + 1 >= code.length || code[peek + 1] !== ':');
      let prev = out.length - 1;
      while (prev >= 0 && /[ \t\n\r]/.test(out[prev])) prev--;
      const prevCh = prev >= 0 ? out[prev] : '';
      const isObjKey = isColon && (prevCh === '{' || prevCh === ',');
      if (isObjKey || str.length === 0) {
        out += q + str + q;
      } else {
        strings.push(str);
        out += `${STR_ARR}[(0x${(strings.length - 1).toString(16)})]`;
      }
      i = j; continue;
    }
    out += ch; i++;
  }
  return { strings, code: out };
}

// ============================================================
// RC4 string array encryption + wrapper indirection
// (mirrors obfuscator.io's stringArray + RC4 + wrappers)
// ============================================================

function encryptStringArray(strings: string[], key: string): string {
  const decFn  = hexName(5);
  const rc4Fn  = hexName(5);
  const rotFn  = hexName(5);
  const wrapFn = hexName(5);

  const v = () => hexName(4);
  const vS = v(), vi = v(), vj = v(), vx = v(), vr = v(), vy = v();
  const vk = v(), vd = v(), vb = v(), vs2 = v(), vcx = v();
  const vArr = v(), vRi = v(), wA = v(), wB = v(), wIdx = v();

  const rotOffset = strings.length > 1 ? (Math.floor(Math.random() * (strings.length - 1)) + 1) : 1;

  const encrypted = strings.map(s => {
    const enc = rc4(key, s);
    return customB64Encode(enc);
  });
  const rotated = [...encrypted.slice(rotOffset), ...encrypted.slice(0, rotOffset)];

  const keyStr = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const rc4Decoder =
    `var ${rc4Fn}=function(${vk},${vd}){` +
    `var ${vS}=[],${vi}=(0x0),${vj}=(0x0),${vx};` +
    `for(${vi}=(0x0);${vi}<(0x100);${vi}++)${vS}[${vi}]=${vi};` +
    `for(${vi}=(0x0);${vi}<(0x100);${vi}++){` +
      `${vj}=(${vj}+${vS}[${vi}]+${vk}['charCodeAt'](${vi}%${vk}['length']))%(0x100);` +
      `${vx}=${vS}[${vi}];${vS}[${vi}]=${vS}[${vj}];${vS}[${vj}]=${vx};` +
    `}` +
    `${vi}=(0x0);${vj}=(0x0);var ${vr}='';` +
    `for(var ${vy}=(0x0);${vy}<${vd}['length'];${vy}++){` +
      `${vi}=(${vi}+(0x1))%(0x100);` +
      `${vj}=(${vj}+${vS}[${vi}])%(0x100);` +
      `${vx}=${vS}[${vi}];${vS}[${vi}]=${vS}[${vj}];${vS}[${vj}]=${vx};` +
      `${vr}+=String['fromCharCode'](${vd}['charCodeAt'](${vy})^${vS}[(${vS}[${vi}]+${vS}[${vj}])%(0x100)]);` +
    `}return ${vr};};`;

  const b64Decoder =
    `var ${decFn}=function(${vs2}){` +
    `var ${vb}='${CUSTOM_ALPHABET}',${vcx}='${STANDARD_B64}',${vd}='';` +
    `for(var ${vi}=(0x0);${vi}<${vs2}['length'];${vi}++){` +
      `var ${vx}=${vb}['indexOf'](${vs2}[${vi}]);` +
      `${vd}+=${vx}>=(0x0)?${vcx}[${vx}]:${vs2}[${vi}];` +
    `}` +
    `${vd}=decodeURIComponent(escape(atob(${vd})));` +
    `return ${rc4Fn}('${keyStr}',${vd});};`;

  const rotDecoder = `var ${rotFn}=function(${vArr}){${vArr}['push'](${vArr}['shift']());};`;

  const arrDecl = `var ${STR_ARR}=[${rotated.map(e => `${decFn}('${e}')`).join(',')}];`;

  const unrot = `for(var ${vRi}=(0x0);${vRi}<(0x${rotOffset.toString(16)});${vRi}++){${rotFn}(${STR_ARR});}`;

  const wrapFnDecl =
    `var ${wrapFn}=function(${wA},${wB}){` +
    `${wA}=${wA}-(0x0);` +
    `var ${wIdx}=${STR_ARR}[${wA}];` +
    `return ${wIdx};};`;

  return rc4Decoder + b64Decoder + rotDecoder + arrDecl + unrot + wrapFnDecl;
}

// ============================================================
// Control flow flattening — switch-case dispatcher
// ============================================================

function flattenControlFlow(code: string): string {
  const all = splitStatements(code);
  if (all.length < 3) return code;

  const funcDecls: string[] = [];
  const stmts: string[] = [];
  for (const s of all) {
    if (/^\s*(async\s+)?function\s+[a-zA-Z_$]/.test(s)) funcDecls.push(s);
    else stmts.push(s);
  }
  if (stmts.length < 3) return all.join(';');

  const sv = randName(6);
  const wv = hexName(4);
  const ord = Array.from({ length: stmts.length }, (_, i) => i);
  for (let i = ord.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ord[i], ord[j]] = [ord[j], ord[i]];
  }
  const rev = new Array(ord.length);
  for (let i = 0; i < ord.length; i++) rev[ord[i]] = i;

  const cases = ord.map((orig, shuf) => {
    const next = orig === stmts.length - 1
      ? `${wv}=false`
      : `${sv}=(0x${rev[orig + 1].toString(16)})`;
    return `case (0x${shuf.toString(16)}):${stmts[orig]};${next};break`;
  }).join(';');

  const flat = `var ${sv}=(0x${rev[0].toString(16)}),${wv}=true;while(${wv}){switch(${sv}){${cases};}}`;
  return funcDecls.length > 0 ? funcDecls.join(';') + ';' + flat : flat;
}

// ============================================================
// Identifier mangling
// ============================================================

const RESERVED = new Set([
  'var','let','const','function','return','if','else','for','while','do',
  'switch','case','break','continue','new','delete','typeof','instanceof',
  'void','this','throw','try','catch','finally','class','extends','super',
  'import','export','default','from','as','true','false','null','undefined',
  'in','of','with','debugger','yield','await','async','static','get','set',
  'arguments','eval','NaN','Infinity','globalThis',
  'console','window','document','Math','Date','Array','Object','String',
  'Number','Boolean','RegExp','Error','JSON','Promise','Symbol','Map','Set',
  'WeakMap','WeakSet','Proxy','Reflect','BigInt','Iterator',
  'Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array',
  'Int32Array','Uint32Array','Float32Array','Float64Array','BigInt64Array',
  'BigUint64Array','ArrayBuffer','DataView',
  'parseInt','parseFloat','isNaN','isFinite','encodeURIComponent',
  'decodeURIComponent','encodeURI','decodeURI','atob','btoa','unescape','escape',
  'setTimeout','setInterval','clearTimeout','clearInterval','setImmediate',
  'queueMicrotask','requestAnimationFrame','cancelAnimationFrame',
  'prototype','constructor','toString','valueOf','hasOwnProperty','isPrototypeOf',
  'length','push','pop','shift','unshift','splice','slice','concat','flat',
  'flatMap','map','filter','reduce','reduceRight','forEach','indexOf','lastIndexOf',
  'findIndex','find','findLast','findLastIndex','every','some','includes',
  'join','split','replace','replaceAll','match','matchAll','search',
  'test','exec','trim','trimStart','trimEnd','trimLeft','trimRight',
  'padStart','padEnd','repeat','at','startsWith','endsWith','substring','substr',
  'slice','toUpperCase','toLowerCase','charAt','charCodeAt','codePointAt',
  'normalize','localeCompare',
  'keys','values','entries','assign','freeze','seal','create','defineProperty',
  'defineProperties','getOwnPropertyNames','getOwnPropertyDescriptor',
  'getPrototypeOf','setPrototypeOf','fromEntries','fromCharCode','fromCodePoint',
  'apply','call','bind','name','message','stack',
  'log','warn','error','info','debug','dir','table','trace','group','groupEnd',
  'assert','count','time','timeEnd',
  'require','module','exports','global','process','Buffer',
  '__dirname','__filename','__proto__',
  'fetch','Response','Request','Headers','URL','URLSearchParams','AbortController',
  'addEventListener','removeEventListener','dispatchEvent',
  'querySelector','querySelectorAll','getElementById','getElementsByClassName',
  'getElementsByTagName','createElement','createElementNS','appendChild',
  'removeChild','insertBefore','replaceChild','cloneNode',
  'innerHTML','outerHTML','textContent','innerText','style','className','classList',
  'setAttribute','getAttribute','removeAttribute','hasAttribute','toggleAttribute',
  'parentNode','parentElement','childNodes','children','firstChild','lastChild',
  'nextSibling','previousSibling','nextElementSibling','previousElementSibling',
  'nodeName','nodeType','nodeValue','ownerDocument',
  'body','head','href','src','alt','type','name','value','id','hidden',
  'checked','disabled','selected','target','action','method','rel','media',
  '_0xstrArr','_0xDec','_0xRot','_0xRC4',
]);

function mangleIdentifiers(code: string): string {
  const declRe  = /(?:var|let|const|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const paramRe = /function\s*(?:[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\(([^)]*)\)/g;
  const declared = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = declRe.exec(code)) !== null) {
    const n = m[1];
    if (!RESERVED.has(n) && n.length > 1 && !isGeneratedName(n)) declared.add(n);
  }
  while ((m = paramRe.exec(code)) !== null) {
    for (const p of m[1].split(',')) {
      const pn = p.replace(/\s*=.*$/, '').replace(/\.\.\./g, '').trim();
      if (pn && !RESERVED.has(pn) && pn.length > 1 && !isGeneratedName(pn)) declared.add(pn);
    }
  }

  const props = new Set<string>();
  const dotRe = /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((m = dotRe.exec(code)) !== null) props.add(m[1]);
  const keyRe = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  while ((m = keyRe.exec(code)) !== null) {
    if (!['case', 'default', 'function'].includes(m[1])) props.add(m[1]);
  }
  for (const p of props) declared.delete(p);

  const map = new Map<string, string>();
  for (const id of declared) map.set(id, hexName(5 + Math.floor(Math.random() * 4)));

  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (isStr(ch)) { const e = skipAnyString(code, i); out += code.slice(i, e); i = e; continue; }
    if (/[a-zA-Z_$]/.test(ch)) {
      const start = out.length;
      let id = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) { id += code[i]; i++; }
      const prev = start > 0 ? out[start - 1] : '';
      out += (map.has(id) && prev !== '.') ? map.get(id)! : id;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// ============================================================
// Whitespace compression (template-literal safe)
// ============================================================

function compressWhitespace(code: string): string {
  let out = '';
  let i = 0;
  let lastAlnum = false;
  while (i < code.length) {
    const ch = code[i];
    if (isStr(ch)) { const e = skipAnyString(code, i); out += code.slice(i, e); lastAlnum = false; i = e; continue; }
    if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (ch === '/' && i + 1 < code.length && code[i + 1] === '*') { i += 2; while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue; }
    if (/\s/.test(ch)) {
      if (lastAlnum) { out += ' '; lastAlnum = false; }
      i++; continue;
    }
    lastAlnum = /[a-zA-Z0-9_$]/.test(ch);
    out += ch; i++;
  }
  return out.trim();
}

// ============================================================
// Eval-wrap with custom base64
// ============================================================

function wrapInEval(code: string): string {
  const enc = customB64Encode(code);
  const fn = randName(8);
  return `(function(){var ${fn}=function(_s){var _b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_d='';for(var _i=(0x0);_i<_s['length'];_i++){var _x=_b['indexOf'](_s[_i]);_d+=_x>=(0x0)?_s2[_x]:_s[_i];}return decodeURIComponent(escape(atob(_d)));};eval(${fn}('${enc}'));})();`;
}

// ============================================================
// Protection layers
// ============================================================

function addSelfDefense(code: string): string {
  const cf = randName(8), tf = randName(8);
  const ms = Math.floor(Math.random() * 2000) + 500;
  return `(function(){var ${cf}=function(){try{(function(){return false;})['constructor']('debugger')['apply']('stateObject');}catch(_e){}};setInterval(function(){${cf}();},${ms});})();` + code;
}

function addDebugProtection(code: string): string {
  const f1 = randName(6), f2 = randName(6);
  const ms = Math.floor(Math.random() * 3000) + 1000;
  return `(function(){var ${f1}=function(){try{(function(){return true;})['constructor']('debugger')['call']('action');}catch(_e){}};var ${f2}=setInterval(function(){${f1}();},${ms});})();` + code;
}

function addDomainLock(code: string, domain: string): string {
  if (!domain) return code;
  const enc = customB64Encode(domain);
  return `(function(){var _b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_e='${enc}',_d='';for(var _i=(0x0);_i<_e['length'];_i++){var _x=_b['indexOf'](_e[_i]);_d+=_x>=(0x0)?_s2[_x]:_e[_i];}_d=decodeURIComponent(escape(atob(_d)));var _h=typeof window!=='undefined'?window['location']['hostname']:'';if(_h&&_h['indexOf'](_d)===(-(0x1))){while(true){}}})();` + code;
}

// ============================================================
// Module statement extractor
// ============================================================

function extractModuleStatements(code: string): { imports: string[]; exports: string[]; body: string } {
  const imports: string[] = [], exports: string[] = [], body: string[] = [];
  const lines = code.split('\n');
  let pending = '';
  for (const line of lines) {
    const t = line.trim();
    if (pending) {
      pending += ' ' + t;
      if (t.includes(';') || t.includes('from ') || /from\s+['"]/.test(t)) { imports.push(pending); pending = ''; }
      continue;
    }
    if (/^import\s/.test(t) && !t.startsWith('import(')) {
      if (t.includes('from ') || t.includes(';') || /^import\s+['"]/.test(t)) imports.push(t);
      else pending = t;
    } else if (/^export\s/.test(t)) {
      exports.push(t);
    } else {
      body.push(line);
    }
  }
  if (pending) imports.push(pending);
  return { imports, exports, body: body.join('\n') };
}

// ============================================================
// JavaScript obfuscation pipeline
// ============================================================

function obfuscateJavaScript(code: string, options: ObfuscationOptions): string {
  const mod = extractModuleStatements(code);
  const hasESM = mod.imports.length > 0 || mod.exports.length > 0;
  let result = hasESM ? mod.body : code;

  result = stripComments(result);

  const key = randKey(16);

  for (let round = 0; round < options.encryptionRounds; round++) {
    if (options.stringSplitting && round === 0) {
      result = splitStrings(result);
    }

    if (options.stringEncryption && round === 0) {
      const ex = extractStrings(result);
      if (ex.strings.length > 0) {
        result = encryptStringArray(ex.strings, key) + ex.code;
      }
    }

    if (options.opaquePredicates) {
      const preds = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, opaquePredicate);
      const stmts = splitStatements(result);
      if (stmts.length > 2) {
        stmts.splice(Math.floor(stmts.length / 3), 0, ...preds);
        result = stmts.join(';');
      }
    }

    if (options.deadCodeInjection) {
      const dc = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, deadCode);
      const stmts = splitStatements(result);
      stmts.splice(Math.max(1, Math.floor(stmts.length / 2)), 0, ...dc);
      result = stmts.join(';');
    }

    if (options.identifierMangling && round === 0) {
      result = mangleIdentifiers(result);
    }

    if (options.controlFlowFlattening && round === 0) {
      const stmts = splitStatements(result);
      if (stmts.length > 4) {
        const mid = Math.floor(stmts.length / 2);
        result = stmts.slice(0, mid).join(';') + ';' + flattenControlFlow(stmts.slice(mid).join(';'));
      }
    }

    if (options.bracketNotation && round === 0) {
      result = convertBracketNotation(result);
    }

    if (options.hexNumbers) {
      result = obfuscateNumbers(result);
    }

    if (options.unicodeEncoding && round === 0) {
      let uni = '';
      let ui = 0;
      while (ui < result.length) {
        const c = result[ui];
        if (c === '`') { const e = skipTemplateLit(result, ui); uni += result.slice(ui, e); ui = e; continue; }
        if (c === '"' || c === "'") {
          uni += c; ui++;
          while (ui < result.length) {
            const rc = result[ui];
            if (rc === '\\') { uni += rc + (result[ui + 1] || ''); ui += 2; continue; }
            if (rc === c) { uni += rc; ui++; break; }
            const cp = rc.charCodeAt(0);
            uni += (cp > 127 || Math.random() > 0.5) ? `\\u${cp.toString(16).padStart(4, '0')}` : rc;
            ui++;
          }
          continue;
        }
        uni += c; ui++;
      }
      result = uni;
    }

    if (options.compressCode) result = compressWhitespace(result);
    if (round < options.encryptionRounds - 1) result = wrapInEval(result);
  }

  if (options.domainLock)     result = addDomainLock(result, options.domainLock);
  if (options.debugProtection) result = addDebugProtection(result);
  if (options.selfDefending)   result = addSelfDefense(result);
  result = wrapInEval(result);

  if (hasESM) {
    result = [mod.imports.join('\n'), result, mod.exports.join('\n')].filter(Boolean).join('\n');
  }
  return result;
}

// ============================================================
// CSS obfuscator
// ============================================================

function obfuscateCSS(code: string, options: ObfuscationOptions): string {
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');

  if (options.identifierMangling) {
    const classMap = new Map<string, string>();
    const idMap    = new Map<string, string>();
    const classRe  = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    const idRe     = /#([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    let m: RegExpExecArray | null;
    while ((m = classRe.exec(code)) !== null) if (!classMap.has(m[1])) classMap.set(m[1], `_${hexName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    while ((m = idRe.exec(code)) !== null)    if (!idMap.has(m[1]))    idMap.set(m[1], `_${hexName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    for (const [orig, man] of classMap) result = result.replace(new RegExp(`\\.${orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}(?=[\\s{:,>+~\\[])`, 'g'), `.${man}`);
    for (const [orig, man] of idMap)    result = result.replace(new RegExp(`#${orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}(?=[\\s{:,>+~\\[])`, 'g'), `#${man}`);
  }

  if (options.deadCodeInjection) {
    const fake = Array.from({ length: 3 }, () => `.${hexName(4).replace(/[^a-z0-9]/g,'')}{visibility:hidden;position:absolute;left:-9999px;opacity:0;pointer-events:none}`).join('');
    result = fake + result;
  }

  if (options.stringEncryption) {
    const hexColors = result.match(/#[0-9a-fA-F]{6}\b/g) || [];
    for (const hex of hexColors) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      result = result.replace(hex, `rgb(${r},${g},${b})`);
    }
  }

  if (options.compressCode) {
    result = result.replace(/\s+/g, ' ').replace(/\s*([{}:;,>+~])\s*/g, '$1').replace(/;\}/g, '}').trim();
  }
  return result;
}

// ============================================================
// HTML obfuscator
// ============================================================

function obfuscateHTML(code: string, options: ObfuscationOptions): string {
  let result = code.replace(/<!--[\s\S]*?-->/g, '');

  if (options.identifierMangling) {
    const idMap  = new Map<string, string>();
    const clsMap = new Map<string, string>();
    const idRe   = /id=["']([^"']+)["']/g;
    const clsRe  = /class=["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = idRe.exec(code))  !== null) if (!idMap.has(m[1]))  idMap.set(m[1], `_${hexName(5).replace(/[^a-zA-Z0-9_-]/g,'')}`);
    while ((m = clsRe.exec(code)) !== null) {
      for (const c of m[1].split(/\s+/)) if (!clsMap.has(c)) clsMap.set(c, `_${hexName(5).replace(/[^a-zA-Z0-9_-]/g,'')}`);
    }
    for (const [o, n] of idMap)  result = result.replace(new RegExp(`(id=["'])${o.replace(/[-[\]{}()*+?.,\\^$|#]/g,'\\$&')}(["'])`, 'g'), `$1${n}$2`);
    for (const [o, n] of clsMap) result = result.replace(new RegExp(`\\b${o.replace(/[-[\]{}()*+?.,\\^$|#]/g,'\\$&')}\\b`, 'g'), n);
  }

  if (options.deadCodeInjection) {
    const fake = [
      `<div style="display:none" data-${hexName(3).replace(/[^a-z]/g,'')}="${Math.random().toString(36).slice(2)}"></div>`,
      `<span style="visibility:hidden;position:absolute" aria-hidden="true">${hexName(3)}</span>`,
    ].join('');
    const bc = result.lastIndexOf('</body>');
    result = bc > -1 ? result.slice(0, bc) + fake + result.slice(bc) : result + fake;
  }

  if (options.stringEncryption) {
    const textRe = />([^<]{3,})</g;
    let m: RegExpExecArray | null;
    const reps: [string, string][] = [];
    while ((m = textRe.exec(result)) !== null) {
      if (m[1].trim().length > 2) {
        const enc = m[1].split('').map(c => `&#${c.charCodeAt(0)};`).join('');
        reps.push([`>${m[1]}<`, `>${enc}<`]);
      }
    }
    for (const [from, to] of reps) result = result.replace(from, to);
  }

  if (options.compressCode) result = result.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return result;
}

// ============================================================
// Batch / Shell obfuscator
// ============================================================

function obfuscateBatch(code: string, options: ObfuscationOptions): string {
  let result = code.replace(/^REM .*/gmi, '').replace(/^:: .*/gm, '');

  if (options.identifierMangling) {
    const setRe = /set\s+(?:\/\w\s+)?"?([a-zA-Z_]\w*)=/gi;
    const varMap = new Map<string, string>();
    const batchReserved = new Set(['errorlevel','cd','date','time','random','path','pathext','comspec','os','userprofile','temp','tmp','homedrive','homepath','username','appdata','programfiles','systemroot','windir','counter']);
    let m: RegExpExecArray | null;
    while ((m = setRe.exec(code)) !== null) {
      if (!batchReserved.has(m[1].toLowerCase()) && !varMap.has(m[1])) varMap.set(m[1], `_W${hexName(4).replace(/[^a-zA-Z0-9_]/g,'')}`);
    }
    for (const [orig, man] of varMap) {
      const esc = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`%${esc}%`, 'gi'), `%${man}%`).replace(new RegExp(`(set\\s+(?:\\/\\w\\s+)?"?)${esc}(=)`, 'gi'), `$1${man}$2`);
    }
  }

  if (options.deadCodeInjection) {
    const lbl = Array.from({ length: 3 }, () => `:_W${hexName(4).replace(/[^a-zA-Z0-9_]/g,'')}\r\nif 1==0 (\r\necho %random%%random%\r\ngoto :eof\r\n)`).join('\r\n');
    result = lbl + '\r\n' + result;
  }

  if (options.stringEncryption) {
    const lines = result.split(/\r?\n/);
    const usedCodes = new Set<number>();
    const obfLines = lines.map(line => {
      const t = line.trim();
      if (!t || t.startsWith('@') || t.startsWith(':') || t.startsWith('if ') || t.startsWith('goto') || t.startsWith('set ')) return line;
      if (t.startsWith('echo ')) {
        const msg = t.slice(5);
        return 'echo ' + msg.split('').map(c => { const code = c.charCodeAt(0); usedCodes.add(code); return `!_c${code}!`; }).join('');
      }
      return line;
    });
    const charSetup = Array.from(usedCodes).map(c => `set "_c${c}=${String.fromCharCode(c)}"`).join('\r\n');
    result = charSetup ? `@echo off\r\nsetlocal enabledelayedexpansion\r\n${charSetup}\r\n${obfLines.join('\r\n')}` : obfLines.join('\r\n');
  }

  if (options.compressCode) result = result.replace(/\r?\n\s*\r?\n/g, '\r\n');
  return result;
}

// ============================================================
// Public API
// ============================================================

export function obfuscate(code: string, options: Partial<ObfuscationOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!code.trim()) return '';
  switch (opts.language) {
    case 'javascript': return obfuscateJavaScript(code, opts);
    case 'css':        return obfuscateCSS(code, opts);
    case 'html':       return obfuscateHTML(code, opts);
    case 'batch':      return obfuscateBatch(code, opts);
    default:           return obfuscateJavaScript(code, opts);
  }
}

export type { ObfuscationOptions, Language };
export { DEFAULT_OPTIONS };
