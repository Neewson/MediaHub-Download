import fs from "fs";
import path from "path";

// Define Database Types
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Download {
  id: string;
  userId: string;
  url: string;
  resolvedUrl?: string;
  title: string;
  thumbnail: string;
  duration: string;
  fileSize: string; // e.g. "15.4 MB"
  format: string; // e.g. "MP4"
  quality: string; // e.g. "1080p"
  progress: number; // 0 to 100
  speed: string; // e.g. "2.4 MB/s"
  eta: string; // e.g. "00:12"
  status: "downloading" | "paused" | "completed" | "error";
  errorMessage?: string;
  createdAt: string;
}

export interface MediaFile {
  id: string;
  userId: string;
  title: string;
  url: string; // Playable media URL
  resolvedUrl?: string;
  thumbnail: string;
  duration: string;
  fileSize: string;
  format: string;
  quality: string;
  type: "audio" | "video";
  folderId: string | null; // null represents root
  tags: string[];
  isFavorite: boolean;
  isShared: boolean;
  isDeleted: boolean; // For Bin/Lixeira
  createdAt: string;
  playCount?: number;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  mediaFileIds: string[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // Tailwind color name like "blue", "green", "purple"
}

export interface HistoryItem {
  id: string;
  userId: string;
  action: "download" | "conversion" | "playback" | "edit";
  details: string; // Description e.g., "Baixou 'Video Aula de React'"
  createdAt: string;
}

export interface SystemSettings {
  userId: string;
  theme: "light" | "dark";
  language: "pt" | "en" | "es";
  defaultFolder: string;
  defaultQuality: string;
  defaultFormat: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  downloads: Download[];
  media_files: MediaFile[];
  playlists: Playlist[];
  folders: Folder[];
  tags: Tag[];
  favorites: string[]; // mediaFileIds marked as favorite
  history: HistoryItem[];
  settings: SystemSettings[];
  audit_logs: AuditLog[];
}

// Determine if the environment has a read-only filesystem (e.g., serverless environments like Vercel, Netlify, etc.)
let isReadOnlyEnv = !!process.env.VERCEL;
if (!isReadOnlyEnv) {
  try {
    const testFile = path.join(process.cwd(), ".write-test-" + Date.now());
    fs.writeFileSync(testFile, "test", "utf-8");
    fs.unlinkSync(testFile);
  } catch (e) {
    isReadOnlyEnv = true;
  }
}

export const isVercel = isReadOnlyEnv;
const DB_FILE_PATH = isVercel
  ? path.join("/tmp", "db.json")
  : path.join(process.cwd(), "db.json");

export function getDownloadsDir(): string {
  return isVercel
    ? path.join("/tmp", "downloads-data")
    : path.join(process.cwd(), "downloads-data");
}

// Default initial tags
const INITIAL_TAGS: Tag[] = [
  { id: "tag-1", name: "Música", color: "pink" },
  { id: "tag-2", name: "Gospel", color: "emerald" },
  { id: "tag-3", name: "Aula", color: "blue" },
  { id: "tag-4", name: "Filme", color: "purple" },
  { id: "tag-5", name: "Podcast", color: "amber" },
  { id: "tag-6", name: "Estudo", color: "indigo" },
];

// Open-source playable media samples
const SAMPLE_MEDIA = (userId: string): MediaFile[] => [
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
    type: "video",
    folderId: null,
    tags: ["Filme", "Estudo"],
    isFavorite: true,
    isShared: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
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
    type: "video",
    folderId: null,
    tags: ["Filme"],
    isFavorite: false,
    isShared: true,
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
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
    type: "audio",
    folderId: null,
    tags: ["Música", "Podcast"],
    isFavorite: true,
    isShared: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
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
    type: "audio",
    folderId: null,
    tags: ["Música"],
    isFavorite: false,
    isShared: false,
    isDeleted: false,
    createdAt: new Date().toISOString(), // Just now
  }
];

// Read from JSON file
export function readDatabase(): DatabaseSchema {
  try {
    const parentDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (isVercel && !fs.existsSync(DB_FILE_PATH)) {
      const rootDbPath = path.join(process.cwd(), "db.json");
      if (fs.existsSync(rootDbPath)) {
        try {
          fs.copyFileSync(rootDbPath, DB_FILE_PATH);
          console.log("Successfully copied pre-seeded database to /tmp/db.json for Vercel.");
        } catch (copyErr) {
          console.error("Failed to copy pre-seeded database to /tmp/db.json:", copyErr);
        }
      }
    }

    if (!fs.existsSync(DB_FILE_PATH)) {
      const initialDb: DatabaseSchema = {
        users: [
          {
            id: "user-admin",
            name: "Admin MediaHub",
            email: "admin@mediahub.com",
            passwordHash: "$2a$10$abcdefghijklmnopqrstuv", // Mocked hash for safety, we'll verify plain comparison in auth routes
            isAdmin: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "user-demo",
            name: "Demo User",
            email: "demo@mediahub.com",
            passwordHash: "$2a$10$abcdefghijklmnopqrstuv", // Default password '123456'
            isAdmin: false,
            createdAt: new Date().toISOString(),
          }
        ],
        downloads: [],
        media_files: [
          ...SAMPLE_MEDIA("user-admin"),
          ...SAMPLE_MEDIA("user-demo")
        ],
        playlists: [],
        folders: [
          { id: "folder-1", userId: "user-admin", name: "Aulas", parentId: null, createdAt: new Date().toISOString() },
          { id: "folder-2", userId: "user-admin", name: "Músicas Favoritas", parentId: null, createdAt: new Date().toISOString() },
          { id: "folder-3", userId: "user-demo", name: "Trabalho", parentId: null, createdAt: new Date().toISOString() }
        ],
        tags: INITIAL_TAGS,
        favorites: ["sample-video-1", "sample-audio-1"],
        history: [
          { id: "hist-1", userId: "user-admin", action: "playback", details: "Reproduziu 'Ambient Calm Synth - Lo-Fi Chill'", createdAt: new Date().toISOString() },
          { id: "hist-2", userId: "user-admin", action: "download", details: "Baixou 'Big Buck Bunny - Animação Clássica' (720p)", createdAt: new Date(Date.now() - 3600000).toISOString() }
        ],
        settings: [
          { userId: "user-admin", theme: "dark", language: "pt", defaultFolder: "Downloads", defaultQuality: "1080p", defaultFormat: "MP4" },
          { userId: "user-demo", theme: "dark", language: "pt", defaultFolder: "Downloads", defaultQuality: "1080p", defaultFormat: "MP4" }
        ],
        audit_logs: [
          { id: "log-1", userId: "user-admin", userEmail: "admin@mediahub.com", action: "Sessão iniciada", ip: "127.0.0.1", userAgent: "Mozilla/5.0", createdAt: new Date().toISOString() }
        ]
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }

    const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    // Defensive check to ensure all database keys exist and are initialized
    if (!parsed.users) parsed.users = [];
    if (!parsed.downloads) parsed.downloads = [];
    if (!parsed.media_files) parsed.media_files = [];
    if (!parsed.playlists) parsed.playlists = [];
    if (!parsed.folders) parsed.folders = [];
    if (!parsed.tags) parsed.tags = INITIAL_TAGS;
    if (!parsed.favorites) parsed.favorites = [];
    if (!parsed.history) parsed.history = [];
    if (!parsed.settings) parsed.settings = [];
    if (!parsed.audit_logs) parsed.audit_logs = [];

    return parsed;
  } catch (err) {
    console.error("Error reading database file", err);
    return {
      users: [],
      downloads: [],
      media_files: [],
      playlists: [],
      folders: [],
      tags: INITIAL_TAGS,
      favorites: [],
      history: [],
      settings: [],
      audit_logs: []
    };
  }
}

// Write to JSON file
export function writeDatabase(db: DatabaseSchema) {
  try {
    const parentDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

// Helper methods to modify database
export const dbOps = {
  // Users
  getUserByEmail: (email: string) => {
    const db = readDatabase();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserById: (id: string) => {
    const db = readDatabase();
    return db.users.find((u) => u.id === id);
  },
  createUser: (user: User) => {
    const db = readDatabase();
    db.users.push(user);
    // Create default settings
    db.settings.push({
      userId: user.id,
      theme: "dark",
      language: "pt",
      defaultFolder: "Downloads",
      defaultQuality: "1080p",
      defaultFormat: "MP4",
    });
    // Copy sample media for new user
    const userSamples = SAMPLE_MEDIA(user.id);
    db.media_files.push(...userSamples);
    writeDatabase(db);
  },

  // Settings
  getSettings: (userId: string) => {
    const db = readDatabase();
    let userSettings = db.settings.find((s) => s.userId === userId);
    if (!userSettings) {
      userSettings = {
        userId,
        theme: "dark",
        language: "pt",
        defaultFolder: "Downloads",
        defaultQuality: "1080p",
        defaultFormat: "MP4",
      };
      db.settings.push(userSettings);
      writeDatabase(db);
    }
    return userSettings;
  },
  updateSettings: (userId: string, updates: Partial<SystemSettings>) => {
    const db = readDatabase();
    const idx = db.settings.findIndex((s) => s.userId === userId);
    if (idx !== -1) {
      db.settings[idx] = { ...db.settings[idx], ...updates };
    } else {
      db.settings.push({
        userId,
        theme: "dark",
        language: "pt",
        defaultFolder: "Downloads",
        defaultQuality: "1080p",
        defaultFormat: "MP4",
        ...updates,
      } as SystemSettings);
    }
    writeDatabase(db);
    return db.settings.find((s) => s.userId === userId);
  },

  // Media Files
  getMediaFiles: (userId: string) => {
    const db = readDatabase();
    return db.media_files.filter((m) => m.userId === userId && !m.isDeleted);
  },
  getDeletedMediaFiles: (userId: string) => {
    const db = readDatabase();
    return db.media_files.filter((m) => m.userId === userId && m.isDeleted);
  },
  addMediaFile: (file: MediaFile) => {
    const db = readDatabase();
    db.media_files.push(file);
    writeDatabase(db);
    return file;
  },
  updateMediaFile: (id: string, updates: Partial<MediaFile>) => {
    const db = readDatabase();
    const idx = db.media_files.findIndex((m) => m.id === id);
    if (idx !== -1) {
      db.media_files[idx] = { ...db.media_files[idx], ...updates };
      writeDatabase(db);
      return db.media_files[idx];
    }
    return null;
  },
  deleteMediaFilePermanently: (id: string) => {
    const db = readDatabase();
    db.media_files = db.media_files.filter((m) => m.id !== id);
    writeDatabase(db);
  },

  // Folders
  getFolders: (userId: string) => {
    const db = readDatabase();
    return db.folders.filter((f) => f.userId === userId);
  },
  addFolder: (folder: Folder) => {
    const db = readDatabase();
    db.folders.push(folder);
    writeDatabase(db);
    return folder;
  },
  renameFolder: (id: string, name: string) => {
    const db = readDatabase();
    const idx = db.folders.findIndex((f) => f.id === id);
    if (idx !== -1) {
      db.folders[idx].name = name;
      writeDatabase(db);
      return db.folders[idx];
    }
    return null;
  },
  deleteFolder: (id: string) => {
    const db = readDatabase();
    // Delete folders
    db.folders = db.folders.filter((f) => f.id !== id);
    // Move files inside folder to root
    db.media_files = db.media_files.map((m) => {
      if (m.folderId === id) {
        return { ...m, folderId: null };
      }
      return m;
    });
    writeDatabase(db);
  },

  // Downloads
  getDownloads: (userId: string) => {
    const db = readDatabase();
    return db.downloads.filter((d) => d.userId === userId);
  },
  addDownload: (dl: Download) => {
    const db = readDatabase();
    db.downloads.push(dl);
    writeDatabase(db);
    return dl;
  },
  updateDownload: (id: string, updates: Partial<Download>) => {
    const db = readDatabase();
    const idx = db.downloads.findIndex((d) => d.id === id);
    if (idx !== -1) {
      db.downloads[idx] = { ...db.downloads[idx], ...updates };
      writeDatabase(db);
      return db.downloads[idx];
    }
    return null;
  },
  deleteDownload: (id: string) => {
    const db = readDatabase();
    db.downloads = db.downloads.filter((d) => d.id !== id);
    writeDatabase(db);
  },

  // Playlists
  getPlaylists: (userId: string) => {
    const db = readDatabase();
    return db.playlists.filter((p) => p.userId === userId);
  },
  addPlaylist: (playlist: Playlist) => {
    const db = readDatabase();
    db.playlists.push(playlist);
    writeDatabase(db);
    return playlist;
  },
  updatePlaylist: (id: string, updates: Partial<Playlist>) => {
    const db = readDatabase();
    const idx = db.playlists.findIndex((p) => p.id === id);
    if (idx !== -1) {
      db.playlists[idx] = { ...db.playlists[idx], ...updates };
      writeDatabase(db);
      return db.playlists[idx];
    }
    return null;
  },
  deletePlaylist: (id: string) => {
    const db = readDatabase();
    db.playlists = db.playlists.filter((p) => p.id !== id);
    writeDatabase(db);
  },

  // History
  getHistory: (userId: string) => {
    const db = readDatabase();
    return db.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addHistoryItem: (userId: string, action: HistoryItem["action"], details: string) => {
    const db = readDatabase();
    const newItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    db.history.push(newItem);
    writeDatabase(db);
    return newItem;
  },
  clearHistory: (userId: string) => {
    const db = readDatabase();
    db.history = db.history.filter((h) => h.userId !== userId);
    writeDatabase(db);
  },

  // Tags
  getTags: () => {
    const db = readDatabase();
    return db.tags;
  },
  addTag: (tag: Tag) => {
    const db = readDatabase();
    // avoid duplicates
    if (!db.tags.find((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
      db.tags.push(tag);
      writeDatabase(db);
    }
    return tag;
  },

  // Admin Logs
  getAuditLogs: () => {
    const db = readDatabase();
    return db.audit_logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addAuditLog: (userId: string, userEmail: string, action: string, req: any) => {
    const db = readDatabase();
    const ip = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "127.0.0.1";
    const userAgent = req?.headers?.["user-agent"] || "unknown";
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userEmail,
      action,
      ip: typeof ip === "string" ? ip : (ip && ip[0]) || "127.0.0.1",
      userAgent,
      createdAt: new Date().toISOString(),
    };
    db.audit_logs.push(log);
    writeDatabase(db);
    return log;
  },
};
