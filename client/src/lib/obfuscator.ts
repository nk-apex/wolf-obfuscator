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

function makeHexName(length: number = 4): string {
  const chars = 'abcdef0123456789';
  let name = '_0x';
  for (let i = 0; i < length; i++) name += chars[Math.floor(Math.random() * chars.length)];
  return name;
}

const GENERATED_PREFIXES = ['_0x', '_$', '__', '$_', '_W', '_O', '_L', '_F'];
function isGeneratedName(n: string): boolean {
  return GENERATED_PREFIXES.some(p => n.startsWith(p));
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
      const ve = makeHexName(3);
      return `function ${fn}(${v1}){try{return ${v1}['toString'](0x${(Math.floor(Math.random()*20)+2).toString(16)});}catch(${ve}){return ${v1};}}`;
    },
    () => {
      const v1 = generateRandomName(5);
      const v2 = generateRandomName(5);
      return `var ${v1}=function(${v2}){return typeof ${v2}==='undefined'?null:${v2};};`;
    },
    () => {
      const fn = generateRandomName(6);
      const v1 = generateRandomName(4);
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      return `function ${fn}(${v1}){if((${a}*${b})!==${a*b+1}){return ${v1}+0x${Math.floor(Math.random()*255).toString(16)};}return ${v1};}`;
    },
  ];
  return templates[Math.floor(Math.random() * templates.length)]();
}

function generateOpaquePredicates(): string {
  const predicates = [
    () => {
      const v = generateRandomName(5);
      const n = Math.floor(Math.random() * 100) + 1;
      return `if(typeof ${v}==='undefined'||0x${(n*n).toString(16)}===0x${(n*n).toString(16)}){}`;
    },
    () => {
      const a = Math.floor(Math.random() * 50) + 2;
      const b = Math.floor(Math.random() * 50) + 2;
      return `if(0x${(a*b).toString(16)}===0x${(a*b).toString(16)}){}`;
    },
    () => {
      const v1 = generateRandomName(5);
      return `var ${v1}=[];if(${v1}['length']===0x0){}`;
    },
    () => {
      const v1 = generateRandomName(5);
      const n = Math.floor(Math.random() * 100);
      return `var ${v1}=0x${n.toString(16)};while(0x0>0x1){${v1}++;}`;
    },
  ];
  return predicates[Math.floor(Math.random() * predicates.length)]();
}

function obfuscateNumbers(code: string): string {
  let result = '';
  let i = 0;
  let inString: string | null = null;
  let escaped = false;

  while (i < code.length) {
    const ch = code[i];
    if (escaped) { result += ch; escaped = false; i++; continue; }
    if (ch === '\\' && inString) { result += ch; escaped = true; i++; continue; }
    if (inString) { result += ch; if (ch === inString) inString = null; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { result += ch; inString = ch; i++; continue; }

    if (/\d/.test(ch)) {
      const prevChar = result.length > 0 ? result[result.length - 1] : '';
      if (/[a-zA-Z0-9_$.]/.test(prevChar)) { result += ch; i++; continue; }
      let num = '';
      while (i < code.length && /\d/.test(code[i])) { num += code[i]; i++; }
      const nextChar = i < code.length ? code[i] : '';
      if (/[a-zA-Z_$.]/.test(nextChar)) { result += num; continue; }
      let lookahead = i;
      while (lookahead < code.length && /\s/.test(code[lookahead])) lookahead++;
      if (lookahead < code.length && code[lookahead] === '.') { result += num; continue; }
      const n = parseInt(num, 10);
      if (n > 65535 || num.length > 5) { result += num; continue; }
      if (n === 0) { result += '0x0'; continue; }
      if (n === 1) { result += '0x1'; continue; }
      result += `0x${n.toString(16)}`;
      continue;
    }
    result += ch; i++;
  }
  return result;
}

function encodeUnicode(str: string): string {
  return str.split('').map(c => {
    const code = c.charCodeAt(0);
    if (code > 127 || Math.random() > 0.5) {
      return `\\u${code.toString(16).padStart(4, '0')}`;
    }
    return c;
  }).join('');
}

function splitStrings(code: string): string {
  return code.replace(/(["'])([^'"\\]{8,})\1/g, (match, quote, str, offset: number, full: string) => {
    if (str.includes('\n')) return match;
    let i = offset + match.length;
    while (i < full.length && (full[i] === ' ' || full[i] === '\t')) i++;
    if (full[i] === ':' && full[i + 1] !== ':') return match;
    const mid = Math.floor(str.length / 2);
    const safeMid = Math.max(2, Math.min(str.length - 2, mid));
    const left = str.slice(0, safeMid);
    const right = str.slice(safeMid);
    return `(${quote}${left}${quote}+${quote}${right}${quote})`;
  });
}

function convertBracketNotation(code: string): string {
  let result = '';
  let i = 0;
  let inString: string | null = null;
  let escaped = false;

  while (i < code.length) {
    const ch = code[i];
    if (escaped) { result += ch; escaped = false; i++; continue; }
    if (ch === '\\' && inString) { result += ch; escaped = true; i++; continue; }
    if (inString) { result += ch; if (ch === inString) inString = null; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { result += ch; inString = ch; i++; continue; }

    if (ch === '.' && i + 1 < code.length && /[a-zA-Z_$]/.test(code[i + 1])) {
      let prop = '';
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) { prop += code[j]; j++; }
      const nextCh = code[j];
      if (nextCh !== '(' && prop.length > 2 && Math.random() > 0.4) {
        result += `['${prop}']`;
        i = j;
        continue;
      }
    }
    result += ch; i++;
  }
  return result;
}

function splitStatements(code: string): string[] {
  const statements: string[] = [];
  let current = '';
  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (escaped) { current += ch; escaped = false; continue; }
    if (ch === '\\') { current += ch; escaped = true; continue; }
    if (inString) { current += ch; if (ch === inString) inString = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { current += ch; inString = ch; continue; }
    if (ch === '(' || ch === '{' || ch === '[') { depth++; current += ch; continue; }
    if (ch === ')' || ch === '}' || ch === ']') { depth--; current += ch; continue; }
    if (ch === ';' && depth === 0) { if (current.trim()) statements.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

function interpretEscape(ch: string): string {
  switch (ch) {
    case 'n': return '\n';
    case 't': return '\t';
    case 'r': return '\r';
    case '0': return '\0';
    case 'b': return '\b';
    case 'f': return '\f';
    case 'v': return '\v';
    default: return ch;
  }
}

function extractStrings(code: string): { strings: string[]; code: string } {
  const strings: string[] = [];
  let modified = '';
  let i = 0;
  let inString: string | null = null;
  let currentStr = '';
  let escaped = false;
  let stringOpenedAfterObjContext = false;
  const arrName = '_0xstrArr';

  while (i < code.length) {
    const ch = code[i];
    if (escaped) {
      if (inString) { currentStr += interpretEscape(ch); } else { modified += ch; }
      escaped = false; i++; continue;
    }
    if (ch === '\\') { if (!inString) modified += ch; escaped = true; i++; continue; }
    if (inString) {
      if (ch === inString) {
        let peek = i + 1;
        while (peek < code.length && (code[peek] === ' ' || code[peek] === '\t' || code[peek] === '\n' || code[peek] === '\r')) peek++;
        const nextIsColon = peek < code.length && code[peek] === ':' && (peek + 1 >= code.length || code[peek + 1] !== ':');
        const isObjKey = nextIsColon && stringOpenedAfterObjContext;
        if (currentStr.length > 0) {
          if (isObjKey) {
            modified += inString + currentStr + ch;
          } else {
            strings.push(currentStr);
            modified += `${arrName}[${strings.length - 1}]`;
          }
        } else { modified += inString + inString; }
        currentStr = ''; inString = null; stringOpenedAfterObjContext = false;
      } else { currentStr += ch; }
    } else {
      if (ch === '"' || ch === "'") {
        let prev = modified.length - 1;
        while (prev >= 0 && (modified[prev] === ' ' || modified[prev] === '\t' || modified[prev] === '\n' || modified[prev] === '\r')) prev--;
        const prevChar = prev >= 0 ? modified[prev] : '';
        stringOpenedAfterObjContext = (prevChar === '{' || prevChar === ',');
        inString = ch; currentStr = '';
      } else { modified += ch; }
    }
    i++;
  }
  if (inString) modified += inString + currentStr;
  return { strings, code: modified };
}

function encryptStringArray(strings: string[], keys: number[]): string {
  const arrName = '_0xstrArr';
  const decFn = '_0xstrDec';
  const rotFn = '_0xstrRot';
  const keyArr = `[${keys.join(',')}]`;
  const rotOffset = Math.floor(Math.random() * strings.length) + 1;
  const encrypted = strings.map(s => customB64Encode(xorEncrypt(s, keys)));
  const rotated = [...encrypted.slice(rotOffset), ...encrypted.slice(0, rotOffset)];
  const v_s = makeHexName(4);
  const v_k = makeHexName(4);
  const v_r = makeHexName(4);
  const v_b = makeHexName(4);
  const v_s2 = makeHexName(4);
  const v_d = makeHexName(4);
  const v_i = makeHexName(4);
  const v_x = makeHexName(4);
  const v_j = makeHexName(4);
  const v_arr = makeHexName(4);
  const v_ri = makeHexName(4);
  const decoder = `var ${decFn}=function(${v_s},${v_k}){var ${v_r}='',${v_b}='${CUSTOM_ALPHABET}',${v_s2}='${STANDARD_B64}',${v_d}='';for(var ${v_i}=0;${v_i}<${v_s}['length'];${v_i}++){var ${v_x}=${v_b}['indexOf'](${v_s}[${v_i}]);${v_d}+=${v_x}>=0?${v_s2}[${v_x}]:${v_s}[${v_i}];}${v_d}=decodeURIComponent(escape(atob(${v_d})));for(var ${v_j}=0;${v_j}<${v_d}['length'];${v_j}++){${v_r}+=String['fromCharCode'](${v_d}['charCodeAt'](${v_j})^${v_k}[${v_j}%${v_k}['length']]);}return ${v_r};};`;
  const rotDecoder = `var ${rotFn}=function(${v_arr}){${v_arr}['push'](${v_arr}['shift']());};`;
  const arrDecl = `var ${arrName}=[${rotated.map(e => `${decFn}('${e}',${keyArr})`).join(',')}];`;
  const unrot = `for(var ${v_ri}=0;${v_ri}<0x${rotOffset.toString(16)};${v_ri}++){${rotFn}(${arrName});}`;
  return decoder + rotDecoder + arrDecl + unrot;
}

function flattenControlFlow(code: string): string {
  const allStatements = splitStatements(code);
  if (allStatements.length < 3) return code;

  const funcDecls: string[] = [];
  const statements: string[] = [];
  for (const stmt of allStatements) {
    if (/^\s*(async\s+)?function\s+/.test(stmt)) {
      funcDecls.push(stmt);
    } else {
      statements.push(stmt);
    }
  }

  if (statements.length < 3) return allStatements.join(';');

  const stateVar = generateRandomName(6);
  const whileVar = generateRandomName(4);
  const order = Array.from({ length: statements.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const reverseMap = new Array(order.length);
  for (let i = 0; i < order.length; i++) reverseMap[order[i]] = i;
  const cases = order.map((originalIdx, shuffledIdx) => {
    const nextState = originalIdx === statements.length - 1 ? `${whileVar}=false` : `${stateVar}=${reverseMap[originalIdx + 1]}`;
    return `case ${shuffledIdx}:${statements[originalIdx]};${nextState};break`;
  }).join(';');
  const flattened = `var ${stateVar}=${reverseMap[0]},${whileVar}=true;while(${whileVar}){switch(${stateVar}){${cases};}}`;
  return funcDecls.length > 0 ? funcDecls.join(';') + ';' + flattened : flattened;
}

function mangleIdentifiers(code: string): string {
  const reserved = new Set(['var','let','const','function','return','if','else','for','while','do','switch','case','break','continue','new','delete','typeof','instanceof','void','this','throw','try','catch','finally','class','extends','super','import','export','default','from','as','true','false','null','undefined','in','of','with','debugger','yield','await','async','static','get','set','arguments','eval','console','window','document','Math','Date','Array','Object','String','Number','Boolean','RegExp','Error','JSON','Promise','parseInt','parseFloat','isNaN','isFinite','encodeURIComponent','decodeURIComponent','encodeURI','decodeURI','atob','btoa','setTimeout','setInterval','clearTimeout','clearInterval','prototype','constructor','toString','valueOf','hasOwnProperty','length','push','pop','shift','unshift','splice','slice','map','filter','reduce','forEach','indexOf','includes','join','split','replace','match','test','exec','keys','values','entries','assign','freeze','create','_0xstrArr','_0xstrDec','_0xstrRot','escape','unescape','charCodeAt','fromCharCode','charAt','apply','call','bind','fetch','Response','Request','Headers','log','warn','error','info','dir','table','trace','assert','require','module','exports','global','process','addEventListener','removeEventListener','querySelector','querySelectorAll','getElementById','getElementsByClassName','getElementsByTagName','createElement','appendChild','removeChild','insertBefore','innerHTML','outerHTML','textContent','innerText','style','className','classList','setAttribute','getAttribute','removeAttribute','parentNode','parentElement','childNodes','children','firstChild','lastChild','nextSibling','previousSibling','nextElementSibling','previousElementSibling','nodeName','nodeType','nodeValue','body','head','title','href','src','alt','type','name','value','checked','disabled','selected','hidden','id','target','action','method','submit','reset','focus','blur','click','change','input','keydown','keyup','keypress','mouseover','mouseout','mousedown','mouseup','mousemove','preventDefault','stopPropagation','currentTarget','location','hostname','pathname','protocol','port','hash','search','navigator','userAgent','platform','language','localStorage','sessionStorage','getItem','setItem','removeItem','then','catch','finally','resolve','reject','all','race','abs','ceil','floor','round','min','max','pow','sqrt','random','sin','cos','tan','atan2','PI','E','toFixed','toPrecision','toExponential','trim','trimStart','trimEnd','padStart','padEnd','startsWith','endsWith','repeat','substring','substr','toLowerCase','toUpperCase','localeCompare','concat','every','some','find','findIndex','fill','copyWithin','flat','flatMap','isArray','of','sort','reverse','stringify','parse','now','getTime','getFullYear','getMonth','getDate','getDay','getHours','getMinutes','getSeconds','getMilliseconds','toISOString','toLocaleDateString','toLocaleTimeString','toLocaleString','defineProperty','defineProperties','getOwnPropertyNames','getOwnPropertyDescriptor','getPrototypeOf','setPrototypeOf','is','Symbol','iterator','Map','Set','WeakMap','WeakSet','Proxy','Reflect','ArrayBuffer','DataView','Uint8Array','Int8Array','Uint16Array','Int16Array','Uint32Array','Int32Array','Float32Array','Float64Array','Infinity','NaN','globalThis','XMLHttpRequest','FormData','URL','URLSearchParams','Blob','File','FileReader','FileList','Image','Audio','Video','Canvas','requestAnimationFrame','cancelAnimationFrame','performance','alert','confirm','prompt','open','close','print','scroll','scrollTo','scrollBy','innerWidth','innerHeight','outerWidth','outerHeight','pageXOffset','pageYOffset','scrollX','scrollY','screen','width','height','availWidth','availHeight','history','back','forward','go','pushState','replaceState','onload','onerror','onresize','onscroll','onunload','item','index','count','size','data','result','status','message','callback','handler','listener','observer','options','config','params','text','json','blob','arrayBuffer','formData','clone','ok','statusText','headers','url','redirected','mode','credentials','cache','redirect','referrer','integrity','signal','keepalive','abort','AbortController','AbortSignal','dispatchEvent','CustomEvent','Event','MutationObserver','IntersectionObserver','ResizeObserver','observe','unobserve','disconnect','getComputedStyle','getBoundingClientRect','offsetTop','offsetLeft','offsetWidth','offsetHeight','clientTop','clientLeft','clientWidth','clientHeight','scrollTop','scrollLeft','scrollWidth','scrollHeight','display','position','top','left','right','bottom','margin','padding','border','background','color','font','opacity','visibility','overflow','zIndex','transform','transition','animation','cursor','pointerEvents','userSelect','content','label','placeholder','required','pattern','step','multiple','accept','readonly','role','tabIndex','accessKey','dataset','attributes','forms','images','links','cookie','domain','readyState','write','writeln','execCommand','selection','getSelection','createRange','DOMContentLoaded','load','unload','beforeunload','resize','orientationchange','online','offline','storage','popstate','hashchange','touchstart','touchmove','touchend','touchcancel','pointerdown','pointermove','pointerup','pointercancel','wheel','contextmenu','dblclick','dragstart','drag','dragenter','dragover','dragleave','drop','dragend','play','pause','ended','duration','currentTime','volume','muted','paused','loop','autoplay','controls','preload','requestFullscreen','exitFullscreen','fullscreenElement','postMessage','onmessage','Worker','SharedWorker','ServiceWorker','WebSocket','EventSource','crypto','subtle','getRandomValues','TextEncoder','TextDecoder','encode','decode']);
  let result = '';
  let i = 0;
  let inString: string | null = null;
  let escaped = false;
  const identMap = new Map<string, string>();
  const declareRegex = /(?:var|let|const|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const paramRegex = /function\s*[a-zA-Z_$]*\s*\(([^)]*)\)/g;
  const declaredIdents = new Set<string>();
  let m;
  while ((m = declareRegex.exec(code)) !== null) if (!reserved.has(m[1]) && m[1].length > 1 && !isGeneratedName(m[1])) declaredIdents.add(m[1]);
  while ((m = paramRegex.exec(code)) !== null) {
    const params = m[1].split(',').map(p => p.trim()).filter(Boolean);
    for (const p of params) {
      const pName = p.replace(/\s*=.*$/, '').trim();
      if (pName && !reserved.has(pName) && pName.length > 1 && !isGeneratedName(pName)) declaredIdents.add(pName);
    }
  }
  const propertyNames = new Set<string>();
  const dotRegex = /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((m = dotRegex.exec(code)) !== null) propertyNames.add(m[1]);
  const keyRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  while ((m = keyRegex.exec(code)) !== null) if (m[1] !== 'case' && m[1] !== 'default' && m[1] !== 'function') propertyNames.add(m[1]);
  for (const prop of propertyNames) declaredIdents.delete(prop);
  for (const ident of declaredIdents) identMap.set(ident, generateRandomName(8));

  while (i < code.length) {
    const ch = code[i];
    if (escaped) { result += ch; escaped = false; i++; continue; }
    if (ch === '\\') { result += ch; escaped = true; i++; continue; }
    if (inString) { result += ch; if (ch === inString) inString = null; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { result += ch; inString = ch; i++; continue; }
    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = '';
      const identStart = result.length;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) { ident += code[i]; i++; }
      const prevChar = identStart > 0 ? result[identStart - 1] : '';
      if (identMap.has(ident) && prevChar !== '.') { result += identMap.get(ident)!; } else { result += ident; }
      continue;
    }
    result += ch; i++;
  }
  return result;
}

function addSelfDefense(code: string): string {
  const checkFn = generateRandomName(8);
  const timerFn = generateRandomName(8);
  const selfDefense = `(function(){var ${checkFn}=function(){try{(function(){return false;})['constructor']('debugger')['apply']('stateObject');}catch(_e){}};var ${timerFn}=setInterval(function(){${checkFn}();},0x${(Math.floor(Math.random()*3000)+1000).toString(16)});})();`;
  return selfDefense + code;
}

function addDebugProtection(code: string): string {
  const fn1 = generateRandomName(6);
  const fn2 = generateRandomName(6);
  const trap = `(function(){var ${fn1}=function(){try{(function(){return true;})['constructor']('debugger')['call']('action');}catch(_e){}};var ${fn2}=setInterval(function(){${fn1}();},0x${(Math.floor(Math.random()*4000)+2000).toString(16)});})();`;
  return trap + code;
}

function addDomainLock(code: string, domain: string): string {
  if (!domain) return code;
  const encoded = customB64Encode(domain);
  return `(function(){var _b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_e='${encoded}',_d='';for(var _i=0;_i<_e['length'];_i++){var _x=_b['indexOf'](_e[_i]);_d+=_x>=0?_s2[_x]:_e[_i];}_d=decodeURIComponent(escape(atob(_d)));var _h=typeof window!=='undefined'?window['location']['hostname']:'';if(_h&&_h['indexOf'](_d)===-1){while(true){}}})();` + code;
}

function compressWhitespace(code: string): string {
  let result = '';
  let inString: string | null = null;
  let escaped = false;
  let lastWasSpace = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
    if (inString) { result += ch; if (ch === inString) inString = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { result += ch; inString = ch; lastWasSpace = false; continue; }
    if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (ch === '/' && i + 1 < code.length && code[i + 1] === '*') { i += 2; while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++; i++; continue; }
    if (/\s/.test(ch)) {
      if (!lastWasSpace && result.length > 0) {
        if (/[a-zA-Z0-9_$]/.test(result[result.length - 1])) { result += ' '; lastWasSpace = true; }
      }
      continue;
    }
    lastWasSpace = false; result += ch;
  }
  return result.trim();
}

function wrapInEval(code: string): string {
  const encoded = customB64Encode(code);
  const decFn = generateRandomName(8);
  return `(function(){var ${decFn}=function(_s){var _b='${CUSTOM_ALPHABET}',_s2='${STANDARD_B64}',_d='';for(var _i=0;_i<_s['length'];_i++){var _x=_b['indexOf'](_s[_i]);_d+=_x>=0?_s2[_x]:_s[_i];}return decodeURIComponent(escape(atob(_d)));};eval(${decFn}('${encoded}'));})();`;
}

function extractModuleStatements(code: string): { imports: string[]; exports: string[]; body: string } {
  const imports: string[] = [];
  const exports: string[] = [];
  const bodyLines: string[] = [];
  const lines = code.split('\n');
  let pendingImport = '';
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (pendingImport) {
      pendingImport += ' ' + trimmed;
      if (trimmed.includes(';') || trimmed.includes('from ') || /from\s+['"]/.test(trimmed)) { imports.push(pendingImport); pendingImport = ''; }
      continue;
    }
    if (/^import\s/.test(trimmed) && !trimmed.startsWith('import(')) {
      if (trimmed.includes('from ') || trimmed.includes(';') || /^import\s+['"]/.test(trimmed)) { imports.push(trimmed); } else { pendingImport = trimmed; }
    } else if (/^export\s/.test(trimmed)) { exports.push(trimmed); } else { bodyLines.push(lines[i]); }
  }
  if (pendingImport) imports.push(pendingImport);
  return { imports, exports, body: bodyLines.join('\n') };
}

function obfuscateJavaScript(code: string, options: ObfuscationOptions): string {
  const moduleInfo = extractModuleStatements(code);
  const hasModuleSyntax = moduleInfo.imports.length > 0 || moduleInfo.exports.length > 0;
  let result = hasModuleSyntax ? moduleInfo.body : code;

  for (let round = 0; round < options.encryptionRounds; round++) {
    const keys = Array.from({ length: 6 }, () => Math.floor(Math.random() * 255) + 1);

    if (options.stringSplitting && round === 0) {
      result = splitStrings(result);
    }

    if (options.stringEncryption && round === 0) {
      const extracted = extractStrings(result);
      if (extracted.strings.length > 0) result = encryptStringArray(extracted.strings, keys) + extracted.code;
    }

    if (options.opaquePredicates) {
      const predicates = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, generateOpaquePredicates);
      const stmts = splitStatements(result);
      if (stmts.length > 2) {
        const insertAt = Math.floor(stmts.length / 3);
        stmts.splice(insertAt, 0, ...predicates);
        result = stmts.join(';');
      }
    }

    if (options.deadCodeInjection) {
      const deadCodes = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, generateDeadCode);
      const statements = splitStatements(result);
      statements.splice(Math.max(1, Math.floor(statements.length / 2)), 0, ...deadCodes);
      result = statements.join(';');
    }

    if (options.identifierMangling && round === 0) result = mangleIdentifiers(result);

    if (options.controlFlowFlattening && round === 0) {
      const statements = splitStatements(result);
      if (statements.length > 4) {
        const mid = Math.floor(statements.length / 2);
        result = statements.slice(0, mid).join(';') + ';' + flattenControlFlow(statements.slice(mid).join(';'));
      }
    }

    if (options.bracketNotation && round === 0) {
      result = convertBracketNotation(result);
    }

    if (options.hexNumbers) {
      result = obfuscateNumbers(result);
    }

    if (options.unicodeEncoding && round === 0) {
      result = result.replace(/(["'])([^'"\\]{1,})\1/g, (match, q, str) => {
        return q + encodeUnicode(str) + q;
      });
    }

    if (options.compressCode) result = compressWhitespace(result);
    if (round < options.encryptionRounds - 1) result = wrapInEval(result);
  }

  if (options.domainLock) result = addDomainLock(result, options.domainLock);
  if (options.debugProtection) result = addDebugProtection(result);
  if (options.selfDefending) result = addSelfDefense(result);
  result = wrapInEval(result);
  if (hasModuleSyntax) result = [moduleInfo.imports.join('\n'), result, moduleInfo.exports.join('\n')].filter(Boolean).join('\n');
  return result;
}

function obfuscateCSS(code: string, options: ObfuscationOptions): string {
  let result = code.replace(/\/\*[\s\S]*?\*\//g, '');
  if (options.identifierMangling) {
    const classMap = new Map<string, string>();
    const idMap = new Map<string, string>();
    const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    const idRegex = /#([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
    let match;
    while ((match = classRegex.exec(code)) !== null) if (!classMap.has(match[1])) classMap.set(match[1], `_${generateRandomName(6).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    while ((match = idRegex.exec(code)) !== null) if (!idMap.has(match[1])) idMap.set(match[1], `_${generateRandomName(6).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    for (const [orig, mangled] of classMap) result = result.replace(new RegExp(`\\.${orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}(?=[\\s{:,>+~\\[])`, 'g'), `.${mangled}`);
    for (const [orig, mangled] of idMap) result = result.replace(new RegExp(`#${orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}(?=[\\s{:,>+~\\[])`, 'g'), `#${mangled}`);
  }
  if (options.deadCodeInjection) {
    const fakeRules = Array.from({ length: 3 }, () => `.${generateRandomName(5).replace(/[^a-zA-Z0-9_-]/g, '')}{visibility:hidden;position:absolute;left:-9999px;opacity:0;pointer-events:none}`);
    result = fakeRules.join('') + result;
  }
  if (options.stringEncryption) {
    const hexColors = result.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    for (const hex of hexColors) if (hex.length === 7) result = result.replace(hex, `rgb(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)})`);
  }
  if (options.compressCode) result = result.replace(/\s+/g, ' ').replace(/\s*([{}:;,>+~])\s*/g, '$1').replace(/;\}/g, '}').trim();
  return result;
}

function obfuscateHTML(code: string, options: ObfuscationOptions): string {
  let result = code.replace(/<!--[\s\S]*?-->/g, '');
  if (options.identifierMangling) {
    const idRegex = /id=["']([^"']+)["']/g;
    const classRegex = /class=["']([^"']+)["']/g;
    const idMap = new Map<string, string>(), clsMap = new Map<string, string>();
    let match;
    while ((match = idRegex.exec(code)) !== null) if (!idMap.has(match[1])) idMap.set(match[1], `_${generateRandomName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    while ((match = classRegex.exec(code)) !== null) for (const cls of match[1].split(/\s+/)) if (!clsMap.has(cls)) clsMap.set(cls, `_${generateRandomName(5).replace(/[^a-zA-Z0-9_-]/g, '')}`);
    for (const [orig, mangled] of idMap) result = result.replace(new RegExp(`(id=["'])${orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}(["'])`, 'g'), `$1${mangled}$2`);
    for (const [orig, mangled] of clsMap) result = result.replace(new RegExp(`\\b${orig.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}\\b`, 'g'), mangled);
  }
  if (options.deadCodeInjection) {
    const fake = [`<div style="display:none" data-${generateRandomName(4).replace(/[^a-z]/g, '')}="${Math.random().toString(36).slice(2)}"></div>`, `<span style="visibility:hidden;position:absolute" aria-hidden="true">${generateRandomName(3)}</span>`, `<!-- ${customB64Encode(generateRandomName(10))} -->`].join('');
    const bodyClose = result.lastIndexOf('</body>');
    result = bodyClose > -1 ? result.slice(0, bodyClose) + fake + result.slice(bodyClose) : result + fake;
  }
  if (options.stringEncryption) {
    const textRegex = />([^<]{3,})</g;
    let match; const reps: [string, string][] = [];
    while ((match = textRegex.exec(result)) !== null) if (match[1].trim().length > 2) reps.push([`>${match[1]}<`, `>${match[1].split('').map(c => `&#${c.charCodeAt(0)};`).join('')}<`]);
    for (const [from, to] of reps) result = result.replace(from, to);
  }
  if (options.compressCode) result = result.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return result;
}

function obfuscateBatch(code: string, options: ObfuscationOptions): string {
  let result = code.replace(/^REM .*/gmi, '').replace(/^:: .*/gm, '');
  if (options.identifierMangling) {
    const setRegex = /set\s+(?:\/\w\s+)?"?([a-zA-Z_]\w*)=/gi;
    const varMap = new Map<string, string>();
    const reservedBatch = new Set(['errorlevel','cd','date','time','random','path','pathext','comspec','os','userprofile','temp','tmp','homedrive','homepath','username','appdata','programfiles','systemroot','windir','counter']);
    let match;
    while ((match = setRegex.exec(code)) !== null) if (!reservedBatch.has(match[1].toLowerCase()) && !varMap.has(match[1])) varMap.set(match[1], `_W${generateRandomName(4).replace(/[^a-zA-Z0-9_]/g, '')}`);
    for (const [orig, mangled] of varMap) {
      const esc = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`%${esc}%`, 'gi'), `%${mangled}%`).replace(new RegExp(`(set\\s+(?:\\/\\w\\s+)?"?)${esc}(=)`, 'gi'), `$1${mangled}$2`);
    }
  }
  if (options.deadCodeInjection) {
    const labels = Array.from({ length: 3 }, () => `:_W${generateRandomName(4).replace(/[^a-zA-Z0-9_]/g, '')}\r\nif 1==0 (\r\necho %random%%random%\r\ngoto :eof\r\n)`).join('\r\n');
    result = labels + '\r\n' + result;
  }
  if (options.stringEncryption) {
    const lines = result.split(/\r?\n/);
    const usedCodes = new Set<number>();
    const obfLines = lines.map(line => {
      const t = line.trim();
      if (t.startsWith('@') || t.startsWith(':') || t === '' || t.startsWith('if ') || t.startsWith('goto') || t.startsWith('set ')) return line;
      if (t.startsWith('echo ')) {
        const msg = t.slice(5);
        return `echo ` + msg.split('').map(c => { const code = c.charCodeAt(0); usedCodes.add(code); return `!_c${code}!`; }).join('');
      }
      return line;
    });
    const charSetup = Array.from(usedCodes).map(code => `set "_c${code}=${String.fromCharCode(code)}"`).join('\r\n');
    result = charSetup ? '@echo off\r\nsetlocal enabledelayedexpansion\r\n' + charSetup + '\r\n' + obfLines.join('\r\n') : obfLines.join('\r\n');
  }
  if (options.compressCode) result = result.replace(/\r?\n\s*\r?\n/g, '\r\n');
  return result;
}

export function obfuscate(code: string, options: Partial<ObfuscationOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!code.trim()) return '';
  switch (opts.language) {
    case 'javascript': return obfuscateJavaScript(code, opts);
    case 'css': return obfuscateCSS(code, opts);
    case 'html': return obfuscateHTML(code, opts);
    case 'batch': return obfuscateBatch(code, opts);
    default: return obfuscateJavaScript(code, opts);
  }
}

export type { ObfuscationOptions, Language };
export { DEFAULT_OPTIONS };
