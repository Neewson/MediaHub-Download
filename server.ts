import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import authRoutes from "./server/routes/auth";
import downloadRoutes, { tickActiveDownloads } from "./server/routes/downloads";
import libraryRoutes from "./server/routes/library";
import mediaRoutes from "./server/routes/media";
import adminRoutes from "./server/routes/admin";
import { getDownloadsDir, readDatabase } from "./server/db";

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// Initialize downloads-data directory
const downloadsDir = getDownloadsDir();
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Custom route to serve physically downloaded media files with resilient remote redirect fallback
app.get("/downloaded-media/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(downloadsDir, filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  // File not found on disk (e.g. under serverless / ephemeral Vercel environment)
  // Let's resolve the actual media item from the database and redirect to the real source URL
  try {
    const fileId = path.parse(filename).name; // e.g. "dl-1234" or "media-1234"
    const db = readDatabase();
    
    // Look up in downloads or media_files
    const dl = db.downloads.find((d) => d.id === fileId || `media-${d.id}` === fileId);
    const media = db.media_files.find((m) => m.id === fileId || m.id.replace("media-", "") === fileId);

    const remoteUrl = dl?.resolvedUrl || dl?.url || media?.resolvedUrl || media?.url;

    if (remoteUrl && remoteUrl.startsWith("http")) {
      console.log(`[Vercel Streaming Proxy] Redirecting to real source URL: ${remoteUrl}`);
      return res.redirect(remoteUrl);
    }
  } catch (err) {
    console.error("Error fallback-redirecting media:", err);
  }

  return res.status(404).send("Arquivo de mídia não encontrado.");
});

// Security and Utilities middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// XSS protection header simulated for requirement
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

// Base API routes
app.use("/api/auth", authRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);

// Simple live healthcheck endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Background active download tick loop
setInterval(() => {
  tickActiveDownloads();
}, 3500); // Progress tick every 3.5 seconds

// Integrate Vite for single-port experience
const isProd = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"));

async function setupFrontend() {
  if (process.env.VERCEL) {
    console.log("Running in Vercel Serverless environment. Skipping frontend middleware.");
    return;
  }

  if (!isProd) {
    console.log("Starting in DEVELOPMENT mode, spinning up Vite dev server...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      // Use vite's connect instance as middleware
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error("Failed to load Vite server:", viteErr);
    }
  } else {
    console.log("Starting in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running as a Vercel serverless function
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`MediaHub Download Full-Stack Server running on port ${PORT}`);
  });
}

setupFrontend().catch((err) => {
  console.error("Critical error starting frontend setup:", err);
});

export default app;
