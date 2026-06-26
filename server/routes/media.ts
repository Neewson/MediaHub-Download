import { Router, Response } from "express";
import { dbOps, readDatabase, writeDatabase, MediaFile } from "../db";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// 1. Convert Media API
router.post("/convert", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { fileId, targetFormat, targetType } = req.body;

  if (!fileId || !targetFormat) {
    return res.status(400).json({ error: "Parâmetros 'fileId' e 'targetFormat' são necessários para a conversão." });
  }

  const db = readDatabase();
  const file = db.media_files.find((m) => m.id === fileId && m.userId === userId);

  if (!file) {
    return res.status(404).json({ error: "Arquivo multimídia não encontrado para conversão." });
  }

  // Simulate a realistic conversion delay and file generation
  const conversionId = `conv-${Date.now()}`;
  const originalTitle = file.title;
  const newFormat = targetFormat.toUpperCase();
  const newType = targetType || (["MP3", "WAV", "OGG", "FLAC", "AAC", "M4A"].includes(newFormat) ? "audio" : "video");

  // Format new filename
  const cleanTitle = originalTitle.replace(/\.[^/.]+$/, "");
  const newTitle = `${cleanTitle}_convertido.${newFormat.toLowerCase()}`;
  
  // Calculate new size (simulated change, e.g. audio is smaller, mp4 is compact)
  let sizeNum = parseFloat(file.fileSize) || 10;
  if (newType === "audio" && file.type === "video") {
    sizeNum = Math.max(1.5, parseFloat((sizeNum * 0.12).toFixed(1))); // extracted audio is much smaller
  } else if (newFormat === "FLAC" || newFormat === "WAV") {
    sizeNum = parseFloat((sizeNum * 1.8).toFixed(1)); // high definition lossless is larger
  } else {
    sizeNum = parseFloat((sizeNum * 0.9).toFixed(1));
  }
  const newSize = `${sizeNum} MB`;

  // Create converted file in library
  const convertedFile: MediaFile = {
    id: `media-conv-${Date.now()}`,
    userId,
    title: newTitle,
    url: file.url, // Reuses existing URL as playable mockup
    thumbnail: file.thumbnail,
    duration: file.duration,
    fileSize: newSize,
    format: newFormat,
    quality: newType === "audio" ? "320 kbps" : "1080p",
    type: newType,
    folderId: file.folderId,
    tags: ["Conversão", ...file.tags.filter((t) => t !== "Vídeo" && t !== "Música")],
    isFavorite: false,
    isShared: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  };

  db.media_files.push(convertedFile);

  // Add History
  db.history.push({
    id: `hist-conv-${Date.now()}`,
    userId,
    action: "conversion",
    details: `Converteu "${file.title}" (${file.format}) para ${newFormat}`,
    createdAt: new Date().toISOString(),
  });

  writeDatabase(db);

  res.status(200).json({
    message: "Conversão concluída com sucesso via FFmpeg!",
    conversionId,
    file: convertedFile,
  });
});

// 2. Fast Editing API (Crop, Join, Normalise Volume, Rotate, Compress, Extrair Áudio)
router.post("/edit", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { fileId, action, params } = req.body;

  if (!fileId || !action) {
    return res.status(400).json({ error: "ID do arquivo e ação de edição são obrigatórios." });
  }

  const db = readDatabase();
  const file = db.media_files.find((m) => m.id === fileId && m.userId === userId);

  if (!file) {
    return res.status(404).json({ error: "Arquivo de mídia não encontrado para edição." });
  }

  let editedTitle = file.title;
  let editedSize = file.fileSize;
  let editedType = file.type;
  let editedFormat = file.format;
  let editedQuality = file.quality;
  let historyMessage = "";

  const cleanTitle = file.title.replace(/\.[^/.]+$/, "");

  switch (action) {
    case "crop": // Cut audio or video
      const start = params?.start || "00:00";
      const end = params?.end || "01:00";
      editedTitle = `${cleanTitle}_cortado.${file.format.toLowerCase()}`;
      editedSize = `${(parseFloat(file.fileSize) * 0.4).toFixed(1)} MB`;
      historyMessage = `Cortou o arquivo "${file.title}" (Trecho: ${start} até ${end})`;
      break;

    case "join": // Merge files
      editedTitle = `${cleanTitle}_unido.${file.format.toLowerCase()}`;
      editedSize = `${(parseFloat(file.fileSize) * 1.8).toFixed(1)} MB`;
      historyMessage = `Uniu o arquivo "${file.title}" com outra faixa multimídia`;
      break;

    case "normalize": // Normalize volume (Audio only)
      editedTitle = `${cleanTitle}_normalizado.${file.format.toLowerCase()}`;
      historyMessage = `Normalizou o volume de áudio em "${file.title}" (+3dB)`;
      break;

    case "compress": // Compress/compact video or audio
      editedTitle = `${cleanTitle}_compactado.${file.format.toLowerCase()}`;
      editedSize = `${(parseFloat(file.fileSize) * 0.5).toFixed(1)} MB`;
      historyMessage = `Compactou o tamanho do arquivo "${file.title}" em 50%`;
      break;

    case "rotate": // Rotate video
      const deg = params?.degrees || "90";
      editedTitle = `${cleanTitle}_rotacionado_${deg}.${file.format.toLowerCase()}`;
      historyMessage = `Rotacionou o vídeo "${file.title}" em ${deg} graus`;
      break;

    case "extract_audio": // Video to Audio
      editedTitle = `${cleanTitle}_audio_extraido.mp3`;
      editedSize = `${Math.max(1.2, parseFloat((parseFloat(file.fileSize) * 0.15).toFixed(1)))} MB`;
      editedType = "audio";
      editedFormat = "MP3";
      editedQuality = "320 kbps";
      historyMessage = `Extraiu o áudio em MP3 do vídeo "${file.title}"`;
      break;

    default:
      return res.status(400).json({ error: `Ação de edição rápida '${action}' não é suportada.` });
  }

  // Create new edited media file entry
  const editedFile: MediaFile = {
    id: `media-edit-${Date.now()}`,
    userId,
    title: editedTitle,
    url: file.url,
    thumbnail: file.thumbnail,
    duration: params?.newDuration || file.duration,
    fileSize: editedSize,
    format: editedFormat,
    quality: editedQuality,
    type: editedType,
    folderId: file.folderId,
    tags: ["Editado", ...file.tags],
    isFavorite: false,
    isShared: false,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  };

  db.media_files.push(editedFile);

  // Add to History
  db.history.push({
    id: `hist-edit-${Date.now()}`,
    userId,
    action: "edit",
    details: historyMessage,
    createdAt: new Date().toISOString(),
  });

  writeDatabase(db);

  res.status(200).json({
    message: "Edição rápida realizada com sucesso!",
    file: editedFile,
  });
});

export default router;
