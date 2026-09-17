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
} from "lucide-react";

export default function Home() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [testNop, setTestNop] = useState("120301005600400580");
  const [activeTab, setActiveTab] = useState<"nop" | "sppt" | "znt" | "bpn" | "token">("nop");
  const [authMode, setAuthMode] = useState<"apikey" | "bearer" | "none">("apikey");
  const [apiKey, setApiKey] = useState("bpn-sismiop-pbb-secret-2026");
  const [bearerToken, setBearerToken] = useState("");
  const [clientId, setClientId] = useState("bpn_splp_client");
  const [clientSecret, setClientSecret] = useState("bpn_splp_secret_key_2026");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const handleFetchToken = async () => {
    setLoading(true);
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
      setApiResponse(json);
      if (json.access_token) {
        setBearerToken(json.access_token);
        setAuthMode("bearer");
      }
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestApi = async (type: string) => {
    setLoading(true);
    setApiResponse(null);
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
            nib: "10.01.05.02.01234",
            nomor_hak: "M.02154",
            luas_tanah_bpn: 157,
          }),
        };
      }

      options.headers = headers;

      const res = await fetch(url, options);
      const json = await res.json();
      setApiResponse(json);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                SISMIOP PBB & BPN
              </span>
              <span className="text-xs text-slate-400 ml-2 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                SPLP Secured v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Oracle SISMIOP Connected
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Standar Keamanan SPLP (API Key, OAuth2, HMAC, mTLS)
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Dokumentasi API Basis Data <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Oracle SISMIOP PBB & BPN
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              API terstandarisasi untuk integrasi data master objek pajak PBB, riwayat SPPT & tagihan, Zona Nilai Tanah (ZNT), dan validasi bidang tanah BPN dengan proteksi autentikasi SPLP.
            </p>
          </div>
        </div>

        {/* Interactive API Explorer & Endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Endpoints List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Daftar Endpoint API
              </h2>
              <span className="text-xs text-slate-400">Base URL: /api/v1</span>
            </div>

            {/* Endpoint Item 0: OAuth2 Token */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/50 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    POST
                  </span>
                  <span className="font-mono font-medium text-slate-200 text-sm">
                    /api/v1/auth/token
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    SPLP OAuth2
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard("/api/v1/auth/token", "token")}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  title="Copy Path"
                >
                  {copiedEndpoint === "token" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menerbitkan Bearer Access Token (JWT) standar SPLP menggunakan kredensial client (Client ID & Client Secret).
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-slate-500">Payload: client_id, client_secret, grant_type</span>
                <button
                  onClick={() => { setActiveTab("token"); handleFetchToken(); }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                >
                  Generate Token <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Endpoint Item 1: NOP */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GET
                  </span>
                  <span className="font-mono font-medium text-slate-200 text-sm">
                    /api/v1/pbb/nop/<span className="text-emerald-400">&#123;nop&#125;</span>
                  </span>
                  <span title="Protected by SPLP Auth">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard("/api/v1/pbb/nop/120301005600400580", "nop")}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  title="Copy Path"
                >
                  {copiedEndpoint === "nop" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menampilkan detail Objek Pajak (Alamat letak, Luas Bumi, Luas Bangunan, Total NJOP) dan identitas Wajib Pajak berdasarkan 18 digit NOP.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-slate-500">Tabel: DAT_OBJEK_PAJAK, DAT_SUBJEK_PAJAK, REF_KECAMATAN</span>
                <button
                  onClick={() => { setActiveTab("nop"); handleTestApi("nop"); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                >
                  Uji Endpoint <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Endpoint Item 2: SPPT */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GET
                  </span>
                  <span className="font-mono font-medium text-slate-200 text-sm">
                    /api/v1/pbb/sppt/<span className="text-emerald-400">&#123;nop&#125;</span>
                  </span>
                  <span title="Protected by SPLP Auth">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard("/api/v1/pbb/sppt/120301005600400580", "sppt")}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  title="Copy Path"
                >
                  {copiedEndpoint === "sppt" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menampilkan seluruh riwayat ketetapan SPPT tahunan, status lunas/tunggakan, tanggal jatuh tempo, dan tanggal bayar.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-slate-500">Tabel: SPPT, PEMBAYARAN_SPPT</span>
                <button
                  onClick={() => { setActiveTab("sppt"); handleTestApi("sppt"); }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                >
                  Uji Endpoint <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Endpoint Item 3: ZNT */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    GET
                  </span>
                  <span className="font-mono font-medium text-slate-200 text-sm">
                    /api/v1/pbb/znt/<span className="text-amber-400">&#123;nop&#125;</span>
                  </span>
                  <span title="Protected by SPLP Auth">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard("/api/v1/pbb/znt/120301005600400580", "znt")}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  title="Copy Path"
                >
                  {copiedEndpoint === "znt" ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menampilkan Zona Nilai Tanah (ZNT), Nilai Indikasi Rata-rata (NIR), rincian bidang bumi, dan estimasi NJOP per m² dari database SISMIOP.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-slate-500">Tabel: DAT_OP_BUMI, DAT_NIR, DAT_ZNT, REF_KECAMATAN</span>
                <button
                  onClick={() => { setActiveTab("znt"); handleTestApi("znt"); }}
                  className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
                >
                  Uji Endpoint <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Endpoint Item 4: BPN Validasi */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    POST
                  </span>
                  <span className="font-mono font-medium text-slate-200 text-sm">
                    /api/v1/pbb/bpn-validasi
                  </span>
                  <span title="Protected by SPLP Auth">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard("/api/v1/pbb/bpn-validasi", "bpn")}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  title="Copy Path"
                >
                  {copiedEndpoint === "bpn" ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validasi pencocokan otomatis antara data bidang tanah BPN (NIB, Luas Ukur) dengan data SISMIOP PBB untuk penerbitan sertipikat / BPHTB.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-slate-500">Payload: nop, nib, nomor_hak, luas_tanah_bpn</span>
                <button
                  onClick={() => { setActiveTab("bpn"); handleTestApi("bpn"); }}
                  className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                >
                  Uji Endpoint <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Tester */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  Live API Tester
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Key className="w-3 h-3" /> SPLP Auth
                </span>
              </div>

              {/* Authentication Selector */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Metode Autentikasi SPLP:
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode("apikey")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all ${
                      authMode === "apikey"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    API Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("bearer")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all ${
                      authMode === "bearer"
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    OAuth2 Bearer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("none")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all ${
                      authMode === "none"
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                    title="Uji respon 401 Unauthorized"
                  >
                    Tanpa Auth (401)
                  </button>
                </div>

                {authMode === "apikey" && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="X-API-Key"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {authMode === "bearer" && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="Bearer JWT Token..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 truncate"
                      />
                      <button
                        type="button"
                        onClick={handleFetchToken}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1"
                        title="Dapatkan Token Baru"
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Token
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Endpoint Tabs */}
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setActiveTab("nop")}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === "nop"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Detail NOP
                </button>
                <button
                  onClick={() => setActiveTab("sppt")}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === "sppt"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  SPPT
                </button>
                <button
                  onClick={() => setActiveTab("znt")}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === "znt"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ZNT
                </button>
                <button
                  onClick={() => setActiveTab("bpn")}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === "bpn"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  BPN
                </button>
                <button
                  onClick={() => setActiveTab("token")}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    activeTab === "token"
                      ? "bg-indigo-500 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  OAuth2
                </button>
              </div>

              {/* Inputs */}
              {activeTab === "token" ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400">Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Client Secret</label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Nomor Objek Pajak (18 Digit NOP)</label>
                  <input
                    type="text"
                    value={testNop}
                    onChange={(e) => setTestNop(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              )}

              <button
                onClick={() => handleTestApi(activeTab)}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Memproses Autentikasi & Query..." : activeTab === "token" ? "Request OAuth2 Token" : "Jalankan Query API Terproteksi"}
              </button>

              {/* Response Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Respon JSON Real-Time</span>
                  {apiResponse && (
                    <span className={apiResponse.status === "SUCCESS" ? "text-emerald-400" : apiResponse.status === "UNAUTHORIZED" ? "text-amber-400" : "text-rose-400"}>
                      Status: {apiResponse.status || apiResponse.statusCode || (apiResponse.access_token ? "TOKEN_ISSUED" : "COMPLETED")}
                    </span>
                  )}
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                  {apiResponse
                    ? JSON.stringify(apiResponse, null, 2)
                    : `// Klik tombol 'Jalankan Query API' untuk melihat respon JSON.`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
