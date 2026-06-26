import React, { useState, useEffect } from "react";
import { 
  Download, Search, Sparkles, FileVideo, FileAudio, Play, Pause, Trash2, X, CheckCircle2, AlertTriangle, RefreshCw
} from "lucide-react";
import { Download as DownloadType, MediaFile } from "../types";

interface DownloadManagerProps {
  downloads: DownloadType[];
  onRefreshStats: () => void;
  token: string;
  theme: "light" | "dark";
  onPlayMedia?: (file: MediaFile) => void;
}

interface AnalyzerResult {
  title: string;
  thumbnail: string;
  duration: string;
  estimatedSize: string;
  type: "audio" | "video";
  formats: {
    format: string;
    quality: string;
    size: string;
  }[];
}

export default function DownloadManager({ downloads, onRefreshStats, token, theme, onPlayMedia }: DownloadManagerProps) {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "error">("all");
  const [localDownloads, setLocalDownloads] = useState<DownloadType[]>(downloads);

  useEffect(() => {
    setLocalDownloads(downloads);
  }, [downloads]);

  // Handle URL analysis via Gemini or fallback
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError("");
    setSuccess("");
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/downloads/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao analisar o link.");

      setAnalysisResult(data);
      if (data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0]);
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível analisar este link multimídia.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Start download task
  const handleStartDownload = async () => {
    if (!analysisResult || !selectedFormat) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/downloads/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          url: url.trim(),
          title: analysisResult.title,
          thumbnail: analysisResult.thumbnail,
          duration: analysisResult.duration,
          format: selectedFormat.format,
          quality: selectedFormat.quality,
          fileSize: selectedFormat.size,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao iniciar download.");

      setSuccess(`Download de "${analysisResult.title}" foi enviado para a fila!`);
      // Reset forms
      setUrl("");
      setAnalysisResult(null);
      // Trigger update
      onRefreshStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Controls for active download actions
  const handleAction = async (id: string, action: "pause" | "resume" | "delete" | "error") => {
    try {
      let method = "POST";
      let endpoint = `/api/downloads/${id}/${action}`;
      if (action === "delete") {
        method = "DELETE";
        endpoint = `/api/downloads/${id}`;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro de requisição");
      }

      onRefreshStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredDownloads = localDownloads.filter((dl) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return dl.status === "downloading" || dl.status === "paused";
    if (activeTab === "completed") return dl.status === "completed";
    if (activeTab === "error") return dl.status === "error";
    return true;
  });

  const isDark = theme === "dark";

  return (
    <div className="space-y-6">
      
      {/* Search Analyzer Input Bento Row */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          Baixar Mídia via URL
        </h2>
        <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Insira qualquer link de vídeo (YouTube, Vimeo, Twitch) ou áudio (SoundCloud, arquivos diretos) para analisar os formatos e baixar em alta definição.
        </p>

        {/* Sandbox alert notification */}
        <div className="mb-5 p-4 text-xs text-amber-500 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-400">Modo Sandbox Ativo (Ambiente de Demonstração)</p>
            <p className={`leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Por limitações de segurança e rede no ambiente de nuvem do AI Studio (sem acesso externo direto ou DNS para resolver APIs do Cobalt/YouTube), o download de mídias externas é <strong>emulado de forma robusta e resiliente usando mídias de exemplo de alta qualidade</strong>. O app preservará os metadados (título e miniatura originais) na sua biblioteca para demonstrar o visual completo do sistema e as funcionalidades de download/player sem erros.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole uma URL (Ex: https://www.youtube.com/watch?v=...)"
              className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isDark ? "bg-slate-900/60 border-slate-800 text-white placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={analyzing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar URL"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 text-xs font-semibold text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 text-xs font-semibold text-green-500 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Analyzer Link results panel */}
      {analysisResult && (
        <div className={`p-6 rounded-3xl border grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          
          {/* Left preview (Thumbnail/Details) */}
          <div className="md:col-span-4 space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/20">
              <img 
                src={analysisResult.thumbnail} 
                alt="Miniatura" 
                className="w-full h-full object-cover" 
              />
              <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white">
                {analysisResult.duration}
              </span>
            </div>
            <div>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider ${
                analysisResult.type === "video" ? "bg-emerald-500/10 text-emerald-500" : "bg-purple-500/10 text-purple-500"
              }`}>
                {analysisResult.type === "video" ? "Mídia de Vídeo" : "Mídia de Áudio"}
              </span>
              <h3 className="text-sm font-extrabold tracking-tight mt-1.5 line-clamp-2">
                {analysisResult.title}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Tamanho Estimado: <strong className="font-mono">{analysisResult.estimatedSize}</strong>
              </p>
            </div>
          </div>

          {/* Right Format Picker Selector */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Formatos Disponíveis</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                {analysisResult.formats.map((fmt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFormat(fmt)}
                    type="button"
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedFormat === fmt
                        ? "border-blue-500 bg-blue-500/10 text-blue-400 font-bold shadow-sm"
                        : isDark
                          ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {["MP3", "WAV", "OGG", "FLAC", "AAC", "M4A"].includes(fmt.format.toUpperCase()) ? (
                        <FileAudio className="w-4 h-4 text-purple-500 shrink-0" />
                      ) : (
                        <FileVideo className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs truncate font-bold block">{fmt.format} ({fmt.quality})</span>
                        <span className={`text-[10px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{fmt.size}</span>
                      </div>
                    </div>
                    {selectedFormat === fmt && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800/40 mt-4">
              <button
                onClick={() => setAnalysisResult(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleStartDownload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                Baixar Mídia Escolhida
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Downloads Manager Queue List Bento Box */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-5 pb-4 border-b border-slate-800/40">
          <h3 className="text-md font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" />
            Fila de Downloads & Gerenciador
          </h3>

          {/* Filters tabs */}
          <div className="flex rounded-xl p-0.5 bg-slate-800/50 border border-slate-800 text-xs font-semibold">
            {(["all", "active", "completed", "error"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "all" ? "Todos" : tab === "active" ? "Ativos" : tab === "completed" ? "Concluídos" : "Erros"}
              </button>
            ))}
          </div>
        </div>

        {filteredDownloads.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border border-dashed ${
            isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
          }`}>
            <p className="text-sm">Nenhum download encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDownloads.map((dl) => (
              <div 
                key={dl.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDark 
                    ? "bg-slate-900/60 border-slate-800 hover:border-slate-700/60" 
                    : "bg-slate-50 border-slate-150 hover:bg-slate-100"
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex gap-3 min-w-0">
                    <img 
                      src={dl.thumbnail} 
                      alt={dl.title} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700/20 shrink-0" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate pr-3">{dl.title}</h4>
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-slate-500 mt-1">
                        <span className="text-blue-500 uppercase">{dl.format} ({dl.quality})</span>
                        <span>•</span>
                        <span>Tamanho: <strong className="font-mono">{dl.fileSize}</strong></span>
                        {dl.status === "downloading" && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500 font-mono">{dl.speed}</span>
                            <span>•</span>
                            <span>Tempo Restante: <strong className="font-mono">{dl.eta}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Controls */}
                  <div className="flex gap-1 shrink-0">
                    {dl.status === "completed" && onPlayMedia && (
                      <button 
                        onClick={() => {
                          const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(dl.format.toLowerCase());
                          onPlayMedia({
                            id: `media-${dl.id}`,
                            userId: dl.userId,
                            title: dl.title,
                            url: `/downloaded-media/${dl.id}.${dl.format.toLowerCase()}`,
                            thumbnail: dl.thumbnail,
                            duration: dl.duration,
                            fileSize: dl.fileSize,
                            format: dl.format,
                            quality: dl.quality,
                            type: isAudio ? "audio" : "video",
                            folderId: null,
                            tags: [],
                            isFavorite: false,
                            isShared: false,
                            isDeleted: false,
                            createdAt: dl.createdAt || new Date().toISOString()
                          });
                        }}
                        className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all"
                        title="Reproduzir arquivo concluído"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}
                    {dl.status === "downloading" && (
                      <button 
                        onClick={() => handleAction(dl.id, "pause")}
                        className="p-1.5 hover:bg-slate-800/80 hover:text-white rounded-lg text-slate-400 transition-colors"
                        title="Pausar download"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {dl.status === "paused" && (
                      <button 
                        onClick={() => handleAction(dl.id, "resume")}
                        className="p-1.5 hover:bg-slate-800/80 hover:text-white rounded-lg text-slate-400 transition-colors"
                        title="Continuar download"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {dl.status === "downloading" && (
                      <button 
                        onClick={() => handleAction(dl.id, "error")}
                        className="p-1.5 hover:bg-slate-800/80 hover:text-amber-400 rounded-lg text-slate-400 transition-colors"
                        title="Simular Erro"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleAction(dl.id, "delete")}
                      className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400 transition-colors"
                      title="Excluir download"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        dl.status === "completed" ? "bg-emerald-500" :
                        dl.status === "error" ? "bg-red-500" :
                        dl.status === "paused" ? "bg-amber-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${dl.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>
                      {dl.status === "completed" && <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 inline" /> Concluído - Armazenado na Biblioteca</span>}
                      {dl.status === "error" && <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 inline" /> {dl.errorMessage || "Erro no download"}</span>}
                      {dl.status === "paused" && <span className="text-amber-500 font-bold">Pausado</span>}
                      {dl.status === "downloading" && <span className="text-blue-500 font-bold">Baixando...</span>}
                    </span>
                    <span className="font-mono font-bold">{dl.progress}%</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
