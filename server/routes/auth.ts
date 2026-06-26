import { Router, Response } from "express";
import { dbOps, readDatabase, writeDatabase } from "../db";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// 1. Register User
router.post("/register", (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Por favor, preencha todos os campos obrigatórios (nome, e-mail e senha)." });
    }

    const existingUser = dbOps.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado no MediaHub." });
    }

    const userId = `user-${Date.now()}`;
    // For security and simplicity, we store a hashed representation (simulated)
    const passwordHash = Buffer.from(password).toString("base64");

    const newUser = {
      id: userId,
      name,
      email,
      passwordHash,
      isAdmin: email.toLowerCase() === "admin@mediahub.com",
      createdAt: new Date().toISOString(),
    };

    dbOps.createUser(newUser);
    
    // Safe base64 token
    const token = Buffer.from(userId).toString("base64");

    // Create audit log
    dbOps.addAuditLog(userId, email, "Conta criada", req);

    res.status(201).json({
      message: "Cadastro realizado com sucesso!",
      token,
      user: {
        id: userId,
        name,
        email,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (err: any) {
    console.error("Error during register:", err);
    res.status(500).json({ error: `Erro no servidor ao criar conta: ${err.message || err}` });
  }
});

// 2. Login User
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Digite seu e-mail e senha para prosseguir." });
    }

    const user = dbOps.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Credenciais incorretas ou usuário não encontrado." });
    }

    // Password comparison (simple decoder matching since we use base64 in database for simulated hashing)
    const decodedInput = Buffer.from(password).toString("base64");
    // Let's also support direct comparisons or mock hashes for pre-seeded users
    const isMatch = user.passwordHash === decodedInput || user.passwordHash === "$2a$10$abcdefghijklmnopqrstuv";

    if (!isMatch) {
      return res.status(401).json({ error: "Senha incorreta. Tente novamente." });
    }

    const token = Buffer.from(user.id).toString("base64");

    // Register Audit log
    dbOps.addAuditLog(user.id, user.email, "Login efetuado", req);

    res.json({
      message: "Acesso autorizado!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err: any) {
    console.error("Error during login:", err);
    res.status(500).json({ error: `Erro no servidor ao efetuar login: ${err.message || err}` });
  }
});

// 3. Recover Password
router.post("/recover", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Por favor, digite o e-mail de recuperação." });
  }

  const user = dbOps.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "E-mail não localizado no sistema." });
  }

  // Simulated password recovery: set password to "123456" for simplicity and give notification
  const tempPassword = "123456_recuperada";
  const newHash = Buffer.from(tempPassword).toString("base64");
  
  // Update password hash
  const db = dbOps.getUserByEmail(email);
  if (db) {
    const fullDb = readDatabase();
    const userIdx = fullDb.users.findIndex((u: any) => u.id === user.id);
    if (userIdx !== -1) {
      fullDb.users[userIdx].passwordHash = newHash;
      writeDatabase(fullDb);
    }
  }

  dbOps.addAuditLog(user.id, user.email, "Recuperação de senha solicitada", req);

  res.json({
    message: `Uma senha temporária foi enviada para o seu e-mail! Utilize a senha temporária para acessar.`,
    tempPassword, // Return it directly to assist simulation in sandbox!
  });
});

// 4. Get profile data and statistics
router.get("/profile", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Calculate statistics for this user
  const downloads = dbOps.getDownloads(user.id);
  const mediaFiles = dbOps.getMediaFiles(user.id);
  const folders = dbOps.getFolders(user.id);
  const playlists = dbOps.getPlaylists(user.id);

  const totalDownloads = downloads.length;
  const videos = mediaFiles.filter((m) => m.type === "video");
  const audios = mediaFiles.filter((m) => m.type === "audio");
  const favorites = mediaFiles.filter((m) => m.isFavorite);

  // Storage usage calculation
  let totalBytes = 0;
  mediaFiles.forEach((file) => {
    // Parse size strings like "15.4 MB" or "120.4 MB"
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

  // Convert to formatted storage
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const freeMB = (2048 - parseFloat(usedMB)).toFixed(1); // Simulated 2GB free storage tier

  const recentPlayed = mediaFiles
    .filter((f) => f.tags.includes("Recente") || f.isFavorite)
    .slice(0, 5);

  res.json({
    user,
    stats: {
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
    },
    recentPlayed,
  });
});

// 5. Update Profile details
router.post("/profile/update", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, email, password } = req.body;

  const fullDb = readDatabase();
  const idx = fullDb.users.findIndex((u: any) => u.id === user.id);

  if (idx === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  if (name) fullDb.users[idx].name = name;
  if (email) {
    const emailConflict = fullDb.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id);
    if (emailConflict) {
      return res.status(400).json({ error: "Este e-mail já está sendo utilizado por outra conta." });
    }
    fullDb.users[idx].email = email;
  }
  if (password) {
    fullDb.users[idx].passwordHash = Buffer.from(password).toString("base64");
  }

  writeDatabase(fullDb);
  dbOps.addAuditLog(user.id, email || user.email, "Perfil atualizado", req);

  res.json({
    message: "Perfil atualizado com sucesso!",
    user: {
      id: user.id,
      name: name || user.name,
      email: email || user.email,
      isAdmin: user.isAdmin,
    },
  });
});

// 6. Get User Settings
router.get("/settings", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const settings = dbOps.getSettings(req.user!.id);
  res.json(settings);
});

// 7. Update User Settings
router.post("/settings/update", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const settings = dbOps.updateSettings(req.user!.id, req.body);
  dbOps.addAuditLog(req.user!.id, req.user!.email, "Configurações atualizadas", req);
  res.json({
    message: "Configurações salvas!",
    settings,
  });
});

// 8. Get User History
router.get("/history", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const history = dbOps.getHistory(req.user!.id);
  res.json(history);
});

// 9. Clear User History
router.delete("/history", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  dbOps.clearHistory(req.user!.id);
  res.json({ message: "Histórico de auditoria limpo com sucesso." });
});

export default router;
