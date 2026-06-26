export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface Download {
  id: string;
  userId: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  fileSize: string;
  format: string;
  quality: string;
  progress: number;
  speed: string;
  eta: string;
  status: "downloading" | "paused" | "completed" | "error";
  errorMessage?: string;
  createdAt: string;
}

export interface MediaFile {
  id: string;
  userId: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  fileSize: string;
  format: string;
  quality: string;
  type: "audio" | "video";
  folderId: string | null;
  tags: string[];
  isFavorite: boolean;
  isShared: boolean;
  isDeleted: boolean;
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
  color: string;
}

export interface HistoryItem {
  id: string;
  userId: string;
  action: "download" | "conversion" | "playback" | "edit";
  details: string;
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

export type ActiveTab =
  | "inicio"
  | "downloads"
  | "audios"
  | "videos"
  | "conversoes"
  | "biblioteca"
  | "favoritos"
  | "historico"
  | "admin"
  | "configuracoes";
