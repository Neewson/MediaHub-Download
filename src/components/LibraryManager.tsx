import React, { useState } from "react";
import { 
  FolderOpen, FolderPlus, Plus, Search, Star, Trash2, Edit2, Copy, Move, Tag, Play, Check, ChevronRight, AlertTriangle, ArrowUpDown, Filter, X, Heart, Folder, Eye, Music, Video, Share2
} from "lucide-react";
import { MediaFile, Folder as FolderType, Playlist, Tag as TagType } from "../types";

interface LibraryManagerProps {
  files: MediaFile[];
  folders: FolderType[];
  playlists: Playlist[];
  tags: TagType[];
  onRefreshStats: () => void;
  onPlayMedia: (file: MediaFile) => void;
  token: string;
  theme: "light" | "dark";
  initialSubTab?: "all" | "audios" | "videos" | "favorites" | "trash" | "shared";
}

export default function LibraryManager({ 
  files, 
  folders, 
  playlists, 
  tags, 
  onRefreshStats, 
  onPlayMedia, 
  token,
  theme,
  initialSubTab = "all"
}: LibraryManagerProps) {
  const [subTab, setSubTab] = useState<"all" | "audios" | "videos" | "favorites" | "trash" | "shared">(initialSubTab);
  
  // Modals & UI states
  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Folder creation state
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Playlist state
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // File Operations state
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [fileTags, setFileTags] = useState<string[]>([]);
  const [customTagName, setCustomTagName] = useState("");
  const [customTagColor, setCustomTagColor] = useState("blue");

  // Notifications or errors
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isDark = theme === "dark";

  // Actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch("/api/library/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName, parentId: selectedFolderId })
      });
      if (!res.ok) throw new Error("Erro ao criar pasta");

      setNewFolderName("");
      setShowNewFolder(false);
      onRefreshStats();
      setMessage("Pasta criada com sucesso!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch("/api/library/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPlaylistName })
      });
      if (!res.ok) throw new Error("Erro ao criar Playlist");

      setNewPlaylistName("");
      setShowNewPlaylist(false);
      onRefreshStats();
      setMessage("Playlist criada com sucesso!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/library/files/${id}/favorite`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao favoritar");
      onRefreshStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteFile = async (id: string, permanent: boolean) => {
    try {
      const endpoint = permanent ? `/api/library/files/${id}` : `/api/library/files/${id}/trash`;
      const method = permanent ? "DELETE" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao processar exclusão");

      onRefreshStats();
      setMessage(permanent ? "Arquivo excluído permanentemente." : "Arquivo enviado para a Lixeira.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRestoreFile = async (id: string) => {
    try {
      const res = await fetch(`/api/library/files/${id}/restore`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao restaurar");

      onRefreshStats();
      setMessage("Arquivo restaurado para a Biblioteca.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopyFile = async (id: string) => {
    try {
      const res = await fetch(`/api/library/files/${id}/copy`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao duplicar");

      onRefreshStats();
      setMessage("Cópia do arquivo gerada com sucesso!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMoveFile = async (id: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/library/files/${id}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ folderId })
      });
      if (!res.ok) throw new Error("Erro ao mover arquivo");

      setShowMoveModal(false);
      onRefreshStats();
      setMessage("Arquivo movido de pasta!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTagName.trim()) return;

    try {
      const res = await fetch("/api/library/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: customTagName, color: customTagColor })
      });
      if (!res.ok) throw new Error("Erro ao criar tag");

      setCustomTagName("");
      onRefreshStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveTags = async () => {
    if (!activeFileId) return;

    try {
      const res = await fetch(`/api/library/files/${activeFileId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ tags: fileTags })
      });
      if (!res.ok) throw new Error("Erro ao salvar tags");

      setShowTagModal(false);
      onRefreshStats();
      setMessage("Tags salvas!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddFileToPlaylist = async (playlistId: string, fileId: string) => {
    try {
      const res = await fetch(`/api/library/playlists/${playlistId}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fileId })
      });
      if (!res.ok) throw new Error("Erro ao adicionar à playlist");
      onRefreshStats();
      setMessage("Mídia adicionada à playlist!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveFileFromPlaylist = async (playlistId: string, fileId: string) => {
    try {
      const res = await fetch(`/api/library/playlists/${playlistId}/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fileId })
      });
      if (!res.ok) throw new Error("Erro ao remover da playlist");
      onRefreshStats();
      setMessage("Mídia removida da playlist.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/library/playlists/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao excluir playlist");
      onRefreshStats();
      setSelectedPlaylistId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      const res = await fetch(`/api/library/folders/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao excluir pasta");
      onRefreshStats();
      setSelectedFolderId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filtering & Search algorithms
  const filteredFiles = files.filter((file) => {
    // Sub-tab category checks
    if (subTab === "trash") return file.isDeleted;
    if (file.isDeleted) return false; // Hide deleted on general views

    if (subTab === "audios" && file.type !== "audio") return false;
    if (subTab === "videos" && file.type !== "video") return false;
    if (subTab === "favorites" && !file.isFavorite) return false;
    if (subTab === "shared" && !file.isShared) return false;

    // Folder selection
    if (selectedFolderId !== null && file.folderId !== selectedFolderId) return false;
    if (selectedFolderId === null && file.folderId !== null && subTab === "all") return false;

    // Playlist constraint
    if (selectedPlaylistId) {
      const playlist = playlists.find((p) => p.id === selectedPlaylistId);
      if (!playlist || !playlist.mediaFileIds.includes(file.id)) return false;
    }

    // Text Search
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchesText = 
        file.title.toLowerCase().includes(term) ||
        file.format.toLowerCase().includes(term) ||
        file.tags.some((t) => t.toLowerCase().includes(term));
      if (!matchesText) return false;
    }

    // Format filter
    if (filterFormat && file.format.toLowerCase() !== filterFormat.toLowerCase()) return false;

    return true;
  });

  // Sorting
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "size") {
      const sizeA = parseFloat(a.fileSize) || 0;
      const sizeB = parseFloat(b.fileSize) || 0;
      return sizeB - sizeA;
    }
    return 0;
  });

  // Sub-folders in current directory
  const currentFolders = folders.filter((f) => f.parentId === selectedFolderId);

  return (
    <div className="space-y-6">
      
      {/* Alert Messaging banners */}
      {error && (
        <div className="p-4 text-xs font-semibold text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {message && (
        <div className="p-4 text-xs font-semibold text-green-500 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Grid: Left Side Navigation Categorization / Right Side Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side menu Category List (Bento card) */}
        <div className={`lg:col-span-3 p-5 rounded-3xl border space-y-5 select-none ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Biblioteca</h3>
            <div className="space-y-1">
              {[
                { id: "all", label: "Todos Arquivos", icon: FolderOpen },
                { id: "audios", label: "Áudios", icon: Music },
                { id: "videos", label: "Vídeos", icon: Video },
                { id: "favorites", label: "Favoritos", icon: Heart },
                { id: "shared", label: "Compartilhados", icon: Share2 },
                { id: "trash", label: "Lixeira", icon: Trash2 },
              ].map((category) => {
                const Icon = category.icon;
                const isActive = subTab === category.id && !selectedPlaylistId;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSubTab(category.id as any);
                      setSelectedPlaylistId(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playlists section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Playlists</h3>
              <button 
                onClick={() => setShowNewPlaylist(!showNewPlaylist)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showNewPlaylist && (
              <form onSubmit={handleCreatePlaylist} className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Nome da Playlist"
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-[11px] border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
                <button type="submit" className="p-1.5 bg-blue-600 rounded text-white"><Check className="w-3.5 h-3.5" /></button>
              </form>
            )}

            {playlists.length === 0 ? (
              <p className="text-[10px] text-slate-500">Nenhuma playlist criada.</p>
            ) : (
              <div className="space-y-1">
                {playlists.map((pl) => (
                  <div key={pl.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => {
                        setSelectedPlaylistId(pl.id);
                        setSubTab("all");
                      }}
                      className={`flex-1 text-left truncate px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedPlaylistId === pl.id
                          ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
                          : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                      }`}
                    >
                      # {pl.name}
                    </button>
                    <button 
                      onClick={() => handleDeletePlaylist(pl.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Browser Column (Large Bento card) */}
        <div className={`lg:col-span-9 p-6 rounded-3xl border ${
          isDark ? "bg-[#111827]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          
          {/* Header toolbar: Search, Filters, Creating folders, Sorting */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center pb-4 mb-5 border-b border-slate-800/40">
            
            {/* Folder path navigation */}
            <div className="flex items-center gap-1 text-xs select-none">
              <button 
                onClick={() => {
                  setSelectedFolderId(null);
                  setSelectedPlaylistId(null);
                }}
                className="text-slate-400 hover:text-blue-400 font-bold"
              >
                Raiz
              </button>
              {selectedFolderId && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-bold text-white">
                    {folders.find((f) => f.id === selectedFolderId)?.name || "Pasta"}
                  </span>
                  <button 
                    onClick={() => handleDeleteFolder(selectedFolderId)}
                    className="ml-2 p-1 text-red-400 hover:bg-red-500/10 rounded"
                    title="Excluir Pasta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {selectedPlaylistId && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-bold text-purple-400">
                    Playlist: {playlists.find((p) => p.id === selectedPlaylistId)?.name}
                  </span>
                </>
              )}
            </div>

            {/* Actions & Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar arquivos..."
                  className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              {/* Format Filter */}
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none ${
                  isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="">Todos Formatos</option>
                <option value="mp4">MP4</option>
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="mkv">MKV</option>
                <option value="flac">FLAC</option>
              </select>

              {/* Sorting Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none ${
                  isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="date">Ordenar por Data</option>
                <option value="name">Ordenar por Nome</option>
                <option value="size">Ordenar por Tamanho</option>
              </select>

              {/* Folder creating triggers */}
              <button
                onClick={() => setShowNewFolder(!showNewFolder)}
                className="p-2 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                title="Criar Pasta"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Create Folder Inline Form */}
          {showNewFolder && (
            <form onSubmit={handleCreateFolder} className="flex gap-2 p-3 bg-blue-600/5 border border-blue-500/20 rounded-2xl mb-4">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nome da Pasta..."
                className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl">
                Criar Pasta
              </button>
            </form>
          )}

          {/* Subfolders Grid */}
          {currentFolders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 select-none">
              {currentFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all hover:scale-[1.02] text-left ${
                    isDark 
                      ? "bg-slate-900/40 border-slate-800 hover:border-slate-700/60" 
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Folder className="w-8 h-8 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-500">Pasta</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Library Files Listings */}
          {sortedFiles.length === 0 ? (
            <div className={`p-16 text-center rounded-2xl border border-dashed ${
              isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
            }`}>
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">Nenhum arquivo de mídia localizado nesta área.</p>
              <p className="text-xs mt-1">Baixe um vídeo ou converta áudios para visualizar aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    isDark 
                      ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700/60" 
                      : "bg-slate-50 border-slate-150 hover:bg-slate-100"
                  }`}
                >
                  {/* File Metadata & Preview */}
                  <div className="flex gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-700/10 bg-slate-800">
                      <img src={file.thumbnail} alt={file.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 py-0.2 rounded-md text-[8px] font-mono text-white">
                        {file.duration}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate pr-3">{file.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-x-1.5 items-center font-medium">
                        <span className="text-blue-500 uppercase">{file.format}</span>
                        <span>•</span>
                        <span className="font-mono">{file.fileSize}</span>
                        <span>•</span>
                        <span className="font-mono">{file.quality}</span>
                      </p>
                      
                      {/* Active Tags list */}
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {file.tags.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!file.isDeleted ? (
                      <>
                        <button
                          onClick={() => onPlayMedia(file)}
                          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                          title="Reproduzir"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        <button
                          onClick={() => handleToggleFavorite(file.id)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            file.isFavorite
                              ? "bg-amber-500/15 border-amber-500/20 text-amber-500"
                              : "border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-white"
                          }`}
                          title="Favoritar"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Duplication duplicate file */}
                        <button
                          onClick={() => handleCopyFile(file.id)}
                          className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Move folder and tagging drawer opener */}
                        <button
                          onClick={() => {
                            setActiveFileId(file.id);
                            setShowMoveModal(true);
                          }}
                          className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all"
                          title="Mover Pasta"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveFileId(file.id);
                            setFileTags(file.tags || []);
                            setShowTagModal(true);
                          }}
                          className="p-1.5 border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all"
                          title="Adicionar Tags"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>

                        {playlists.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddFileToPlaylist(e.target.value, file.id);
                                e.target.value = "";
                              }
                            }}
                            className="p-1 border border-slate-800 hover:bg-slate-800 text-slate-400 text-[10px] rounded-lg cursor-pointer bg-slate-900"
                          >
                            <option value="">+ Playlist</option>
                            {playlists.map((pl) => (
                              <option key={pl.id} value={pl.id}>{pl.name}</option>
                            ))}
                          </select>
                        )}

                        {selectedPlaylistId && (
                          <button
                            onClick={() => handleRemoveFileFromPlaylist(selectedPlaylistId, file.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                            title="Remover da Playlist"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteFile(file.id, false)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                          title="Mover para Lixeira"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestoreFile(file.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id, true)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Move file folder selector Modal */}
      {showMoveModal && activeFileId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className={`p-6 rounded-3xl border w-full max-w-md ${isDark ? "bg-[#111827] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
            <h3 className="text-sm font-extrabold mb-3">Mover para qual pasta?</h3>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto mb-4">
              <button
                onClick={() => handleMoveFile(activeFileId, null)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 ${
                  isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <FolderOpen className="w-4 h-4 text-blue-500" />
                Raiz da Biblioteca
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleMoveFile(activeFileId, f.id)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 ${
                    isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Folder className="w-4 h-4 text-blue-500" />
                  {f.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Tagging manager Modal */}
      {showTagModal && activeFileId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`p-6 rounded-3xl border w-full max-w-lg ${isDark ? "bg-[#111827] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
            <h3 className="text-sm font-extrabold mb-3">Gerenciar Tags do Arquivo</h3>
            
            {/* Quick existing tag options checklist */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((t) => {
                const checked = fileTags.includes(t.name);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (checked) {
                        setFileTags(fileTags.filter((tag) => tag !== t.name));
                      } else {
                        setFileTags([...fileTags, t.name]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      checked
                        ? "bg-blue-600/15 border-blue-500 text-blue-400"
                        : "bg-slate-900/40 border-slate-800 text-slate-400"
                    }`}
                  >
                    {t.name}
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            {/* Form to create new tags */}
            <form onSubmit={handleAddCustomTag} className="flex gap-2 items-center mb-5 border-t border-slate-800/40 pt-4">
              <input
                type="text"
                required
                value={customTagName}
                onChange={(e) => setCustomTagName(e.target.value)}
                placeholder="Criar nova tag personal..."
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                  isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
              <select
                value={customTagColor}
                onChange={(e) => setCustomTagColor(e.target.value)}
                className={`px-2 py-1.5 rounded-lg text-xs border focus:outline-none ${
                  isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="blue">Azul</option>
                <option value="emerald">Verde</option>
                <option value="pink">Rosa</option>
                <option value="purple">Roxo</option>
                <option value="amber">Amarelo</option>
              </select>
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                Criar
              </button>
            </form>

            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowTagModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300">
                Cancelar
              </button>
              <button onClick={handleSaveTags} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl">
                Salvar Tags
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
