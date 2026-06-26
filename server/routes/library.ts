import { Router, Response } from "express";
import { dbOps, readDatabase, writeDatabase, Folder, Playlist, Tag } from "../db";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// 1. Get Library Contents (Files & Folders)
router.get("/contents", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const files = dbOps.getMediaFiles(userId);
  const folders = dbOps.getFolders(userId);
  res.json({ files, folders });
});

// 2. Get Trash Contents
router.get("/trash", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const files = dbOps.getDeletedMediaFiles(req.user!.id);
  res.json(files);
});

// 3. Create Folder
router.post("/folders", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: "O nome da pasta é obrigatório." });

  const newFolder: Folder = {
    id: `folder-${Date.now()}`,
    userId: req.user!.id,
    name,
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };

  dbOps.addFolder(newFolder);
  res.status(201).json(newFolder);
});

// 4. Rename Folder
router.put("/folders/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "O novo nome da pasta é obrigatório." });

  const folder = dbOps.renameFolder(req.params.id, name);
  if (!folder) return res.status(404).json({ error: "Pasta não encontrada." });
  res.json(folder);
});

// 5. Delete Folder
router.delete("/folders/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  dbOps.deleteFolder(req.params.id);
  res.json({ message: "Pasta excluída com sucesso. Os arquivos foram movidos para a raiz." });
});

// 6. Move File to Folder
router.post("/files/:id/move", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { folderId } = req.body; // Can be null for root
  const file = dbOps.updateMediaFile(req.params.id, { folderId: folderId || null });
  if (!file) return res.status(404).json({ error: "Arquivo não localizado." });
  res.json({ message: "Arquivo movido com sucesso.", file });
});

// 7. Copy File
router.post("/files/:id/copy", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const db = readDatabase();
  const file = db.media_files.find((m) => m.id === req.params.id && m.userId === userId);

  if (!file) return res.status(404).json({ error: "Arquivo original não encontrado." });

  const copiedFile = {
    ...file,
    id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: `${file.title} (Cópia)`,
    createdAt: new Date().toISOString(),
  };

  db.media_files.push(copiedFile);
  writeDatabase(db);
  res.status(201).json({ message: "Arquivo copiado com sucesso.", file: copiedFile });
});

// 8. Rename File
router.put("/files/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "O título do arquivo é obrigatório." });

  const file = dbOps.updateMediaFile(req.params.id, { title });
  if (!file) return res.status(404).json({ error: "Arquivo não encontrado." });
  res.json({ message: "Arquivo renomeado com sucesso.", file });
});

// 9. Send File to Trash
router.post("/files/:id/trash", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const file = dbOps.updateMediaFile(req.params.id, { isDeleted: true });
  if (!file) return res.status(404).json({ error: "Arquivo não encontrado." });
  dbOps.addHistoryItem(req.user!.id, "edit", `Moveu "${file.title}" para a lixeira`);
  res.json({ message: "Arquivo enviado para a lixeira.", file });
});

// 10. Restore File from Trash
router.post("/files/:id/restore", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const file = dbOps.updateMediaFile(req.params.id, { isDeleted: false });
  if (!file) return res.status(404).json({ error: "Arquivo não encontrado." });
  dbOps.addHistoryItem(req.user!.id, "edit", `Restaurou "${file.title}" da lixeira`);
  res.json({ message: "Arquivo restaurado com sucesso.", file });
});

// 11. Delete File Permanently
router.delete("/files/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  dbOps.deleteMediaFilePermanently(req.params.id);
  res.json({ message: "Arquivo excluído permanentemente." });
});

// 12. Toggle Favorite
router.post("/files/:id/favorite", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  const file = db.media_files.find((m) => m.id === req.params.id && m.userId === req.user!.id);

  if (!file) return res.status(404).json({ error: "Arquivo não localizado." });

  const isFavorite = !file.isFavorite;
  file.isFavorite = isFavorite;

  // Sync to db.favorites schema list
  if (isFavorite) {
    if (!db.favorites.includes(file.id)) db.favorites.push(file.id);
  } else {
    db.favorites = db.favorites.filter((id) => id !== file.id);
  }

  writeDatabase(db);
  res.json({ message: isFavorite ? "Adicionado aos favoritos." : "Removido dos favoritos.", file });
});

// 13. Create custom Tags
router.get("/tags", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const tags = dbOps.getTags();
  res.json(tags);
});

router.post("/tags", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: "O nome da tag é obrigatório." });

  const newTag: Tag = {
    id: `tag-${Date.now()}`,
    name,
    color: color || "blue",
  };

  dbOps.addTag(newTag);
  res.status(201).json(newTag);
});

// 14. Assign Tags to File
router.post("/files/:id/tags", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { tags } = req.body; // Array of strings
  if (!Array.isArray(tags)) return res.status(400).json({ error: "Tags devem ser um array." });

  const file = dbOps.updateMediaFile(req.params.id, { tags });
  if (!file) return res.status(404).json({ error: "Arquivo não localizado." });
  res.json({ message: "Tags salvas com sucesso.", file });
});

// 15. Playlists
router.get("/playlists", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const playlists = dbOps.getPlaylists(req.user!.id);
  res.json(playlists);
});

router.post("/playlists", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "O nome da lista de reprodução é obrigatório." });

  const newPlaylist: Playlist = {
    id: `playlist-${Date.now()}`,
    userId: req.user!.id,
    name,
    mediaFileIds: [],
    createdAt: new Date().toISOString(),
  };

  dbOps.addPlaylist(newPlaylist);
  res.status(201).json(newPlaylist);
});

router.post("/playlists/:id/add", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.body;
  const db = readDatabase();
  const playlist = db.playlists.find((p) => p.id === req.params.id && p.userId === req.user!.id);

  if (!playlist) return res.status(404).json({ error: "Playlist não localizada." });
  if (!playlist.mediaFileIds.includes(fileId)) {
    playlist.mediaFileIds.push(fileId);
    writeDatabase(db);
  }

  res.json({ message: "Arquivo inserido na playlist.", playlist });
});

router.post("/playlists/:id/remove", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.body;
  const db = readDatabase();
  const playlist = db.playlists.find((p) => p.id === req.params.id && p.userId === req.user!.id);

  if (!playlist) return res.status(404).json({ error: "Playlist não localizada." });
  playlist.mediaFileIds = playlist.mediaFileIds.filter((id) => id !== fileId);
  writeDatabase(db);

  res.json({ message: "Arquivo removido da playlist.", playlist });
});

router.delete("/playlists/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  dbOps.deletePlaylist(req.params.id);
  res.json({ message: "Playlist excluída." });
});

// 16. Get Files List
router.get("/files", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const files = dbOps.getMediaFiles(req.user!.id);
  res.json(files);
});

// 17. Get Folders List
router.get("/folders", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const folders = dbOps.getFolders(req.user!.id);
  res.json(folders);
});

// 18. Record playback and increment play count
router.post("/files/:id/play", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  const file = db.media_files.find((m) => m.id === req.params.id && m.userId === req.user!.id);

  if (!file) return res.status(404).json({ error: "Arquivo não localizado." });

  file.playCount = (file.playCount || 0) + 1;

  // Add playback history item
  db.history.push({
    id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: req.user!.id,
    action: "playback",
    details: `Reproduziu "${file.title}"`,
    createdAt: new Date().toISOString(),
  });

  writeDatabase(db);
  res.json({ message: "Reprodução registrada com sucesso.", file });
});

// 19. Get Storage Stats for user
router.get("/storage-stats", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const downloads = dbOps.getDownloads(userId);
  const mediaFiles = dbOps.getMediaFiles(userId);
  const folders = dbOps.getFolders(userId);
  const playlists = dbOps.getPlaylists(userId);

  const totalDownloads = downloads.length;
  const videos = mediaFiles.filter((m) => m.type === "video");
  const audios = mediaFiles.filter((m) => m.type === "audio");
  const favorites = mediaFiles.filter((m) => m.isFavorite);

  // Storage usage calculation
  let totalBytes = 0;
  mediaFiles.forEach((file) => {
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

  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const freeMB = (2048 - parseFloat(usedMB)).toFixed(1); // 2GB limit

  res.json({
    totalDownloads,
    totalVideos: videos.length,
    totalAudios: audios.length,
    totalFolders: folders.length,
    totalPlaylists: playlists.length,
    totalFavorites: favorites.length,
    storageUsed: `${usedMB} MB`,
    storageFree: `${freeMB} MB`,
    storageLimit: "2.0 GB",
    percentageUsed: Math.min(100, Math.round((totalBytes / (2048 * 1024 * 1024)) * 100)),
  });
});

export default router;
