import { Router, Response } from "express";
import { dbOps, readDatabase, writeDatabase } from "../db";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Middleware to restrict access to Admins only
function adminOnly(req: AuthenticatedRequest, res: Response, next: any) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores do MediaHub têm permissão para acessar esta área." });
  }
  next();
}

// 1. Get complete Admin Dashboard Statistics
router.get("/dashboard", authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();

  const totalUsers = db.users.length;
  const totalDownloads = db.downloads.length;
  const totalFiles = db.media_files.length;
  const totalConversions = db.history.filter((h) => h.action === "conversion").length;

  // Active downloads count
  const activeDownloads = db.downloads.filter((d) => d.status === "downloading").length;

  // Storage total calculation
  let totalBytes = 0;
  db.media_files.forEach((file) => {
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

  const totalSizeMB = (totalBytes / (1024 * 1024)).toFixed(1);

  // List of all system users (excluding sensitive password hashes)
  const safeUsers = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    filesCount: db.media_files.filter((f) => f.userId === u.id).length,
  }));

  // Top downloads list
  const recentDownloads = db.downloads.slice(-10).reverse();

  // Audit logs
  const auditLogs = dbOps.getAuditLogs().slice(0, 30);

  res.json({
    stats: {
      totalUsers,
      totalDownloads,
      totalFiles,
      totalConversions,
      activeDownloads,
      totalSizeMB: `${totalSizeMB} MB`,
    },
    users: safeUsers,
    recentDownloads,
    auditLogs,
  });
});

// 2. Toggle User Admin status
router.post("/users/:id/toggle-admin", authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  const userIdx = db.users.findIndex((u) => u.id === req.params.id);

  if (userIdx === -1) {
    return res.status(404).json({ error: "Usuário não localizado." });
  }

  // Do not let admin demote themselves to prevent lockout
  if (db.users[userIdx].id === req.user!.id) {
    return res.status(400).json({ error: "Você não pode remover seus próprios privilégios administrativos." });
  }

  const newAdminStatus = !db.users[userIdx].isAdmin;
  db.users[userIdx].isAdmin = newAdminStatus;
  writeDatabase(db);

  dbOps.addAuditLog(req.user!.id, req.user!.email, `Alterou privilégio admin de ${db.users[userIdx].email} para ${newAdminStatus}`, req);

  res.json({ message: `Privilégio de administrador atualizado para ${db.users[userIdx].name}.`, user: db.users[userIdx] });
});

// 3. Delete user account from admin panel
router.delete("/users/:id", authMiddleware, adminOnly, (req: AuthenticatedRequest, res: Response) => {
  const db = readDatabase();
  const userIdx = db.users.findIndex((u) => u.id === req.params.id);

  if (userIdx === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  if (db.users[userIdx].id === req.user!.id) {
    return res.status(400).json({ error: "Não é permitido excluir sua própria conta enquanto estiver logado como administrador." });
  }

  const targetUser = db.users[userIdx];

  // Remove user, files, downloads, history, settings
  db.users = db.users.filter((u) => u.id !== targetUser.id);
  db.media_files = db.media_files.filter((m) => m.userId !== targetUser.id);
  db.downloads = db.downloads.filter((d) => d.userId !== targetUser.id);
  db.history = db.history.filter((h) => h.userId !== targetUser.id);
  db.settings = db.settings.filter((s) => s.userId !== targetUser.id);

  writeDatabase(db);

  dbOps.addAuditLog(req.user!.id, req.user!.email, `Excluiu a conta do usuário ${targetUser.email}`, req);

  res.json({ message: `Conta de ${targetUser.name} (${targetUser.email}) excluída definitivamente.` });
});

export default router;
