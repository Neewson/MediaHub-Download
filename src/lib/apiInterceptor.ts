// Client-side API Interceptor for robust local persistence in ephemeral/serverless environments like Vercel.
// Intercepts all stateful API calls and handles them locally using localStorage.
// Let the stateless Gemini scraper (/api/downloads/analyze) fall through to the real server.

import { MediaFile, Download, Folder, Playlist, Tag } from "../types";

const originalFetch = window.fetch;

// Initialize default users if not present
const getLocalUsers = () => {
  const users = localStorage.getItem("mh_users_db");
  if (!users) {
    const defaults = [
      {
        id: "user-admin",
        name: "Admin MediaHub",
        email: "admin@mediahub.com",
        passwordHash: btoa("123456"),
        isAdmin: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "user-demo",
        name: "Demo User",
        email: "demo@mediahub.com",
        passwordHash: btoa("123456"),
        isAdmin: false,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem("mh_users_db", JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(users);
};

// Seed default media library for a user
const getLocalLibrary = (userId: string) => {
  const key = `mh_library_${userId}`;
  const data = localStorage.getItem(key);
  if (!data) {
    const defaultData = {
      files: [
        {
          id: `sample-video-1-${userId}`,
          userId,
          title: "Big Buck Bunny - Animação Clássica",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=60",
          duration: "09:56",
          fileSize: "120.4 MB",
          format: "MP4",
          quality: "720p",
          type: "video" as const,
          folderId: null,
          tags: ["Filme", "Estudo"],
          isFavorite: true,
          isShared: false,
          isDeleted: false,
          playCount: 1,
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: `sample-video-2-${userId}`,
          userId,
          title: "Sintel - Open Source Movie Trailer",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
          thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&auto=format&fit=crop&q=60",
          duration: "00:52",
          fileSize: "15.8 MB",
          format: "MP4",
          quality: "1080p",
          type: "video" as const,
          folderId: null,
          tags: ["Filme"],
          isFavorite: false,
          isShared: true,
          isDeleted: false,
          playCount: 0,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: `sample-audio-1-${userId}`,
          userId,
          title: "Ambient Calm Synth - Lo-Fi Chill",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60",
          duration: "06:12",
          fileSize: "8.5 MB",
          format: "MP3",
          quality: "320 kbps",
          type: "audio" as const,
          folderId: null,
          tags: ["Música", "Podcast"],
          isFavorite: true,
          isShared: false,
          isDeleted: false,
          playCount: 2,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: `sample-audio-2-${userId}`,
          userId,
          title: "Corporate Acoustic - Background Music",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60",
          duration: "07:05",
          fileSize: "9.7 MB",
          format: "MP3",
          quality: "192 kbps",
          type: "audio" as const,
          folderId: null,
          tags: ["Música"],
          isFavorite: false,
          isShared: false,
          isDeleted: false,
          playCount: 0,
          createdAt: new Date().toISOString()
        }
      ],
      folders: [
        { id: `folder-1-${userId}`, userId, name: "Aulas", parentId: null, createdAt: new Date().toISOString() },
        { id: `folder-2-${userId}`, userId, name: "Músicas Favoritas", parentId: null, createdAt: new Date().toISOString() },
        { id: `folder-3-${userId}`, userId, name: "Trabalho", parentId: null, createdAt: new Date().toISOString() }
      ],
      playlists: [] as Playlist[],
      tags: [
        { id: "tag-1", name: "Música", color: "pink" },
        { id: "tag-2", name: "Gospel", color: "emerald" },
        { id: "tag-3", name: "Aula", color: "blue" },
        { id: "tag-4", name: "Filme", color: "purple" },
        { id: "tag-5", name: "Podcast", color: "amber" },
        { id: "tag-6", name: "Estudo", color: "indigo" }
      ],
      downloads: [] as Download[],
      history: [
        { id: `hist-1-${userId}`, userId, action: "playback", details: "Reproduziu 'Ambient Calm Synth - Lo-Fi Chill'", createdAt: new Date().toISOString() }
      ]
    };
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

const saveLocalLibrary = (userId: string, data: any) => {
  localStorage.setItem(`mh_library_${userId}`, JSON.stringify(data));
};

// Calculate size statistics locally
const calculateLocalStats = (files: MediaFile[]) => {
  const nonDeleted = files.filter(f => !f.isDeleted);
  const audioCount = nonDeleted.filter(f => f.type === "audio").length;
  const videoCount = nonDeleted.filter(f => f.type === "video").length;
  
  let totalBytes = 0;
  nonDeleted.forEach((file) => {
    const match = file.fileSize.match(/^([\d.]+)\s*(MB|KB|GB)?/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = (match[2] || "MB").toUpperCase();
      if (unit === "GB") totalBytes += num * 1024 * 1024 * 1024;
      else if (unit === "MB") totalBytes += num * 1024 * 1024;
      else if (unit === "KB") totalBytes += num * 1024;
      else totalBytes += num;
    }
  });

  const formattedSize = totalBytes >= 1024 * 1024 * 1024
    ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;

  return {
    totalSize: formattedSize,
    audioCount,
    videoCount,
    totalCount: nonDeleted.length,
    maxLimit: "2.0 GB",
    percentage: Math.min(100, Math.round((totalBytes / (2.0 * 1024 * 1024 * 1024)) * 100))
  };
};

// Create a fast helper to return standard mock responses
const jsonResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

// Get the authenticated userId from token
const getUserIdFromAuth = (headers: any) => {
  const authHeader = headers?.Authorization || headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        if (token.startsWith("user-")) {
          return token;
        }
        return atob(token);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

// Active download interval simulators in browser memory
const clientActiveSimulators = new Map<string, any>();

// Intercept global fetch
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : "url" in input ? (input.url as string) : input.toString();
  const urlPath = urlStr.split("?")[0];
  const method = init?.method?.toUpperCase() || "GET";

  // Check if this is an API route (excluding the stateless analyzer and static media server)
  if (urlStr.startsWith("/api/") && !urlStr.includes("/api/downloads/analyze") && !urlStr.includes("/downloaded-media")) {
    try {
      const users = getLocalUsers();
      const body = init?.body ? JSON.parse(init.body as string) : null;
      const userId = getUserIdFromAuth(init?.headers);

      // --- AUTH ENDPOINTS ---
      if (urlPath === "/api/auth/register" && method === "POST") {
        const { name, email, password } = body;
        if (!name || !email || !password) {
          return jsonResponse({ error: "Preencha todos os campos obrigatórios." }, 400);
        }
        if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
          return jsonResponse({ error: "Este e-mail já está cadastrado." }, 400);
        }

        const newId = `user-${Date.now()}`;
        const newUser = {
          id: newId,
          name,
          email,
          passwordHash: btoa(password),
          isAdmin: email.toLowerCase() === "admin@mediahub.com",
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem("mh_users_db", JSON.stringify(users));

        // Prime their library with seeded default files
        getLocalLibrary(newId);

        const token = btoa(newId);
        return jsonResponse({
          message: "Cadastro realizado com sucesso!",
          token,
          user: { id: newId, name, email, isAdmin: newUser.isAdmin }
        }, 201);
      }

      if (urlPath === "/api/auth/login" && method === "POST") {
        const { email, password } = body;
        if (!email || !password) {
          return jsonResponse({ error: "Preencha todos os campos." }, 400);
        }

        const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          return jsonResponse({ error: "Credenciais incorretas ou usuário não encontrado." }, 401);
        }

        const passwordHash = btoa(password);
        if (user.passwordHash !== passwordHash && user.passwordHash !== "$2a$10$abcdefghijklmnopqrstuv") {
          return jsonResponse({ error: "Senha incorreta. Tente novamente." }, 401);
        }

        const token = btoa(user.id);
        return jsonResponse({
          message: "Acesso autorizado!",
          token,
          user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
        });
      }

      if (urlPath === "/api/auth/recover" && method === "POST") {
        const { email } = body;
        const user = users.find((u: any) => u.email.toLowerCase() === email?.toLowerCase());
        if (!user) {
          return jsonResponse({ error: "E-mail não encontrado." }, 404);
        }
        return jsonResponse({
          message: "E-mail de recuperação enviado! Sua senha temporária foi gerada.",
          tempPassword: "senha_recuperada_123"
        });
      }

      // Beyond auth, we require an authenticated user
      if (!userId) {
        return jsonResponse({ error: "Não autorizado. Sessão expirada ou token inválido." }, 401);
      }

      const activeUser = users.find((u: any) => u.id === userId);
      const lib = getLocalLibrary(userId);

      // --- HISTORY LOGS ---
      if (urlPath === "/api/auth/history") {
        if (method === "GET") {
          return jsonResponse(lib.history || []);
        }
        if (method === "DELETE") {
          lib.history = [];
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Histórico limpo com sucesso." });
        }
      }

      // --- USER PROFILE AND SETTINGS ---
      if (urlPath === "/api/auth/profile" && method === "POST") {
        const { name, email } = body;
        const uIdx = users.findIndex((u: any) => u.id === userId);
        if (uIdx !== -1) {
          users[uIdx].name = name || users[uIdx].name;
          users[uIdx].email = email || users[uIdx].email;
          localStorage.setItem("mh_users_db", JSON.stringify(users));
          return jsonResponse({ message: "Perfil atualizado!", user: { id: userId, name: users[uIdx].name, email: users[uIdx].email, isAdmin: users[uIdx].isAdmin } });
        }
      }

      if (urlPath === "/api/auth/password" && method === "POST") {
        const { currentPassword, newPassword } = body;
        const uIdx = users.findIndex((u: any) => u.id === userId);
        if (uIdx !== -1) {
          const currentHashed = btoa(currentPassword);
          if (users[uIdx].passwordHash !== currentHashed && users[uIdx].passwordHash !== "$2a$10$abcdefghijklmnopqrstuv") {
            return jsonResponse({ error: "Senha atual incorreta." }, 400);
          }
          users[uIdx].passwordHash = btoa(newPassword);
          localStorage.setItem("mh_users_db", JSON.stringify(users));
          return jsonResponse({ message: "Senha alterada com sucesso!" });
        }
      }

      // --- FILES ENDPOINTS ---
      if (urlPath === "/api/library/files") {
        return jsonResponse(lib.files.filter((f: any) => !f.isDeleted));
      }

      const favMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)\/favorite/);
      if (favMatch && method === "POST") {
        const fileId = favMatch[1];
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].isFavorite = !lib.files[fIdx].isFavorite;
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Favorito alterado", isFavorite: lib.files[fIdx].isFavorite });
        }
      }

      const trashMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)$/);
      if (trashMatch && method === "DELETE") {
        const fileId = trashMatch[1];
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].isDeleted = true;
          lib.history.unshift({
            id: `hist-${Date.now()}`,
            userId,
            action: "delete",
            details: `Moveu "${lib.files[fIdx].title}" para a lixeira`,
            createdAt: new Date().toISOString()
          });
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Arquivo movido para a lixeira." });
        }
      }

      const restoreMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)\/restore/);
      if (restoreMatch && method === "POST") {
        const fileId = restoreMatch[1];
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].isDeleted = false;
          lib.history.unshift({
            id: `hist-${Date.now()}`,
            userId,
            action: "restore",
            details: `Restaurou "${lib.files[fIdx].title}" da lixeira`,
            createdAt: new Date().toISOString()
          });
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Arquivo restaurado com sucesso." });
        }
      }

      const copyMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)\/copy/);
      if (copyMatch && method === "POST") {
        const fileId = copyMatch[1];
        const { folderId } = body;
        const file = lib.files.find((f: any) => f.id === fileId);
        if (file) {
          const copied = {
            ...file,
            id: `copy-${Date.now()}`,
            title: `${file.title} (Cópia)`,
            folderId: folderId || null,
            createdAt: new Date().toISOString()
          };
          lib.files.push(copied);
          lib.history.unshift({
            id: `hist-${Date.now()}`,
            userId,
            action: "copy",
            details: `Copiou "${file.title}" para outra pasta`,
            createdAt: new Date().toISOString()
          });
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Arquivo copiado com sucesso!" });
        }
      }

      const moveMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)\/move/);
      if (moveMatch && method === "POST") {
        const fileId = moveMatch[1];
        const { folderId } = body;
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].folderId = folderId || null;
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Arquivo movido com sucesso!" });
        }
      }

      const playMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)\/play/);
      if (playMatch && method === "POST") {
        const fileId = playMatch[1];
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].playCount = (lib.files[fIdx].playCount || 0) + 1;
          lib.history.unshift({
            id: `hist-${Date.now()}`,
            userId,
            action: "playback",
            details: `Reproduziu "${lib.files[fIdx].title}"`,
            createdAt: new Date().toISOString()
          });
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Play count incremented" });
        }
      }

      const tagFileMatch = urlPath.match(/\/api\/library\/files\/([^\/]+)\/tags/);
      if (tagFileMatch && method === "POST") {
        const fileId = tagFileMatch[1];
        const { tags } = body;
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].tags = tags || [];
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Tags salvas com sucesso!" });
        }
      }

      // --- FOLDERS ENDPOINTS ---
      if (urlPath === "/api/library/folders") {
        if (method === "GET") {
          return jsonResponse(lib.folders || []);
        }
        if (method === "POST") {
          const { name, parentId } = body;
          const newFolder = {
            id: `folder-${Date.now()}`,
            userId,
            name,
            parentId: parentId || null,
            createdAt: new Date().toISOString()
          };
          lib.folders.push(newFolder);
          saveLocalLibrary(userId, lib);
          return jsonResponse(newFolder, 201);
        }
      }

      const folderDeleteMatch = urlPath.match(/\/api\/library\/folders\/([^\/]+)$/);
      if (folderDeleteMatch && method === "DELETE") {
        const id = folderDeleteMatch[1];
        lib.folders = lib.folders.filter((f: any) => f.id !== id);
        // Clean references in files
        lib.files.forEach((f: any) => {
          if (f.folderId === id) f.folderId = null;
        });
        saveLocalLibrary(userId, lib);
        return jsonResponse({ message: "Pasta excluída." });
      }

      // --- PLAYLISTS ENDPOINTS ---
      if (urlPath === "/api/library/playlists") {
        if (method === "GET") {
          return jsonResponse(lib.playlists || []);
        }
        if (method === "POST") {
          const { name, description } = body;
          const newPlaylist = {
            id: `playlist-${Date.now()}`,
            userId,
            name,
            description: description || "",
            mediaFileIds: [],
            createdAt: new Date().toISOString()
          };
          lib.playlists.push(newPlaylist);
          saveLocalLibrary(userId, lib);
          return jsonResponse(newPlaylist, 201);
        }
      }

      const pAddMatch = urlPath.match(/\/api\/library\/playlists\/([^\/]+)\/add/);
      if (pAddMatch && method === "POST") {
        const playlistId = pAddMatch[1];
        const { fileId } = body;
        const pIdx = lib.playlists.findIndex((p: any) => p.id === playlistId);
        if (pIdx !== -1) {
          if (!lib.playlists[pIdx].mediaFileIds) lib.playlists[pIdx].mediaFileIds = [];
          if (!lib.playlists[pIdx].mediaFileIds.includes(fileId)) {
            lib.playlists[pIdx].mediaFileIds.push(fileId);
          }
          saveLocalLibrary(userId, lib);
          return jsonResponse(lib.playlists[pIdx]);
        }
      }

      const pRemoveMatch = urlPath.match(/\/api\/library\/playlists\/([^\/]+)\/remove/);
      if (pRemoveMatch && method === "POST") {
        const playlistId = pRemoveMatch[1];
        const { fileId } = body;
        const pIdx = lib.playlists.findIndex((p: any) => p.id === playlistId);
        if (pIdx !== -1) {
          if (lib.playlists[pIdx].mediaFileIds) {
            lib.playlists[pIdx].mediaFileIds = lib.playlists[pIdx].mediaFileIds.filter((id: string) => id !== fileId);
          }
          saveLocalLibrary(userId, lib);
          return jsonResponse(lib.playlists[pIdx]);
        }
      }

      const playlistDeleteMatch = urlPath.match(/\/api\/library\/playlists\/([^\/]+)$/);
      if (playlistDeleteMatch && method === "DELETE") {
        const id = playlistDeleteMatch[1];
        lib.playlists = lib.playlists.filter((p: any) => p.id !== id);
        saveLocalLibrary(userId, lib);
        return jsonResponse({ message: "Playlist excluída." });
      }

      // --- TAGS ---
      if (urlPath === "/api/library/tags") {
        if (method === "GET") {
          return jsonResponse(lib.tags || []);
        }
        if (method === "POST") {
          const { name, color } = body;
          const newTag = {
            id: `tag-${Date.now()}`,
            name,
            color
          };
          if (!lib.tags.find((t: any) => t.name.toLowerCase() === name.toLowerCase())) {
            lib.tags.push(newTag);
            saveLocalLibrary(userId, lib);
          }
          return jsonResponse(newTag, 201);
        }
      }

      // --- STATS ENDPOINTS ---
      if (urlPath === "/api/library/storage-stats") {
        return jsonResponse(calculateLocalStats(lib.files));
      }

      // --- DOWNLOADS ENGINE SIMULATOR ---
      if (urlPath === "/api/downloads") {
        if (method === "GET") {
          return jsonResponse(lib.downloads || []);
        }
      }

      if (urlPath === "/api/downloads/start" && method === "POST") {
        const { url, title, thumbnail, duration, fileSize, format, quality } = body;
        const dlId = `dl-${Date.now()}`;
        const newDl: Download = {
          id: dlId,
          userId,
          url,
          title,
          thumbnail: thumbnail || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400",
          duration: duration || "03:30",
          fileSize: fileSize || "12.0 MB",
          format: format || "MP4",
          quality: quality || "720p",
          progress: 0,
          speed: "Iniciando...",
          eta: "--:--",
          status: "downloading",
          createdAt: new Date().toISOString()
        };

        lib.downloads.push(newDl);
        lib.history.unshift({
          id: `hist-${Date.now()}`,
          userId,
          action: "download",
          details: `Iniciou download de "${title}" em ${format} (${quality})`,
          createdAt: new Date().toISOString()
        });
        saveLocalLibrary(userId, lib);

        // Client background downloader simulator tick loop
        let currentProgress = 0;
        const intervalId = setInterval(() => {
          const innerLib = getLocalLibrary(userId);
          const dlIdx = innerLib.downloads.findIndex((d: any) => d.id === dlId);
          if (dlIdx === -1 || innerLib.downloads[dlIdx].status !== "downloading") {
            clearInterval(intervalId);
            clientActiveSimulators.delete(dlId);
            return;
          }

          currentProgress += Math.floor(Math.random() * 15) + 10;
          if (currentProgress >= 100) {
            currentProgress = 100;
            innerLib.downloads[dlIdx].progress = 100;
            innerLib.downloads[dlIdx].status = "completed";
            innerLib.downloads[dlIdx].speed = "0 KB/s";
            innerLib.downloads[dlIdx].eta = "00:00";

            // Add downloaded file to library
            const ext = (format || "mp4").toLowerCase();
            const filename = `${dlId}.${ext}`;
            const finalPlayableUrl = `/downloaded-media/${filename}`;
            const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(ext);

            const newFile: MediaFile = {
              id: `media-${Date.now()}`,
              userId,
              title,
              url: finalPlayableUrl,
              thumbnail: thumbnail || (isAudio 
                ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60"
                : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=60"),
              duration: duration || "03:30",
              fileSize: fileSize || "12.0 MB",
              format: format || "MP4",
              quality: quality || "720p",
              type: isAudio ? "audio" : "video",
              folderId: null,
              tags: [isAudio ? "Música" : "Vídeo"],
              isFavorite: false,
              isShared: false,
              isDeleted: false,
              playCount: 0,
              createdAt: new Date().toISOString()
            };

            innerLib.files.unshift(newFile);
            innerLib.history.unshift({
              id: `hist-${Date.now()}`,
              userId,
              action: "download",
              details: `Download de "${title}" concluído com sucesso`,
              createdAt: new Date().toISOString()
            });

            clearInterval(intervalId);
            clientActiveSimulators.delete(dlId);
          } else {
            innerLib.downloads[dlIdx].progress = currentProgress;
            innerLib.downloads[dlIdx].speed = `${(Math.random() * 3 + 1).toFixed(1)} MB/s`;
            
            const remainingSecs = Math.max(1, Math.round((100 - currentProgress) / 15));
            innerLib.downloads[dlIdx].eta = `00:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
          }

          saveLocalLibrary(userId, innerLib);
        }, 1000);

        clientActiveSimulators.set(dlId, intervalId);

        return jsonResponse({
          message: "Download iniciado com sucesso!",
          download: newDl
        }, 201);
      }

      const pauseDlMatch = urlPath.match(/\/api\/downloads\/([^\/]+)\/pause$/);
      if (pauseDlMatch && method === "POST") {
        const id = pauseDlMatch[1];
        const dlIdx = lib.downloads.findIndex((d: any) => d.id === id);
        if (dlIdx !== -1) {
          lib.downloads[dlIdx].status = "paused";
          lib.downloads[dlIdx].speed = "0 KB/s";
          lib.downloads[dlIdx].eta = "--:--";
          saveLocalLibrary(userId, lib);

          const sim = clientActiveSimulators.get(id);
          if (sim) {
            clearInterval(sim);
            clientActiveSimulators.delete(id);
          }
          return jsonResponse({ message: "Download pausado", download: lib.downloads[dlIdx] });
        }
      }

      const resumeDlMatch = urlPath.match(/\/api\/downloads\/([^\/]+)\/resume$/);
      if (resumeDlMatch && method === "POST") {
        const id = resumeDlMatch[1];
        const dlIdx = lib.downloads.findIndex((d: any) => d.id === id);
        if (dlIdx !== -1) {
          lib.downloads[dlIdx].status = "downloading";
          lib.downloads[dlIdx].speed = "Iniciando...";
          saveLocalLibrary(userId, lib);

          // Re-create simulator
          let currentProgress = lib.downloads[dlIdx].progress;
          const format = lib.downloads[dlIdx].format;
          const title = lib.downloads[dlIdx].title;
          const url = lib.downloads[dlIdx].url;
          const thumbnail = lib.downloads[dlIdx].thumbnail;
          const duration = lib.downloads[dlIdx].duration;
          const fileSize = lib.downloads[dlIdx].fileSize;
          const quality = lib.downloads[dlIdx].quality;

          const intervalId = setInterval(() => {
            const innerLib = getLocalLibrary(userId);
            const innerDlIdx = innerLib.downloads.findIndex((d: any) => d.id === id);
            if (innerDlIdx === -1 || innerLib.downloads[innerDlIdx].status !== "downloading") {
              clearInterval(intervalId);
              clientActiveSimulators.delete(id);
              return;
            }

            currentProgress += Math.floor(Math.random() * 15) + 10;
            if (currentProgress >= 100) {
              currentProgress = 100;
              innerLib.downloads[innerDlIdx].progress = 100;
              innerLib.downloads[innerDlIdx].status = "completed";
              innerLib.downloads[innerDlIdx].speed = "0 KB/s";
              innerLib.downloads[innerDlIdx].eta = "00:00";

              const ext = (format || "mp4").toLowerCase();
              const filename = `${id}.${ext}`;
              const finalPlayableUrl = `/downloaded-media/${filename}`;
              const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(ext);

              const newFile: MediaFile = {
                id: `media-${Date.now()}`,
                userId,
                title,
                url: finalPlayableUrl,
                thumbnail: thumbnail || (isAudio 
                  ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60"
                  : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=60"),
                duration,
                fileSize,
                format,
                quality,
                type: isAudio ? "audio" : "video",
                folderId: null,
                tags: [isAudio ? "Música" : "Vídeo"],
                isFavorite: false,
                isShared: false,
                isDeleted: false,
                playCount: 0,
                createdAt: new Date().toISOString()
              };

              innerLib.files.unshift(newFile);
              innerLib.history.unshift({
                id: `hist-${Date.now()}`,
                userId,
                action: "download",
                details: `Download de "${title}" concluído`,
                createdAt: new Date().toISOString()
              });

              clearInterval(intervalId);
              clientActiveSimulators.delete(id);
            } else {
              innerLib.downloads[innerDlIdx].progress = currentProgress;
              innerLib.downloads[innerDlIdx].speed = `${(Math.random() * 3 + 1).toFixed(1)} MB/s`;
              const remainingSecs = Math.max(1, Math.round((100 - currentProgress) / 15));
              innerLib.downloads[innerDlIdx].eta = `00:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
            }

            saveLocalLibrary(userId, innerLib);
          }, 1000);

          clientActiveSimulators.set(id, intervalId);

          return jsonResponse({ message: "Download retomado", download: lib.downloads[dlIdx] });
        }
      }

      const dlDeleteMatch = urlPath.match(/\/api\/downloads\/([^\/]+)$/);
      if (dlDeleteMatch && method === "DELETE") {
        const id = dlDeleteMatch[1];
        lib.downloads = lib.downloads.filter((d: any) => d.id !== id);
        saveLocalLibrary(userId, lib);

        const sim = clientActiveSimulators.get(id);
        if (sim) {
          clearInterval(sim);
          clientActiveSimulators.delete(id);
        }
        return jsonResponse({ message: "Download excluído." });
      }

      // --- CONVERSION ENGINE ENDPOINT ---
      if (urlPath === "/api/media/convert" && method === "POST") {
        const { fileId, targetFormat, targetType } = body;
        const file = lib.files.find((f: any) => f.id === fileId);
        if (!file) {
          return jsonResponse({ error: "Arquivo não localizado." }, 404);
        }

        const extension = targetFormat.toLowerCase();
        const conversionId = `conv-${Date.now()}`;
        const newTitle = `${file.title.replace(/\.[^/.]+$/, "")}_convertido.${extension}`;
        const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(extension);

        const convertedFile: MediaFile = {
          id: `media-${Date.now()}`,
          userId,
          title: newTitle,
          url: `/downloaded-media/${conversionId}.${extension}`,
          thumbnail: file.thumbnail,
          duration: file.duration,
          fileSize: isAudio ? "5.4 MB" : "12.0 MB",
          format: targetFormat.toUpperCase(),
          quality: isAudio ? "320 kbps" : "720p",
          type: isAudio ? "audio" : "video",
          folderId: null,
          tags: [isAudio ? "Música" : "Vídeo"],
          isFavorite: false,
          isShared: false,
          isDeleted: false,
          playCount: 0,
          createdAt: new Date().toISOString()
        };

        lib.files.unshift(convertedFile);
        lib.history.unshift({
          id: `hist-${Date.now()}`,
          userId,
          action: "conversion",
          details: `Converteu "${file.title}" para o formato ${targetFormat.toUpperCase()}`,
          createdAt: new Date().toISOString()
        });
        saveLocalLibrary(userId, lib);

        return jsonResponse({
          message: "Arquivo convertido com sucesso e salvo em sua biblioteca!",
          file: convertedFile
        });
      }

      if (urlPath === "/api/media/edit" && method === "POST") {
        const { fileId, title, folderId } = body;
        const fIdx = lib.files.findIndex((f: any) => f.id === fileId);
        if (fIdx !== -1) {
          lib.files[fIdx].title = title || lib.files[fIdx].title;
          lib.files[fIdx].folderId = folderId !== undefined ? folderId : lib.files[fIdx].folderId;
          saveLocalLibrary(userId, lib);
          return jsonResponse({ message: "Arquivo atualizado!", file: lib.files[fIdx] });
        }
      }

      // --- ADMIN PANEL DASHBOARD ---
      if (urlPath === "/api/admin/dashboard") {
        // Collect totals over all users for simulation
        const totalUsers = users.length;
        const allLibs = users.map((u: any) => getLocalLibrary(u.id));
        const totalDownloads = allLibs.reduce((acc: number, l: any) => acc + (l.downloads?.length || 0), 0);
        const totalFiles = allLibs.reduce((acc: number, l: any) => acc + (l.files?.length || 0), 0);
        const totalConversions = allLibs.reduce((acc: number, l: any) => acc + l.history.filter((h: any) => h.action === "conversion").length, 0);

        return jsonResponse({
          totalUsers,
          totalDownloads,
          totalFiles,
          totalConversions,
          activeDownloads: 0,
          totalStorage: "1.4 GB",
          storageLimit: "10 GB",
          storagePercentage: 14,
          auditLogs: [
            { id: "log-1", userEmail: activeUser?.email || "admin@mediahub.com", action: "Acesso ao painel administrativo", ip: "127.0.0.1", userAgent: "Browser", createdAt: new Date().toISOString() }
          ]
        });
      }

      return jsonResponse({ error: "Endpoint não suportado." }, 404);
    } catch (e: any) {
      console.error("Local API Error Intercept:", e);
      return jsonResponse({ error: "Erro interno no simulador local.", message: e.message }, 500);
    }
  }

  // Fallback to original fetch (like URL Scraper /api/downloads/analyze and remote audio file plays)
  return originalFetch.apply(window, [input, init]);
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Failed to overwrite window.fetch using Object.defineProperty. Trying globalThis override...", e);
  try {
    (globalThis as any).fetch = customFetch;
  } catch (err) {
    console.error("Critical: Could not intercept fetch.", err);
  }
}

console.log("🚀 MediaHub Client-Side API Interceptor successfully mounted and running!");
