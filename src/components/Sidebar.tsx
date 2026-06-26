import React from "react";
import { 
  Home, Download, Music, Video, RefreshCw, FolderOpen, Heart, History, HardDrive, Settings, ShieldCheck, LogOut, Menu, X 
} from "lucide-react";
import { ActiveTab } from "../types";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  storageStats: {
    storageUsed: string;
    storageFree: string;
    storageLimit: string;
    percentageUsed: number;
  } | null;
  user: any;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  theme: "light" | "dark";
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  storageStats, 
  user, 
  onLogout, 
  isOpen, 
  setIsOpen,
  theme
}: SidebarProps) {
  const isDark = theme === "dark";

  const menuItems = [
    { id: "inicio" as ActiveTab, label: "Início", icon: Home },
    { id: "downloads" as ActiveTab, label: "Downloads", icon: Download },
    { id: "audios" as ActiveTab, label: "Áudios", icon: Music },
    { id: "videos" as ActiveTab, label: "Vídeos", icon: Video },
    { id: "conversoes" as ActiveTab, label: "Conversões", icon: RefreshCw },
    { id: "biblioteca" as ActiveTab, label: "Biblioteca", icon: FolderOpen },
    { id: "favoritos" as ActiveTab, label: "Favoritos", icon: Heart },
    { id: "historico" as ActiveTab, label: "Histórico", icon: History },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsOpen(false); // Close mobile drawer on selection
  };

  const percentUsed = storageStats?.percentageUsed ?? 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Logo and Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">MediaHub</h1>
            <p className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider">Download & Convert</p>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Admin Navigation (Conditional) */}
        {user?.isAdmin && (
          <button
            onClick={() => handleTabClick("admin")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all mt-4 ${
              activeTab === "admin"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-purple-400 hover:bg-purple-500/10 hover:text-purple-200"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold">Painel Admin</span>
          </button>
        )}

        {/* Separator */}
        <div className="h-[1px] bg-slate-800/80 my-5"></div>

        {/* Storage Bento Card */}
        <div className="px-4 py-3 bg-slate-900/60 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Armazenamento</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 85 ? "bg-red-500" : percentUsed > 60 ? "bg-amber-500" : "bg-blue-500"
              }`} 
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {storageStats?.storageUsed || "0 MB"} de {storageStats?.storageLimit || "2.0 GB"}
          </p>
        </div>
      </nav>

      {/* User Session Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800/60 mb-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || "MH"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Usuário"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.isAdmin ? "Administrador" : "Plano Premium"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTabClick("configuracoes")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === "configuracoes"
                ? "bg-slate-700 text-white"
                : "bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
            <span>Config</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-xl text-xs font-medium transition-all"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#020617] border-r border-slate-800/80 flex-col p-6 shrink-0 h-screen select-none text-slate-100">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Back-drop / Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-[#020617] p-6 z-50 md:hidden flex flex-col transition-transform duration-300 transform border-r border-slate-800 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } text-slate-100`}>
        {sidebarContent}
      </aside>
    </>
  );
}
