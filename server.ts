import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple in-memory session store
const validTokens = new Set<string>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  app.use(express.json({ limit: "50mb" }));

  // --- Auth API Routes ---
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(32).toString("hex");
      validTokens.add(token);
      return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
  });

  app.get("/api/verify", (req, res) => {
    const token = req.query.token as string;
    if (token && validTokens.has(token)) {
      return res.json({ valid: true });
    }
    return res.json({ valid: false });
  });

  app.post("/api/logout", (req, res) => {
    const { token } = req.body;
    if (token) {
      validTokens.delete(token);
    }
    return res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin password: ${ADMIN_PASSWORD === "admin123" ? "admin123 (DEFAULT - CHANGE IN PRODUCTION!)" : "Configured from env"}`);
  });
}

startServer();
