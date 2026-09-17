"use client";

import { useState } from "react";
import {
  Database,
  Search,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  ArrowRight,
  Lock,
  RefreshCw,
  Terminal,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  HelpCircle,
  ExternalLink,
  Zap,
  Globe,
  Code2,
  FileText,
  BadgeCheck,
  SlidersHorizontal,
} from "lucide-react";

export default function Home() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [testNop, setTestNop] = useState("120301005600400580");
  const [activeView, setActiveView] = useState<"catalog" | "sandbox" | "docs" | "codes">("catalog");
  const [activeTab, setActiveTab] = useState<"nop" | "sppt" | "znt" | "bpn" | "token">("nop");
  const [authMode, setAuthMode] = useState<"apikey" | "bearer" | "none">("apikey");
  const [apiKey, setApiKey] = useState("bpn-sismiop-pbb-secret-2026");
  const [bearerToken, setBearerToken] = useState("");
  const [clientId, setClientId] = useState("bpn_splp_client");
  const [clientSecret, setClientSecret] = useState("bpn_splp_secret_key_2026");
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "fetch" | "python" | "php">("curl");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Payload BPN
  const [nib, setNib] = useState("10.01.05.02.01234");
  const [nomorHak, setNomorHak] = useState("M.02154");
  const [luasTanahBpn, setLuasTanahBpn] = useState("157");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const handleFetchToken = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/v1/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }),
      });
      const json = await res.json();
      setResponseTime(Math.round(performance.now() - start));
      setApiResponse(json);
      if (json.access_token) {
        setBearerToken(json.access_token);
        setAuthMode("bearer");
      }
    } catch (err: any) {
      setResponseTime(Math.round(performance.now() - start));
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestApi = async (type: string) => {
    setLoading(true);
    setApiResponse(null);
    setResponseTime(null);
    const start = performance.now();

    try {
      if (type === "token") {
        await handleFetchToken();
        return;
      }

      let url = `/api/v1/pbb/nop/${testNop}`;
      let options: RequestInit = { method: "GET", headers: {} };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authMode === "apikey") {
        headers["X-API-Key"] = apiKey;
      } else if (authMode === "bearer" && bearerToken) {
        headers["Authorization"] = `Bearer ${bearerToken}`;
      }

      if (type === "sppt") {
        url = `/api/v1/pbb/sppt/${testNop}`;
      } else if (type === "znt") {
        url = `/api/v1/pbb/znt/${testNop}`;
      } else if (type === "bpn") {
        url = `/api/v1/pbb/bpn-validasi`;
        options = {
          method: "POST",
          body: JSON.stringify({
            nop: testNop,
            nib: nib,
            nomor_hak: nomorHak,
            luas_tanah_bpn: Number(luasTanahBpn) || 0,
          }),
        };
      }

      options.headers = headers;

      const res = await fetch(url, options);
      const json = await res.json();
      setResponseTime(Math.round(performance.now() - start));
      setApiResponse(json);
    } catch (err: any) {
      setResponseTime(Math.round(performance.now() - start));
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Generator Snippet Kode
  const getCodeSnippet = (lang: string) => {
    const authHeader =
      authMode === "apikey"
        ? `X-API-Key: ${apiKey}`
        : authMode === "bearer"
          ? `Authorization: Bearer ${bearerToken || "<ACCESS_TOKEN>"}`
          : "";

    let endpointPath = `/api/v1/pbb/nop/${testNop}`;
    let method = "GET";
    let bodyJson = "";

    if (activeTab === "sppt") endpointPath = `/api/v1/pbb/sppt/${testNop}`;
    if (activeTab === "znt") endpointPath = `/api/v1/pbb/znt/${testNop}`;
    if (activeTab === "bpn") {
      endpointPath = `/api/v1/pbb/bpn-validasi`;
      method = "POST";
      bodyJson = JSON.stringify({ nop: testNop, nib, nomor_hak: nomorHak, luas_tanah_bpn: Number(luasTanahBpn) }, null, 2);
    }
    if (activeTab === "token") {
      endpointPath = `/api/v1/auth/token`;
      method = "POST";
      bodyJson = JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }, null, 2);
    }

    if (lang === "curl") {
      if (method === "GET") {
        return `curl -X GET "http://103.167.12.53:3005${endpointPath}" \\\n  -H "Accept: application/json"${authHeader ? ` \\\n  -H "${authHeader}"` : ""}`;
      } else {
        return `curl -X POST "http://103.167.12.53:3005${endpointPath}" \\\n  -H "Content-Type: application/json"${authHeader ? ` \\\n  -H "${authHeader}"` : ""} \\\n  -d '${bodyJson.replace(/\n/g, "")}'`;
      }
    } else if (lang === "fetch") {
      return `const response = await fetch("http://103.167.12.53:3005${endpointPath}", {
  method: "${method}",
  headers: {
    "Content-Type": "application/json",${authHeader ? `\n    "${authHeader.split(": ")[0]}": "${authHeader.split(": ")[1]}"` : ""}
  }${method === "POST" ? `,\n  body: JSON.stringify(${bodyJson.split("\n").map((l, i) => i === 0 ? l : "  " + l).join("\n")})` : ""}
});
const data = await response.json();
console.log(data);`;
    } else if (lang === "python") {
      return `import requests

url = "http://103.167.12.53:3005${endpointPath}"
headers = {
    "Content-Type": "application/json"${authHeader ? `,\n    "${authHeader.split(": ")[0]}": "${authHeader.split(": ")[1]}"` : ""}
}
${method === "POST" ? `payload = ${bodyJson}\nresponse = requests.post(url, json=payload, headers=headers)` : `response = requests.get(url, headers=headers)`}

print(response.status_code)
print(response.json())`;
    } else if (lang === "php") {
      return `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://103.167.12.53:3005${endpointPath}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"${authHeader ? `,\n    "${authHeader}"` : ""}
]);
${method === "POST" ? `curl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${bodyJson.replace(/\n/g, "")}');` : ""}

$response = curl_exec($ch);
curl_close($ch);
$data = json_decode($response, true);
print_r($data);`;
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar - TrustMark / SPLP Official GovTech Header */}


      {/* Main Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  TrustMark PBB dan BPHTB
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  SPLP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Portal Integrasi Layanan Basis Data Pajak
              </p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveView("catalog")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeView === "catalog" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white"
                }`}
            >
              Katalog API
            </button>
            <button
              onClick={() => setActiveView("sandbox")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeView === "sandbox" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white"
                }`}
            >
              Live Sandbox
            </button>
            <button
              onClick={() => setActiveView("codes")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeView === "codes" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-slate-300 hover:text-white"
                }`}
            >
              Kamus Status SPLP
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/api/v1/docs/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-800 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>OpenAPI Spec</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* TrustMark Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-[450px] h-[450px] bg-gradient-to-bl from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sistem Penghubung Layanan Pemerintah (SPLP)
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Portal Integrasi API
            </h1>

            {/* Badges / Pill specs */}
            <div className="pt-2 flex flex-wrap gap-2.5 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" /> Oracle Enterprise SISMIOP
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> OAuth2 / API Key / HMAC
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Latency: &lt;15ms
              </span>
            </div>
          </div>

          {/* Quick Metrics 4 Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Katalog Layanan</div>
              <div className="text-2xl font-black text-white mt-1">5 Endpoint</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Siap Produksi
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Database Backend</div>
              <div className="text-2xl font-black text-white mt-1">Oracle 19c</div>
              <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1">
                <Activity className="w-3 h-3" /> Thick Mode Active
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Tingkat Keamanan</div>
              <div className="text-2xl font-black text-white mt-1">SPLP Multi-Auth</div>
              <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" /> Replay-Proof
              </div>
            </div>
          </div>
        </div>

        {/* View 1: Katalog Layanan API & Interactive Explorer */}
        {activeView === "catalog" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: List Katalog Endpoint */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  Katalog Layanan Interoperabilitas
                </h2>
                <span className="text-xs text-slate-400 font-mono">Base: /api/v1</span>
              </div>

              {/* Endpoint 0: OAuth2 Token */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/60 transition-all space-y-3 group shadow-lg shadow-indigo-950/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 text-xs font-black font-mono rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      POST
                    </span>
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                      /api/v1/auth/token
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-medium border border-indigo-500/30">
                      OAuth2 Token
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("http://103.167.12.53:3005/api/v1/auth/token", "token")}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy Full URL"
                  >
                    {copiedEndpoint === "token" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Layanan penerbitan token akses JWT (Bearer) standar SPLP menggunakan Client Credentials untuk autentikasi mesin-ke-mesin (BPN Gateway).
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Param: client_id, client_secret</span>
                  <button
                    onClick={() => { setActiveTab("token"); setActiveView("sandbox"); handleFetchToken(); }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Uji di Sandbox <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Endpoint 1: Detail NOP */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 text-xs font-black font-mono rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      GET
                    </span>
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                      /api/v1/pbb/nop/<span className="text-emerald-400">&#123;nop&#125;</span>
                    </span>
                    <span title="Terproteksi SPLP Auth">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("http://103.167.12.53:3005/api/v1/pbb/nop/120301005600400580", "nop")}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy Full URL"
                  >
                    {copiedEndpoint === "nop" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Layanan penarikan data master Objek Pajak (Identitas Wajib Pajak, Alamat Letak, Luas Bumi, Luas Bangunan, NJOP) berdasarkan 18 Digit NOP SISMIOP.
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Tabel: DAT_OBJEK_PAJAK, DAT_SUBJEK_PAJAK</span>
                  <button
                    onClick={() => { setActiveTab("nop"); setActiveView("sandbox"); handleTestApi("nop"); }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Uji di Sandbox <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Endpoint 2: SPPT */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 group shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 text-xs font-black font-mono rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      GET
                    </span>
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                      /api/v1/pbb/sppt/<span className="text-emerald-400">&#123;nop&#125;</span>
                    </span>
                    <span title="Terproteksi SPLP Auth">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("http://103.167.12.53:3005/api/v1/pbb/sppt/120301005600400580", "sppt")}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy Full URL"
                  >
                    {copiedEndpoint === "sppt" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Layanan riwayat penetapan SPPT tahunan, nominal PBB terhutang, riwayat transaksi pelunasan, denda, serta status tunggakan pajak.
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Tabel: SPPT, PEMBAYARAN_SPPT</span>
                  <button
                    onClick={() => { setActiveTab("sppt"); setActiveView("sandbox"); handleTestApi("sppt"); }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Uji di Sandbox <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Endpoint 3: ZNT */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3 group shadow-lg shadow-amber-950/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 text-xs font-black font-mono rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      GET
                    </span>
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                      /api/v1/pbb/znt/<span className="text-amber-400">&#123;nop&#125;</span>
                    </span>
                    <span title="Terproteksi SPLP Auth">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("http://103.167.12.53:3005/api/v1/pbb/znt/120301005600400580", "znt")}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy Full URL"
                  >
                    {copiedEndpoint === "znt" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Layanan Zona Nilai Tanah (ZNT), Nilai Indikasi Rata-rata (NIR) per m², rincian bidang bumi, dan estimasi nilai pasar/NJOP bumi SISMIOP.
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Tabel: DAT_OP_BUMI, DAT_NIR, DAT_ZNT</span>
                  <button
                    onClick={() => { setActiveTab("znt"); setActiveView("sandbox"); handleTestApi("znt"); }}
                    className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Uji di Sandbox <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Endpoint 4: Validasi BPN */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/60 transition-all space-y-3 group shadow-lg shadow-cyan-950/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 text-xs font-black font-mono rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                      POST
                    </span>
                    <span className="font-mono font-semibold text-slate-100 text-sm">
                      /api/v1/pbb/bpn-validasi
                    </span>
                    <span title="Terproteksi SPLP Auth">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("http://103.167.12.53:3005/api/v1/pbb/bpn-validasi", "bpn")}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy Full URL"
                  >
                    {copiedEndpoint === "bpn" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Layanan validasi silang (cross-match) bidang tanah BPN (NIB, Luas Ukur) dengan data SISMIOP PBB untuk penerbitan sertipikat dan validasi BPHTB.
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Payload: nop, nib, nomor_hak, luas_tanah_bpn</span>
                  <button
                    onClick={() => { setActiveTab("bpn"); setActiveView("sandbox"); handleTestApi("bpn"); }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Uji di Sandbox <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Authentication Card & Overview */}
            <div className="lg:col-span-5 space-y-6">
              {/* Quick Auth Info Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    Kredensial Akses SPLP
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Semua endpoint API diproteksi sesuai standar regulasi SPLP. Anda dapat menggunakan salah satu dari metode autentikasi berikut:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-medium flex items-center justify-between">
                      <span>Header API Key:</span>
                      <span className="text-emerald-400 font-mono">X-API-Key</span>
                    </div>
                    <div className="font-mono text-amber-300 bg-slate-900 px-2 py-1 rounded select-all text-[11px] truncate">
                      bpn-sismiop-pbb-secret-2026
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-medium flex items-center justify-between">
                      <span>Client ID (OAuth2):</span>
                      <span className="text-indigo-400 font-mono">Client Credentials</span>
                    </div>
                    <div className="font-mono text-indigo-300 bg-slate-900 px-2 py-1 rounded select-all text-[11px]">
                      bpn_splp_client
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => { setActiveView("sandbox"); setActiveTab("token"); }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Key className="w-4 h-4" /> Buka Token Generator
                  </button>
                </div>
              </div>

              {/* Security Standards Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kepatuhan Standar SPLP
                </h3>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>OAuth2 JWT Bearer</strong> dengan masa berlaku token 3600 detik.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>HMAC-SHA256 Signature</strong> untuk integritas data payload.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Replay Attack Prevention</strong> dengan toleransi timestamp ±5 menit.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Live Sandbox Console (TrustMark Interactive Explorer) */}
        {activeView === "sandbox" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  Live API Sandbox & Explorer
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uji coba langsung pemanggilan endpoint API dengan berbagai metode autentikasi SPLP secara real-time.
                </p>
              </div>
              <button
                onClick={() => setActiveView("catalog")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium border border-slate-800 transition-colors"
              >
                ← Kembali ke Katalog
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Konfigurasi Request */}
              <div className="lg:col-span-6 space-y-5">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                  {/* Service Selector Tabs */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Pilih Layanan API:</label>
                    <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-medium">
                      <button
                        onClick={() => setActiveTab("nop")}
                        className={`py-2 rounded-xl transition-all ${activeTab === "nop" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Detail NOP
                      </button>
                      <button
                        onClick={() => setActiveTab("sppt")}
                        className={`py-2 rounded-xl transition-all ${activeTab === "sppt" ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        SPPT
                      </button>
                      <button
                        onClick={() => setActiveTab("znt")}
                        className={`py-2 rounded-xl transition-all ${activeTab === "znt" ? "bg-amber-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        ZNT & NIR
                      </button>
                      <button
                        onClick={() => setActiveTab("bpn")}
                        className={`py-2 rounded-xl transition-all ${activeTab === "bpn" ? "bg-cyan-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Validasi BPN
                      </button>
                      <button
                        onClick={() => setActiveTab("token")}
                        className={`py-2 rounded-xl transition-all ${activeTab === "token" ? "bg-indigo-500 text-white font-bold shadow" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        OAuth2
                      </button>
                    </div>
                  </div>

                  {/* Authentication Mode Box */}
                  {activeTab !== "token" && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Mode Autentikasi SPLP
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setAuthMode("apikey")}
                          className={`py-2 px-2 rounded-xl border text-center transition-all ${authMode === "apikey"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                          API Key
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMode("bearer")}
                          className={`py-2 px-2 rounded-xl border text-center transition-all ${authMode === "bearer"
                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                          OAuth2 Bearer
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMode("none")}
                          className={`py-2 px-2 rounded-xl border text-center transition-all ${authMode === "none"
                            ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          title="Uji respon 401 Unauthorized"
                        >
                          Tanpa Auth (401)
                        </button>
                      </div>

                      {authMode === "apikey" && (
                        <div>
                          <label className="text-[11px] text-slate-400 mb-1 block">X-API-Key</label>
                          <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {authMode === "bearer" && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Authorization: Bearer &lt;token&gt;</span>
                            {!bearerToken && (
                              <span className="text-amber-400 text-[10px]">Klik 'Dapatkan Token' jika belum ada</span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={bearerToken}
                              onChange={(e) => setBearerToken(e.target.value)}
                              placeholder="Bearer eyJhbGciOi..."
                              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 truncate"
                            />
                            <button
                              type="button"
                              onClick={handleFetchToken}
                              disabled={loading}
                              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-indigo-600/20"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Token
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Parameters Sesuai Tab */}
                  {activeTab === "token" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-300 font-medium">Client ID</label>
                        <input
                          type="text"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 font-medium">Client Secret</label>
                        <input
                          type="password"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300"
                        />
                      </div>
                    </div>
                  ) : activeTab === "bpn" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-300 font-medium">18 Digit NOP SISMIOP</label>
                        <input
                          type="text"
                          value={testNop}
                          onChange={(e) => setTestNop(e.target.value)}
                          className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-300 font-medium">NIB (Nomor Identifikasi Bidang)</label>
                          <input
                            type="text"
                            value={nib}
                            onChange={(e) => setNib(e.target.value)}
                            className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-300 font-medium">Nomor Hak / Sertipikat</label>
                          <input
                            type="text"
                            value={nomorHak}
                            onChange={(e) => setNomorHak(e.target.value)}
                            className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 font-medium">Luas Tanah Ukur BPN (m²)</label>
                        <input
                          type="number"
                          value={luasTanahBpn}
                          onChange={(e) => setLuasTanahBpn(e.target.value)}
                          className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-medium">Nomor Objek Pajak (18 Digit NOP)</label>
                      <input
                        type="text"
                        value={testNop}
                        onChange={(e) => setTestNop(e.target.value)}
                        placeholder="18 Digit Angka NOP..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={() => handleTestApi(activeTab)}
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memproses Query Oracle...</span>
                      </>
                    ) : activeTab === "token" ? (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Terbitkan OAuth2 Access Token</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Eksekusi Permintaan API</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code Snippet Generator Tabs */}
                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      Cuplikan Kode Klien (SDK Code Snippet)
                    </span>
                    <div className="flex gap-1 text-[11px]">
                      {(["curl", "fetch", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setCodeLanguage(lang)}
                          className={`px-2.5 py-1 rounded-lg font-mono uppercase transition-colors ${codeLanguage === lang ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700" : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    {getCodeSnippet(codeLanguage)}
                  </pre>
                </div>
              </div>

              {/* Response Visualizer */}
              <div className="lg:col-span-6 space-y-5">
                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Inspektur Respon API</h3>
                      {responseTime !== null && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
                          {responseTime} ms
                        </span>
                      )}
                    </div>
                    {apiResponse && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${apiResponse.status === "SUCCESS"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : apiResponse.status === "UNAUTHORIZED"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                      >
                        Status: {apiResponse.statusCode || apiResponse.status || (apiResponse.access_token ? "200 OK" : "ERROR")}
                      </span>
                    )}
                  </div>

                  {/* Formatted View jika berhasil */}
                  {apiResponse?.data && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                      <div className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                        <span>Ringkasan Data Terverifikasi</span>
                        <span className="font-mono text-slate-400">{apiResponse.data.nop || apiResponse.data.nop_raw}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {apiResponse.data.nama_wp || apiResponse.data.nm_wp ? (
                          <div>
                            <span className="text-slate-500 block">Nama Wajib Pajak:</span>
                            <span className="font-semibold text-white">{apiResponse.data.nama_wp || apiResponse.data.nm_wp}</span>
                          </div>
                        ) : null}

                        {apiResponse.data.alamat_op ? (
                          <div>
                            <span className="text-slate-500 block">Alamat Objek Pajak:</span>
                            <span className="font-semibold text-white">{apiResponse.data.alamat_op}</span>
                          </div>
                        ) : null}

                        {apiResponse.data.rekap_bumi ? (
                          <>
                            <div>
                              <span className="text-slate-500 block">Kode ZNT & NIR:</span>
                              <span className="font-bold text-amber-400">
                                {apiResponse.data.rekap_bumi.kode_znt_utama} (Rp {apiResponse.data.rekap_bumi.nir_utama_rupiah?.toLocaleString("id-ID") || "-"} / m²)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Total Luas & NJOP Bumi:</span>
                              <span className="font-semibold text-white">
                                {apiResponse.data.rekap_bumi.total_luas_bumi} m² (Rp {apiResponse.data.rekap_bumi.total_njop_bumi?.toLocaleString("id-ID")})
                              </span>
                            </div>
                          </>
                        ) : null}

                        {apiResponse.data.ringkasan ? (
                          <>
                            <div>
                              <span className="text-slate-500 block">Total Ketetapan SPPT:</span>
                              <span className="font-semibold text-white">
                                Rp {apiResponse.data.ringkasan.total_ketetapan?.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Status Tunggakan:</span>
                              <span className={`font-bold ${apiResponse.data.ringkasan.total_tunggakan === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {apiResponse.data.ringkasan.status_keseluruhan}
                              </span>
                            </div>
                          </>
                        ) : null}

                        {apiResponse.data.komparasi_luas ? (
                          <>
                            <div>
                              <span className="text-slate-500 block">Status Kesesuaian BPN:</span>
                              <span className="font-bold text-cyan-400">
                                {apiResponse.data.komparasi_luas.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Selisih Luas Ukur:</span>
                              <span className="font-semibold text-white">
                                {apiResponse.data.komparasi_luas.selisih_m2} m² ({apiResponse.data.komparasi_luas.persentase_selisih})
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON Code Viewer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Payload Respon JSON Mentah:</span>
                      {apiResponse && (
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2), "json_res")}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedEndpoint === "json_res" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Salin JSON
                        </button>
                      )}
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[360px] leading-relaxed select-all">
                      {apiResponse
                        ? JSON.stringify(apiResponse, null, 2)
                        : `// Klik tombol 'Eksekusi Permintaan API' untuk melihat respon JSON real-time dari database Oracle SISMIOP.`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Kamus Status Kode SPLP */}
        {activeView === "codes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Kamus Standar Respon & Kode Error SPLP
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format dan spesifikasi status HTTP code yang dikembalikan oleh Gateway API SISMIOP & BPN.
                </p>
              </div>
              <button
                onClick={() => setActiveView("catalog")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium border border-slate-800 transition-colors"
              >
                ← Kembali ke Katalog
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4">HTTP Status</th>
                    <th className="py-3 px-4">Kode SPLP</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Tindakan Solusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-bold text-emerald-400">200 OK</td>
                    <td className="py-3 px-4 text-emerald-300">SPLP-200</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">SUCCESS</td>
                    <td className="py-3 px-4 font-sans">Permintaan berhasil diproses dan data ditemukan.</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Konsumsi data pada properti <code>data</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-amber-400">400 Bad Request</td>
                    <td className="py-3 px-4 text-amber-300">SPLP-400</td>
                    <td className="py-3 px-4 font-bold text-amber-400">BAD_REQUEST</td>
                    <td className="py-3 px-4 font-sans">Format NOP tidak valid (harus 18 digit angka) atau parameter kurang.</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Periksa format NOP dan parameter payload.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-amber-400">401 Unauthorized</td>
                    <td className="py-3 px-4 text-amber-300">SPLP-401</td>
                    <td className="py-3 px-4 font-bold text-amber-400">UNAUTHORIZED</td>
                    <td className="py-3 px-4 font-sans">API Key tidak valid atau Bearer JWT token kadaluarsa.</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Sertakan header <code>X-API-Key</code> atau request token baru via <code>/api/v1/auth/token</code>.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-rose-400">403 Forbidden</td>
                    <td className="py-3 px-4 text-rose-300">SPLP-403</td>
                    <td className="py-3 px-4 font-bold text-rose-400">FORBIDDEN</td>
                    <td className="py-3 px-4 font-sans">Kredensial tidak memiliki hak akses atau sertifikat mTLS ditolak.</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Hubungi Administrator Bapenda/BPN untuk otorisasi scope.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-amber-400">404 Not Found</td>
                    <td className="py-3 px-4 text-amber-300">SPLP-404</td>
                    <td className="py-3 px-4 font-bold text-amber-400">NOT_FOUND</td>
                    <td className="py-3 px-4 font-sans">NOP objek pajak tidak terdaftar di basis data Oracle SISMIOP.</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Verifikasi NOP dengan berkas fisik SPPT/DHKP.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-rose-400">500 Server Error</td>
                    <td className="py-3 px-4 text-rose-300">SPLP-500</td>
                    <td className="py-3 px-4 font-bold text-rose-400">ERROR</td>
                    <td className="py-3 px-4 font-sans">Koneksi database Oracle timeout atau kesalahan internal server.</td>
                    <td className="py-3 px-4 font-sans text-slate-400">Hubungi administrator infrastruktur SISMIOP.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>© 2026 Dikembangkan oleh Tim TI Kabupaten Tapanuli Selatan. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="/api/v1/docs/openapi.json" target="_blank" className="hover:text-white">Dokumentasi OpenAPI</a>
            <span>•</span>
            <span className="font-mono">v1.0.0-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
