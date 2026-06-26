import React, { useState } from "react";
import { History, Search, Trash2, Calendar, HardDrive, RefreshCw } from "lucide-react";

interface HistoryLogsProps {
  history: any[];
  onClearHistory: () => void;
  theme: "light" | "dark";
}

export default function HistoryLogs({ history, onClearHistory, theme }: HistoryLogsProps) {
  const [search, setSearch] = useState("");
  const isDark = theme === "dark";

  const filtered = history.filter((item) => {
    if (!search.trim()) return true;
    return item.details.toLowerCase().includes(search.toLowerCase()) || 
           item.action.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className={`p-6 rounded-3xl border ${
      isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
    }`}>
      
      {/* Header bar controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pb-4 mb-5 border-b border-slate-800/40">
        <div>
          <h2 className="text-md font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            Histórico de Operações do Usuário
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Rastreie todas as atividades realizadas na sua conta do MediaHub.
          </p>
        </div>

        <div className="flex items-center gap-2 select-none">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar registros..."
              className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all"
            title="Limpar Histórico"
          >
            Limpar Tudo
          </button>
        </div>
      </div>

      {/* Audit List */}
      {filtered.length === 0 ? (
        <div className={`p-16 text-center rounded-2xl border border-dashed ${
          isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
        }`}>
          <History className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
          <p className="text-sm">Nenhum registro de atividade encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
          {filtered.map((item) => (
            <div 
              key={item.id}
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  item.action === "download" ? "text-blue-500 bg-blue-500/10 border-blue-500/10" :
                  item.action === "conversion" ? "text-purple-500 bg-purple-500/10 border-purple-500/10" :
                  item.action === "playback" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/10" :
                  "text-slate-400 bg-slate-800/50 border-slate-800"
                }`}>
                  {item.action === "download" ? <History className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold">{item.details}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    item.action === "download" ? "text-blue-500" :
                    item.action === "conversion" ? "text-purple-500" : "text-emerald-500"
                  }`}>{item.action}</span>
                </div>
              </div>

              <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(item.createdAt).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
