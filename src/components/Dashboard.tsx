import React from "react";
import { 
  Download, Music, Video, HardDrive, RefreshCw, Star, Play, History, ArrowRight, FileVideo, FileAudio, Eye
} from "lucide-react";
import { ActiveTab, MediaFile } from "../types";

interface DashboardProps {
  stats: {
    totalDownloads: number;
    totalVideos: number;
    totalAudios: number;
    totalFolders: number;
    totalPlaylists: number;
    totalFavorites: number;
    storageUsed: string;
    storageFree: string;
    storageLimit: string;
    percentageUsed: number;
  } | null;
  history: any[];
  recentPlayed: MediaFile[];
  downloads: any[];
  setActiveTab: (tab: ActiveTab) => void;
  onPlayMedia: (file: MediaFile) => void;
  theme: "light" | "dark";
}

export default function Dashboard({ 
  stats, 
  history, 
  recentPlayed, 
  downloads,
  setActiveTab,
  onPlayMedia,
  theme
}: DashboardProps) {
  const isDark = theme === "dark";

  // Quick stats models
  const dashboardStats = [
    {
      label: "Downloads Totais",
      value: stats?.totalDownloads ?? 0,
      icon: Download,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/10",
      tab: "downloads" as ActiveTab
    },
    {
      label: "Arquivos de Vídeo",
      value: stats?.totalVideos ?? 0,
      icon: Video,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
      tab: "videos" as ActiveTab
    },
    {
      label: "Arquivos de Áudio",
      value: stats?.totalAudios ?? 0,
      icon: Music,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/10",
      tab: "audios" as ActiveTab
    },
    {
      label: "Favoritos",
      value: stats?.totalFavorites ?? 0,
      icon: Star,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/10",
      tab: "favoritos" as ActiveTab
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(stat.tab)}
              className={`p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isDark 
                  ? "bg-slate-900/40 border-slate-800 hover:border-slate-700/80" 
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {stat.label}
                </p>
                <div className={`p-2 rounded-xl border ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <h3 className="text-3xl font-extrabold tracking-tight">{stat.value}</h3>
                <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-bold">Ativo</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Primary Bento Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Storage Stats Box (Large Bento column) */}
        <div className={`lg:col-span-2 rounded-3xl border p-6 flex flex-col justify-between ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-500" />
                Uso de Disco & Armazenamento
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">
                Plano Gratuito
              </span>
            </div>
            
            <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Sua biblioteca do MediaHub armazena arquivos localmente e em nuvem privada. Gerencie seu limite para manter downloads rápidos e conversões de mídia otimizadas.
            </p>

            <div className="space-y-4">
              {/* Detailed Progress Bars */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Espaço Utilizado</span>
                  <span className="text-blue-500 font-mono">{stats?.storageUsed || "0 MB"}</span>
                </div>
                <div className="h-3 w-full bg-slate-800/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.percentageUsed ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium pt-2">
                <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                  <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Espaço Livre</span>
                  <span className="text-emerald-500 text-sm font-bold font-mono">{stats?.storageFree || "2.0 GB"}</span>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                  <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Armazenamento Total</span>
                  <span className="text-blue-500 text-sm font-bold font-mono">{stats?.storageLimit || "2.0 GB"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40 flex justify-between items-center text-xs">
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>Sincronizado automaticamente</span>
            <button 
              onClick={() => setActiveTab("biblioteca")}
              className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1.5 transition-colors"
            >
              Organizar arquivos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shortcuts & Fast Actions Bento Box */}
        <div className={`rounded-3xl border p-6 flex flex-col justify-between ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-500" />
              Ações Rápidas
            </h2>
            <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Use atalhos automatizados para otimizar suas mídias salvas.
            </p>
            
            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveTab("downloads")}
                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between hover:translate-x-1 ${
                  isDark ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Baixar novo arquivo</span>
                <Download className="w-4 h-4 text-blue-500" />
              </button>
              
              <button 
                onClick={() => setActiveTab("conversoes")}
                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between hover:translate-x-1 ${
                  isDark ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Conversão de formatos</span>
                <RefreshCw className="w-4 h-4 text-purple-500" />
              </button>
              
              <button 
                onClick={() => setActiveTab("biblioteca")}
                className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between hover:translate-x-1 ${
                  isDark ? "bg-slate-900/40 border-slate-800 hover:bg-slate-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Gerenciar Pastas</span>
                <History className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/40 text-center">
            <span className="text-[10px] text-slate-500 font-mono">FFmpeg integration v6.1 • Active API</span>
          </div>
        </div>
      </div>

      {/* Recents Rows Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recently Played files */}
        <div className={`rounded-3xl border p-6 ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
              Últimos Arquivos Reproduzidos
            </h3>
            <button 
              onClick={() => setActiveTab("biblioteca")}
              className="text-xs font-bold text-blue-500 hover:underline uppercase"
            >
              Ver biblioteca
            </button>
          </div>

          {recentPlayed.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed ${
              isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
            }`}>
              <p className="text-sm">Nenhum arquivo reproduzido recentemente.</p>
              <p className="text-xs mt-1">Baixe mídias ou importe músicas para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPlayed.slice(0, 4).map((file) => (
                <div 
                  key={file.id} 
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isDark ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40" : "bg-slate-50 border-slate-150 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={file.thumbnail} 
                      alt={file.title} 
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700/20" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate pr-2">{file.title}</h4>
                      <p className={`text-[10px] flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {file.type === "video" ? (
                          <FileVideo className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <FileAudio className="w-3 h-3 text-purple-500" />
                        )}
                        <span>{file.format} • {file.duration} • {file.fileSize}</span>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => onPlayMedia(file)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow transition-all active:scale-95"
                    title="Reproduzir Mídia"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent logs and audit activities */}
        <div className={`rounded-3xl border p-6 ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Atividades Recentes
            </h3>
            <button 
              onClick={() => setActiveTab("historico")}
              className="text-xs font-bold text-blue-500 hover:underline uppercase"
            >
              Ver histórico completo
            </button>
          </div>

          {history.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border border-dashed ${
              isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
            }`}>
              <p className="text-sm">Nenhum log de atividades registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 4).map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.action === "download" ? "bg-blue-500" :
                    item.action === "conversion" ? "bg-purple-500" :
                    item.action === "playback" ? "bg-emerald-500" : "bg-slate-400"
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.details}</p>
                    <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
