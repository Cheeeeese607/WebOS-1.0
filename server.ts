import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { getDB, syncDB } from "./src/db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Wait for DB sync
  syncDB();

  // Simple Auth Middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const token = authHeader.split(' ')[1];
      const row = getDB().prepare('SELECT * FROM users WHERE token = ?').get(token);
      if (row) {
        return next();
      }
      res.status(401).json({ error: "Unauthorized" });
    } catch (e) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // ----- API Routes -----

  // Login
  app.post("/api/login", (req, res) => {
    try {
      const { password } = req.body;
      const row = getDB().prepare('SELECT * FROM users WHERE username = ? AND password = ?').get('admin', password);
      if (row) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        getDB().prepare('UPDATE users SET token = ? WHERE username = ?').run(token, 'admin');
        return res.json({ token, success: true });
      }
      return res.status(401).json({ success: false, message: "密码错误" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // Change Password
  app.post("/api/change-password", requireAuth, (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword) return res.status(400).json({ error: "需要新密码" });
      getDB().prepare('UPDATE users SET password = ? WHERE username = ?').run(newPassword, 'admin');
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    try {
      const rows = getDB().prepare('SELECT key_name, value FROM settings').all();
      const settingsMap: Record<string, string> = {};
      rows.forEach((row: any) => {
        settingsMap[row.key_name] = row.value;
      });
      res.json(settingsMap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", requireAuth, (req, res) => {
    try {
      const settings = req.body;
      const db = getDB();
      
      const stmt = db.prepare('INSERT INTO settings (key_name, value) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET value = ?');
      const transaction = db.transaction(() => {
        Object.entries(settings).forEach(([key, value]) => {
          stmt.run(key, value, value);
        });
      });
      transaction();

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Attributes
  app.get("/api/attributes", (req, res) => {
    try {
      const rows = getDB().prepare('SELECT * FROM attributes').all();
      res.json(rows || []);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post("/api/attributes", requireAuth, (req, res) => {
    try {
      const { title, description, icon } = req.body;
      if (!title) return res.status(400).json({ error: "Missing title" });
      const result = getDB().prepare('INSERT INTO attributes (title, description, icon) VALUES (?, ?, ?)').run(title, description, icon || 'Code2');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/attributes/:id", requireAuth, (req, res) => {
    try {
      getDB().prepare('DELETE FROM attributes WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Locations
  app.get("/api/locations", (req, res) => {
    try {
      const rows = getDB().prepare('SELECT * FROM locations ORDER BY created_at DESC').all();
      res.json(rows || []);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post("/api/locations", requireAuth, (req, res) => {
    try {
      const { name, longitude, latitude, description, date, type } = req.body;
      if (!name || longitude === undefined || latitude === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const result = getDB().prepare('INSERT INTO locations (name, longitude, latitude, description, date, type) VALUES (?, ?, ?, ?, ?, ?)').run(name, longitude, latitude, description, date, type || 'travel');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/locations/:id", requireAuth, (req, res) => {
    try {
      getDB().prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Posts
  app.get("/api/posts", (req, res) => {
    try {
      const rows = getDB().prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
      res.json(rows || []);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post("/api/posts", requireAuth, (req, res) => {
    try {
      const { title, content, image_url } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Missing title or content" });
      
      const result = getDB().prepare('INSERT INTO posts (title, content, image_url, views) VALUES (?, ?, ?, 0)').run(title, content, image_url);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/posts/:id", requireAuth, (req, res) => {
    try {
      getDB().prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/posts/:id/view", (req, res) => {
    try {
      getDB().prepare('UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ----- Vite / Frontend Serving -----
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
