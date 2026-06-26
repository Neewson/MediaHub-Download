import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  try {
    const { default: app } = await import("../server");
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Boot Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Boot Error",
      message: err?.message || String(err),
      stack: err?.stack || ""
    });
  }
}
