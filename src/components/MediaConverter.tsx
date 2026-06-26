import React, { useState } from "react";
import { 
  RefreshCw, FileAudio, FileVideo, Sliders, Play, Check, Scissors, RotateCw, VolumeX, Minimize2, Music, CheckCircle2, AlertTriangle, HelpCircle
} from "lucide-react";
import { MediaFile } from "../types";

interface MediaConverterProps {
  files: MediaFile[];
  onRefreshStats: () => void;
  token: string;
  theme: "light" | "dark";
}

export default function MediaConverter({ files, onRefreshStats, token, theme }: MediaConverterProps) {
  const [selectedFileId, setSelectedFileId] = useState("");
  const [mode, setMode] = useState<"convert" | "edit">("convert");

  // Conversion state
  const [targetFormat, setTargetFormat] = useState("MP3");
  const [targetType, setTargetType] = useState<"audio" | "video">("audio");
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  // Quick edit state
  const [editAction, setEditAction] = useState<"crop" | "join" | "normalize" | "compress" | "rotate" | "extract_audio">("crop");
  const [cropStart, setCropStart] = useState("00:00");
  const [cropEnd, setCropEnd] = useState("01:00");
  const [rotateDegrees, setRotateDegrees] = useState("90");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isDark = theme === "dark";

  // Selected file model
  const selectedFile = files.find((f) => f.id === selectedFileId);

  // Trigger media conversion simulation
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileId || !targetFormat) return;

    setError("");
    setMessage("");
    setConverting(true);
    setConversionProgress(0);

    // Dynamic incremental progress ticks for conversion realism
    const interval = setInterval(() => {
      setConversionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 400);

    try {
      // Simulate network request after progress bar ticks
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const res = await fetch("/api/media/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: selectedFileId,
          targetFormat,
          targetType,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na conversão");

      setMessage(`Sucesso! Arquivo convertido salvo na biblioteca.`);
      onRefreshStats();
    } catch (err: any) {
      setError(err.message || "Erro ao processar conversão via FFmpeg.");
    } finally {
      clearInterval(interval);
      setConverting(false);
    }
  };

  // Trigger fast media editing simulation
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileId || !editAction) return;

    setError("");
    setMessage("");
    setConverting(true);
    setConversionProgress(0);

    const interval = setInterval(() => {
      setConversionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 15;
      });
    }, 300);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Build specific action parameters
      const params: any = {};
      if (editAction === "crop") {
        params.start = cropStart;
        params.end = cropEnd;
        params.newDuration = "01:00";
      }
      if (editAction === "rotate") {
        params.degrees = rotateDegrees;
      }

      const res = await fetch("/api/media/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fileId: selectedFileId,
          action: editAction,
          params,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao editar mídia.");

      setMessage(data.message || `Edição '${editAction}' concluída com sucesso!`);
      onRefreshStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Selector and core layout (Bento design) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left selector file bento card */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <h3 className="text-md font-bold mb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-500" />
              Selecione o Arquivo
            </h3>
            <p className={`text-xs mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Escolha qualquer arquivo de áudio ou vídeo da sua biblioteca pessoal do MediaHub para converter ou editar.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase block">Arquivo Multimídia</label>
                <select
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="">Selecione um arquivo de mídia...</option>
                  {files.filter(f => !f.isDeleted).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.format} • {f.fileSize})
                    </option>
                  ))}
                </select>
              </div>

              {selectedFile && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                  <div className="aspect-video rounded-xl overflow-hidden border border-slate-800/20">
                    <img src={selectedFile.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold truncate">{selectedFile.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">
                      {selectedFile.format} • {selectedFile.quality} • {selectedFile.duration}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800/40 text-center">
            <span className="text-[10px] text-slate-500 font-mono">FFmpeg engine dynamic worker active</span>
          </div>
        </div>

        {/* Right configuration panel (Bento design) */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          
          {/* Mode Switcher */}
          <div className="flex gap-2.5 pb-4 mb-5 border-b border-slate-800/40 select-none">
            <button
              onClick={() => setMode("convert")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "convert"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
              }`}
            >
              Conversor de Mídia
            </button>
            <button
              onClick={() => setMode("edit")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "edit"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
              }`}
            >
              Edição Rápida de Vídeo/Áudio
            </button>
          </div>

          {error && (
            <div className="p-4 mb-4 text-xs font-semibold text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-4 mb-4 text-xs font-semibold text-green-500 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {!selectedFileId ? (
            <div className={`p-16 text-center rounded-2xl border border-dashed ${
              isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
            }`}>
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
              <p className="text-sm">Por favor, escolha um arquivo de mídia para prosseguir.</p>
            </div>
          ) : (
            <>
              {mode === "convert" && (
                <form onSubmit={handleConvert} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Media conversion type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider uppercase block">Tipo de Destino</label>
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetType("audio");
                            setTargetFormat("MP3");
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            targetType === "audio"
                              ? "bg-blue-600/15 border-blue-500 text-blue-400"
                              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <FileAudio className="w-4 h-4" />
                          <span>Extrair Áudio</span>
                        </button>
                        <button
                          type="button"
                          disabled={selectedFile?.type === "audio"}
                          onClick={() => {
                            setTargetType("video");
                            setTargetFormat("MP4");
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                            targetType === "video"
                              ? "bg-blue-600/15 border-blue-500 text-blue-400"
                              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
                          }`}
                        >
                          <FileVideo className="w-4 h-4" />
                          <span>Mídia de Vídeo</span>
                        </button>
                      </div>
                    </div>

                    {/* Format selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-wider uppercase block">Formato Alvo</label>
                      <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        {targetType === "audio" ? (
                          <>
                            <option value="MP3">MP3 (Universal Compact)</option>
                            <option value="WAV">WAV (Lossless High Quality)</option>
                            <option value="FLAC">FLAC (Audiophile Lossless)</option>
                            <option value="AAC">AAC (High Definition Apple)</option>
                            <option value="OGG">OGG Vorbis</option>
                          </>
                        ) : (
                          <>
                            <option value="MP4">MP4 (MPEG-4 AVC Standard)</option>
                            <option value="MKV">MKV (Matroska Container)</option>
                            <option value="AVI">AVI (Legacy Format)</option>
                            <option value="MOV">MOV (QuickTime Movie)</option>
                          </>
                        )}
                      </select>
                    </div>

                  </div>

                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? "bg-slate-900/40 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                    <strong className="text-white block mb-1">Nota Técnica do Processamento:</strong>
                    A conversão de <span className="text-blue-500 font-bold uppercase">{selectedFile.format}</span> para <span className="text-purple-500 font-bold uppercase">{targetFormat}</span> utiliza codecs FFmpeg integrados. O processo é seguro e não causa perda de fidelidade no áudio original.
                  </div>

                  <button
                    type="submit"
                    disabled={converting}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {converting ? "Iniciando Conversor..." : "Iniciar Conversão FFmpeg"}
                  </button>
                </form>
              )}

              {mode === "edit" && (
                <form onSubmit={handleEdit} className="space-y-5 animate-fade-in">
                  
                  {/* Action switcher list */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase block">Selecione o Efeito de Edição</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
                      {[
                        { id: "crop", label: "Cortar Mídia", icon: Scissors },
                        { id: "normalize", label: "Normalizar Vol", icon: VolumeX, disabled: selectedFile.type !== "audio" },
                        { id: "compress", label: "Compactar", icon: Minimize2 },
                        { id: "rotate", label: "Girar Vídeo", icon: RotateCw, disabled: selectedFile.type !== "video" },
                        { id: "extract_audio", label: "Extrair Áudio", icon: Music, disabled: selectedFile.type !== "video" },
                      ].map((act) => {
                        const Icon = act.icon;
                        const active = editAction === act.id;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            disabled={act.disabled}
                            onClick={() => setEditAction(act.id as any)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                              active
                                ? "bg-blue-600/15 border-blue-500 text-blue-400"
                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contextual Action fields */}
                  {editAction === "crop" && (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in text-xs font-semibold">
                      <div className="space-y-1.5">
                        <label className="block text-xs text-slate-400">Tempo Inicial (MM:SS)</label>
                        <input
                          type="text"
                          required
                          value={cropStart}
                          onChange={(e) => setCropStart(e.target.value)}
                          placeholder="00:00"
                          className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs text-slate-400">Tempo Final (MM:SS)</label>
                        <input
                          type="text"
                          required
                          value={cropEnd}
                          onChange={(e) => setCropEnd(e.target.value)}
                          placeholder="01:00"
                          className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {editAction === "rotate" && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="block text-xs text-slate-400">Graus de Rotação</label>
                      <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                        {["90", "180", "270"].map((deg) => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => setRotateDegrees(deg)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              rotateDegrees === deg
                                ? "bg-blue-600/15 border-blue-500 text-blue-400"
                                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {deg}° Graus
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={converting}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {converting ? "Aplicando Efeito de Mídia..." : "Aplicar Edição Rápida"}
                  </button>

                </form>
              )}

              {/* Progress Bar of conversions */}
              {converting && (
                <div className="mt-5 p-4 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-2 animate-fade-in">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-purple-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      FFmpeg Processando Mídia...
                    </span>
                    <span className="font-mono">{conversionProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all" style={{ width: `${conversionProgress}%` }}></div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}
