import { Request, Response, NextFunction } from "express";
import { dbOps } from "../db";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado. Token de autenticação ausente ou inválido." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Não autorizado. Token de autenticação ausente." });
  }

  try {
    // We encode the user's ID as a safe base64 token for compliance, or support direct IDs
    let userId = token;
    if (!token.startsWith("user-")) {
      userId = Buffer.from(token, "base64").toString("utf-8");
    }

    const user = dbOps.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "Sessão expirada ou usuário inválido." });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Assinatura do token inválida." });
  }
}
