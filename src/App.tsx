import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import DownloadManager from "./components/DownloadManager";
import LibraryManager from "./components/LibraryManager";
import MediaConverter from "./components/MediaConverter";
import HistoryLogs from "./components/HistoryLogs";
import UserSettings from "./components/UserSettings";
import AdminPanel from "./components/AdminPanel";
import AuthScreens from "./components/AuthScreens";
import MediaPlayers from "./components/MediaPlayers";
import { ActiveTab, MediaFile, Download, Folder, Playlist, Tag } from "./types";
import { Sun, Moon, Menu } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("mh_token"));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("mh_user") || "null"));
  
  // App Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Server managed State Collections
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState<any>(null);

  // Active playing media
  const [playingMedia, setPlayingMedia] = useState<MediaFile | null>(null);

  // Sync state from server
  const fetchLibraryData = async () => {
    if (!token) return;

    try {
      // 1. Fetch files
      const filesRes = await fetch("/api/library/files", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (filesRes.ok) {
        const filesData = await filesRes.ok ? await filesRes.json() : [];
        setFiles(filesData);
      }

      // 2. Fetch folders
      const foldersRes = await fetch("/api/library/folders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      }

      // 3. Fetch playlists
      const playlistsRes = await fetch("/api/library/playlists", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        setPlaylists(playlistsData);
      }

      // 4. Fetch tags
      const tagsRes = await fetch("/api/library/tags", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }

      // 5. Fetch downloads list
      const downloadsRes = await fetch("/api/downloads", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (downloadsRes.ok) {
        const downloadsData = await downloadsRes.json();
        setDownloads(downloadsData);
      }

      // 6. Fetch user log history
      const historyRes = await fetch("/api/auth/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      // 7. Fetch storage usage
      const storageRes = await fetch("/api/library/storage-stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (storageRes.ok) {
        const storageData = await storageRes.json();
        setStorageStats(storageData);
      }

    } catch (err) {
      console.error("Erro ao sincronizar dados com o servidor:", err);
    }
  };

  // Poll downloads and library elements periodically
  useEffect(() => {
    if (token) {
      fetchLibraryData();
      const interval = setInterval(() => {
        fetchLibraryData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Handle successful login/registration
  const handleLoginSuccess = (newToken: string, loggedUser: any) => {
    localStorage.setItem("mh_token", newToken);
    localStorage.setItem("mh_user", JSON.stringify(loggedUser));
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab("inicio");
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("mh_token");
    localStorage.removeItem("mh_user");
    setToken(null);
    setUser(null);
    setPlayingMedia(null);
  };

  // Clearing audit history
  const handleClearHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/history", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLibraryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Retrieve play history
  const recentPlayedFiles = files.filter(f => f.playCount > 0).sort((a, b) => b.playCount - a.playCount);

  // Triggering Media play increments count
  const handlePlayMedia = async (file: MediaFile) => {
    setPlayingMedia(file);
    if (!token) return;
    try {
      await fetch(`/api/library/files/${file.id}/play`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchLibraryData();
    } catch (err) {
      console.error(err);
    }
  };

  // CSS theme settings
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // If user is not authenticated, show premium auth screens
  if (!token) {
    return <AuthScreens onLoginSuccess={handleLoginSuccess} theme={theme} />;
  }

  const isDark = theme === "dark";

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
      isDark ? "bg-[#0b0f19] text-slate-100" : "bg-[#f1f5f9] text-slate-800"
    }`}>
      
      {/* Sidebar Navigation Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        storageStats={storageStats}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        theme={theme}
      />

      {/* Main Panel Content Scroll Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Navigation/Header bar */}
        <header className={`px-6 py-4 flex items-center justify-between shrink-0 border-b ${
          isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center gap-3">
            {/* Hamburger button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h1 className="text-lg font-extrabold capitalize tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              {activeTab === "inicio" ? "Painel Geral" : activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick action buttons */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Alternar Tema"
            >
              {isDark ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <span className="text-xs font-mono font-semibold opacity-60 hidden sm:inline">
              UTC Connection: Stable
            </span>
          </div>
        </header>

        {/* Scrollable body page router */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
          
          {activeTab === "inicio" && (
            <Dashboard 
              stats={storageStats} 
              history={history} 
              recentPlayed={recentPlayedFiles} 
              downloads={downloads}
              setActiveTab={setActiveTab}
              onPlayMedia={handlePlayMedia}
              theme={theme}
            />
          )}

          {activeTab === "downloads" && (
            <DownloadManager 
              downloads={downloads} 
              onRefreshStats={fetchLibraryData} 
              token={token}
              theme={theme}
              onPlayMedia={handlePlayMedia}
            />
          )}

          {activeTab === "audios" && (
            <LibraryManager 
              files={files} 
              folders={folders} 
              playlists={playlists}
              tags={tags}
              onRefreshStats={fetchLibraryData} 
              onPlayMedia={handlePlayMedia}
              token={token}
              theme={theme}
              initialSubTab="audios"
            />
          )}

          {activeTab === "videos" && (
            <LibraryManager 
              files={files} 
              folders={folders} 
              playlists={playlists}
              tags={tags}
              onRefreshStats={fetchLibraryData} 
              onPlayMedia={handlePlayMedia}
              token={token}
              theme={theme}
              initialSubTab="videos"
            />
          )}

          {activeTab === "conversoes" && (
            <MediaConverter 
              files={files} 
              onRefreshStats={fetchLibraryData} 
              token={token}
              theme={theme}
            />
          )}

          {activeTab === "biblioteca" && (
            <LibraryManager 
              files={files} 
              folders={folders} 
              playlists={playlists}
              tags={tags}
              onRefreshStats={fetchLibraryData} 
              onPlayMedia={handlePlayMedia}
              token={token}
              theme={theme}
              initialSubTab="all"
            />
          )}

          {activeTab === "favoritos" && (
            <LibraryManager 
              files={files} 
              folders={folders} 
              playlists={playlists}
              tags={tags}
              onRefreshStats={fetchLibraryData} 
              onPlayMedia={handlePlayMedia}
              token={token}
              theme={theme}
              initialSubTab="favorites"
            />
          )}

          {activeTab === "historico" && (
            <HistoryLogs 
              history={history} 
              onClearHistory={handleClearHistory} 
              theme={theme}
            />
          )}

          {activeTab === "configuracoes" && (
            <UserSettings 
              user={user} 
              onUpdateUser={setUser} 
              token={token}
              theme={theme}
              setTheme={setTheme}
            />
          )}

          {activeTab === "admin" && (
            <AdminPanel 
              token={token} 
              theme={theme}
            />
          )}

        </main>

        {/* Global sticky Audio/Video Players bar at base */}
        {playingMedia && (
          <MediaPlayers 
            currentFile={playingMedia} 
            onClose={() => setPlayingMedia(null)} 
            playlistFiles={files.filter(f => !f.isDeleted)}
            theme={theme}
          />
        )}

      </div>

    </div>
  );
}
