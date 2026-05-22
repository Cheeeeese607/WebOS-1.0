import Database from 'better-sqlite3';
import path from 'path';

let db: ReturnType<typeof Database> | null = null;

export function getDB() {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'database.sqlite'));
  }
  return db;
}

export function syncDB() {
  try {
    const connection = getDB();
    console.log("Connected to SQLite database.");

    // Create users table
    connection.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default admin user
    const state = connection.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin') as { count: number };
    if (state.count === 0) {
      connection.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', 'admin123');
      console.log("Default admin created (admin / admin123)");
    }

    // Create settings table
    connection.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_name VARCHAR(50) UNIQUE NOT NULL,
        value TEXT
      )
    `);

    // Create locations table
    connection.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        longitude DECIMAL(10,6) NOT NULL,
        latitude DECIMAL(10,6) NOT NULL,
        description TEXT,
        date VARCHAR(50),
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts table
    connection.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        image_url VARCHAR(500),
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attributes table
    connection.exec(`
      CREATE TABLE IF NOT EXISTS attributes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50)
      )
    `);

    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Database sync failed:", error);
  }
}
