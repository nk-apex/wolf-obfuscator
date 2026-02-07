import { useState, useCallback, useRef } from "react";
import { obfuscate, DEFAULT_OPTIONS, type ObfuscationOptions, type Language } from "@/lib/obfuscator";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Code2, Lock, Zap, Copy, Download, Trash2,
  Settings2, FileCode2, Eye,
  Layers, Bug, Shuffle, Binary, Globe,
  Terminal, FileText, Braces, Hash
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SAMPLE_CODE: Record<Language, string> = {
  javascript: `// Example JavaScript code
function calculateTotal(items) {
  let total = 0;
  const taxRate = 0.08;
  
  for (const item of items) {
    const price = item.price * item.quantity;
    const discount = item.discount || 0;
    total += price - (price * discount);
  }
  
  const tax = total * taxRate;
  return {
    subtotal: total,
    tax: tax,
    total: total + tax
  };
}

const API_KEY = "sk-secret-key-12345";
const endpoint = "https://api.example.com/data";

async function fetchData(userId) {
  const response = await fetch(endpoint, {
    headers: { "Authorization": "Bearer " + API_KEY }
  });
  return response.json();
}`,
  css: `.container {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem;
  border-radius: 12px;
}
.card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Application</title>
</head>
<body>
  <div id="app" class="container">
    <header class="main-header">
      <h1>Welcome to My App</h1>
      <nav id="main-nav">
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    <main class="content">
      <section class="hero">
        <h2>Build Something Amazing</h2>
        <p>Start your journey today.</p>
        <button id="cta-button">Get Started</button>
      </section>
    </main>
  </div>
</body>
</html>`,
  batch: `@echo off
REM Batch script example
set APP_NAME=MyApplication
set VERSION=2.1.0
set SECRET_KEY=abc123xyz

echo Starting %APP_NAME% v%VERSION%...

if not exist "data" (
  mkdir data
  echo Created data directory
)

set /a COUNTER=0
:loop
set /a COUNTER+=1
echo Processing item %COUNTER%...
if %COUNTER% LSS 10 goto loop

echo %APP_NAME% completed successfully!
pause`,
};

const LANGUAGE_INFO: Record<Language, { label: string; icon: typeof Code2; ext: string }> = {
  javascript: { label: "JavaScript", icon: Braces, ext: ".js" },
  css: { label: "CSS", icon: FileText, ext: ".css" },
  html: { label: "HTML", icon: FileCode2, ext: ".html" },
  batch: { label: "Batch/Shell", icon: Terminal, ext: ".bat" },
};


export default function Home() {
  const { toast } = useToast();
  const [inputCode, setInputCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [isObfuscating, setIsObfuscating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [options, setOptions] = useState<ObfuscationOptions>({ ...DEFAULT_OPTIONS });
  const [stats, setStats] = useState<{ original: number; obfuscated: number; ratio: number } | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const handleObfuscate = useCallback(() => {
    if (!inputCode.trim()) {
      toast({ title: "No Code", description: "Please enter code to obfuscate.", variant: "destructive" });
      return;
    }
    setIsObfuscating(true);
    setTimeout(() => {
      try {
        const result = obfuscate(inputCode, options);
        setOutputCode(result);
        setStats({
          original: inputCode.length,
          obfuscated: result.length,
          ratio: Math.round((result.length / inputCode.length) * 100),
        });
        toast({ title: "Obfuscation Complete", description: `Code protected with ${options.encryptionRounds} encryption layers.` });
      } catch (err) {
        toast({ title: "Error", description: "Obfuscation failed. Check your code syntax.", variant: "destructive" });
      }
      setIsObfuscating(false);
    }, 600);
  }, [inputCode, options, toast]);

  const handleCopy = useCallback(() => {
    if (outputCode) {
      navigator.clipboard.writeText(outputCode);
      toast({ title: "Copied", description: "Obfuscated code copied to clipboard." });
    }
  }, [outputCode, toast]);

  const handleDownload = useCallback(() => {
    if (!outputCode) return;
    const info = LANGUAGE_INFO[options.language];
    const blob = new Blob([outputCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `obfuscated${info.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputCode, options.language]);

  const handleClear = useCallback(() => {
    setInputCode("");
    setOutputCode("");
    setStats(null);
  }, []);

  const handleLoadSample = useCallback(() => {
    setInputCode(SAMPLE_CODE[options.language]);
    setOutputCode("");
    setStats(null);
  }, [options.language]);

  const updateOption = <K extends keyof ObfuscationOptions>(key: K, value: ObfuscationOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const LangIcon = LANGUAGE_INFO[options.language].icon;

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-green-500/3 blur-[80px]" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-green-500/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="w-8 h-8 text-green-400" />
                <div className="absolute inset-0 blur-md bg-green-400/30 rounded-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider">
                  <span className="text-green-400">WOLF</span>
                  <span className="text-gray-400">-OBFUSCATOR</span>
                </h1>
                <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase">Advanced Code Protection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/5 font-mono text-[10px] no-default-hover-elevate no-default-active-elevate">
                v2.0
              </Badge>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5 font-mono text-[10px] no-default-hover-elevate no-default-active-elevate">
                <Lock className="w-3 h-3 mr-1" />
                ENCRYPTED
              </Badge>
            </div>
          </div>
        </header>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 mb-4">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400 tracking-wider uppercase">Military-Grade Obfuscation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
              Protect Your <span className="text-green-400">Source Code</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              Multi-layer encryption, control flow flattening, and anti-debugging protection
              make your code virtually impossible to reverse engineer.
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-green-500/15 bg-black/40 backdrop-blur-sm"
              style={{ boxShadow: "0 0 30px rgba(57,232,130,0.05)" }}
              data-testid="text-credit"
            >
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400 tracking-wider">By <span className="text-green-400 font-semibold">Silent Wolf</span></span>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={options.language}
                  onValueChange={(v) => {
                    updateOption("language", v as Language);
                    setInputCode("");
                    setOutputCode("");
                    setStats(null);
                  }}
                >
                  <SelectTrigger
                    className="w-[180px] bg-black/50 border-green-500/20 text-green-400 font-mono text-xs focus:ring-green-500/30"
                    data-testid="select-language"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-green-500/20">
                    {(Object.keys(LANGUAGE_INFO) as Language[]).map((lang) => {
                      const info = LANGUAGE_INFO[lang];
                      const Icon = info.icon;
                      return (
                        <SelectItem key={lang} value={lang} className="text-gray-300 focus:bg-green-500/10 focus:text-green-400 font-mono text-xs" data-testid={`select-item-${lang}`}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            {info.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="border-green-500/20 text-green-400 bg-green-500/5 font-mono text-xs"
                  data-testid="button-load-sample"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1.5" />
                  Load Sample
                </Button>

                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500/20 text-gray-400 bg-black/30 font-mono text-xs ml-auto"
                      data-testid="button-toggle-settings"
                    >
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                      Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-950 border-green-500/20 max-w-sm" data-testid="dialog-settings">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-white font-mono text-sm">
                        <Settings2 className="w-4 h-4 text-green-400" />
                        Obfuscation Settings
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <label className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-green-400" />
                            Encryption Rounds
                          </span>
                          <span className="text-xs text-green-400 font-bold">{options.encryptionRounds}</span>
                        </label>
                        <Slider
                          value={[options.encryptionRounds]}
                          onValueChange={([v]) => updateOption("encryptionRounds", v)}
                          min={1}
                          max={5}
                          step={1}
                          className="w-full"
                          data-testid="slider-rounds"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-gray-700">Fast</span>
                          <span className="text-[9px] text-gray-700">Maximum</span>
                        </div>
                      </div>

                      <div className="h-px bg-green-500/10" />

                      <SettingToggle icon={Lock} label="String Encryption" desc="XOR + custom Base64" checked={options.stringEncryption} onChange={(v) => updateOption("stringEncryption", v)} testId="toggle-string-encryption" />
                      <SettingToggle icon={Shuffle} label="Control Flow Flattening" desc="Switch-based spaghetti" checked={options.controlFlowFlattening} onChange={(v) => updateOption("controlFlowFlattening", v)} testId="toggle-control-flow" />
                      <SettingToggle icon={Bug} label="Dead Code Injection" desc="Fake decoy functions" checked={options.deadCodeInjection} onChange={(v) => updateOption("deadCodeInjection", v)} testId="toggle-dead-code" />
                      <SettingToggle icon={Hash} label="Identifier Mangling" desc="Hex name replacement" checked={options.identifierMangling} onChange={(v) => updateOption("identifierMangling", v)} testId="toggle-identifier-mangling" />
                      <SettingToggle icon={Shield} label="Self-Defending" desc="Anti-tampering wrapper" checked={options.selfDefending} onChange={(v) => updateOption("selfDefending", v)} testId="toggle-self-defending" />
                      <SettingToggle icon={Eye} label="Debug Protection" desc="Anti-debugger traps" checked={options.debugProtection} onChange={(v) => updateOption("debugProtection", v)} testId="toggle-debug-protection" />
                      <SettingToggle icon={Zap} label="Code Compression" desc="Minify whitespace" checked={options.compressCode} onChange={(v) => updateOption("compressCode", v)} testId="toggle-compression" />

                      <div className="h-px bg-green-500/10" />

                      <div>
                        <label className="flex items-center gap-1.5 mb-1.5">
                          <Globe className="w-3 h-3 text-purple-400" />
                          <span className="text-[11px] text-gray-400">Domain Lock</span>
                        </label>
                        <Input
                          value={options.domainLock}
                          onChange={(e) => updateOption("domainLock", e.target.value)}
                          placeholder="example.com"
                          className="bg-black/50 border-green-500/15 text-green-400 font-mono text-xs placeholder:text-gray-700 focus-visible:ring-green-500/30 h-8"
                          data-testid="input-domain-lock"
                        />
                        <p className="text-[9px] text-gray-700 mt-1">Lock code to specific domain</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div
                className="rounded-xl border border-green-500/15 bg-black/30 backdrop-blur-sm overflow-hidden"
                style={{ boxShadow: "0 0 40px rgba(57,232,130,0.06)" }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-green-500/10 bg-black/50">
                  <div className="flex items-center gap-2">
                    <LangIcon className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Input Code</span>
                    <span className="text-[10px] text-gray-600">({LANGUAGE_INFO[options.language].label})</span>
                  </div>
                  {inputCode && (
                    <span className="text-[10px] text-gray-600">
                      {inputCode.length.toLocaleString()} chars | {inputCode.split("\n").length} lines
                    </span>
                  )}
                </div>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={`// Paste your ${LANGUAGE_INFO[options.language].label} code here...`}
                  className="w-full h-64 bg-transparent text-green-300/90 font-mono text-xs leading-relaxed p-4 resize-none focus:outline-none placeholder:text-gray-700"
                  spellCheck={false}
                  data-testid="input-code"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={handleObfuscate}
                  disabled={isObfuscating || !inputCode.trim()}
                  className="bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs px-6 transition-all disabled:opacity-30"
                  data-testid="button-obfuscate"
                >
                  {isObfuscating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                      Encrypting...
                    </div>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Obfuscate Code
                    </>
                  )}
                </Button>

                {outputCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="border-green-500/30 text-green-400 bg-green-500/5 font-mono text-xs"
                    data-testid="button-download"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="border-red-500/20 text-red-400/60 bg-transparent font-mono text-xs ml-auto"
                  data-testid="button-clear"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Clear
                </Button>
              </div>

              {stats && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-purple-500/15 bg-purple-500/5 flex-wrap" data-testid="stats-panel">
                  <div className="flex items-center gap-2">
                    <Binary className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Stats</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <span className="text-gray-400" data-testid="text-stats-original">
                      Original: <span className="text-green-400 font-semibold">{stats.original.toLocaleString()}</span> chars
                    </span>
                    <span className="text-gray-400" data-testid="text-stats-protected">
                      Protected: <span className="text-purple-400 font-semibold">{stats.obfuscated.toLocaleString()}</span> chars
                    </span>
                    <span className="text-gray-400" data-testid="text-stats-expansion">
                      Expansion: <span className="text-yellow-400 font-semibold">{stats.ratio}%</span>
                    </span>
                  </div>
                </div>
              )}

              <div
                className="rounded-xl border border-purple-500/15 bg-black/30 backdrop-blur-sm overflow-hidden"
                style={{ boxShadow: "0 0 40px rgba(255,0,255,0.05)" }}
              >
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-purple-500/10 bg-black/50">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Obfuscated Output</span>
                    <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-500/5 text-[9px] no-default-hover-elevate no-default-active-elevate">
                      PROTECTED
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {outputCode && (
                      <span className="text-[10px] text-gray-600">
                        {outputCode.length.toLocaleString()} chars
                      </span>
                    )}
                    {outputCode && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className="border-purple-500/30 text-purple-400 bg-purple-500/5"
                        data-testid="button-copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <textarea
                  ref={outputRef}
                  value={outputCode}
                  readOnly
                  placeholder="// Obfuscated code will appear here..."
                  className="w-full h-64 bg-gray-950/50 text-purple-300/80 font-mono text-[10px] leading-relaxed p-4 resize-none focus:outline-none placeholder:text-gray-800"
                  spellCheck={false}
                  data-testid="output-code"
                />
              </div>
            </div>

          </div>
        </main>

        <footer className="border-t border-green-500/10 bg-black/60 backdrop-blur-sm py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400/50" />
              <span className="text-[10px] text-gray-600 tracking-wider">WOLF-OBFUSCATOR v2.0</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-gray-700 uppercase tracking-widest">Client-side processing</span>
              <Badge variant="outline" className="border-green-500/10 text-green-500/40 text-[9px] no-default-hover-elevate no-default-active-elevate">
                <Lock className="w-2.5 h-2.5 mr-1" />
                Zero Server Upload
              </Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
  testId,
}: {
  icon: typeof Lock;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-3 h-3 text-green-500/60 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] text-gray-300 font-medium leading-none mb-0.5">{label}</p>
          <p className="text-[9px] text-gray-600 leading-none">{desc}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-green-500/40 flex-shrink-0"
        data-testid={testId}
      />
    </div>
  );
}
