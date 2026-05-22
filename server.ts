import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { getPool, syncDB } from "./src/db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Wait for DB sync
  await syncDB();

  // Simple Auth Middleware
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const token = authHeader.split(' ')[1];
      const [rows] = await getPool().query('SELECT * FROM users WHERE token = ?', [token]);
      if ((rows as any[]).length > 0) {
        return next();
      }
      res.status(401).json({ error: "Unauthorized" });
    } catch (e) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // ----- API Routes -----

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { password } = req.body;
      const [rows] = await getPool().query('SELECT * FROM users WHERE username = ? AND password = ?', ['admin', password]);
      if ((rows as any[]).length > 0) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await getPool().query('UPDATE users SET token = ? WHERE username = ?', [token, 'admin']);
        return res.json({ token, success: true });
      }
      return res.status(401).json({ success: false, message: "密码错误" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // Change Password
  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword) return res.status(400).json({ error: "需要新密码" });
      await getPool().query('UPDATE users SET password = ? WHERE username = ?', [newPassword, 'admin']);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT key_name, value FROM settings');
      const settingsMap: Record<string, string> = {};
      (rows as any[]).forEach(row => {
        settingsMap[row.key_name] = row.value;
      });
      res.json(settingsMap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = req.body;
      const pool = getPool();
      
      const promises = Object.entries(settings).map(([key, value]) => {
        return pool.query(
          'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          [key, value, value]
        );
      });
      await Promise.all(promises);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Attributes
  app.get("/api/attributes", async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM attributes');
      res.json(rows || []);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post("/api/attributes", requireAuth, async (req, res) => {
    try {
      const { title, description, icon } = req.body;
      if (!title) return res.status(400).json({ error: "Missing title" });
      const [result] = await getPool().query(
        'INSERT INTO attributes (title, description, icon) VALUES (?, ?, ?)',
        [title, description, icon || 'Code2']
      );
      res.json({ success: true, id: (result as any).insertId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/attributes/:id", requireAuth, async (req, res) => {
    try {
      await getPool().query('DELETE FROM attributes WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Locations
  app.get("/api/locations", async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM locations ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error: any) {
      res.json([]); // Return empty array on error as requested "如果没有则返回空数组"
    }
  });

  app.post("/api/locations", requireAuth, async (req, res) => {
    try {
      const { name, longitude, latitude, description, date, type } = req.body;
      if (!name || longitude === undefined || latitude === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const [result] = await getPool().query(
        'INSERT INTO locations (name, longitude, latitude, description, date, type) VALUES (?, ?, ?, ?, ?, ?)',
        [name, longitude, latitude, description, date, type || 'travel']
      );
      res.json({ success: true, id: (result as any).insertId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/locations/:id", requireAuth, async (req, res) => {
    try {
      await getPool().query('DELETE FROM locations WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const [rows] = await getPool().query('SELECT * FROM posts ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error: any) {
      res.json([]);
    }
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const { title, content, image_url } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Missing title or content" });
      
      const [result] = await getPool().query(
        'INSERT INTO posts (title, content, image_url, views) VALUES (?, ?, ?, 0)',
        [title, content, image_url]
      );
      res.json({ success: true, id: (result as any).insertId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      await getPool().query('DELETE FROM posts WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      await getPool().query(
        'UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?',
        [req.params.id]
      );
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
