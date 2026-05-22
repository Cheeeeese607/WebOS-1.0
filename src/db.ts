import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Create the connection pool lazily so the server doesn't crash on startup 
// if credentials are missing.
let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DB_HOST) {
      console.warn("DB_HOST environment variable is missing. Database operations will fail.");
    }
    
    let host = process.env.DB_HOST;
    if (host) {
      host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    
    pool = mysql.createPool({
      host: host,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });
  }
  return pool;
}

export async function syncDB() {
  const p = getPool();
  try {
    const connection = await p.getConnection();
    console.log("Connected to MySQL database.");

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await connection.query('ALTER TABLE users ADD COLUMN token VARCHAR(255);');
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }

    // Seed default admin user
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
    if ((userRows as any)[0].count === 0) {
      await connection.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin123']);
      console.log("Default admin created (admin / admin123)");
    }

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(50) UNIQUE NOT NULL,
        value TEXT
      )
    `);

    // Create locations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT,
        image_url VARCHAR(500),
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create attributes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attributes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50)
      )
    `);

    // Seed checking for locations date/type upgrade and posts views
    // Since IF NOT EXISTS skips if table exists, we may need to alter if upgrading an old table setup
    // But since this is a new app, we rely on the create table statement.
    // If the tables were created without these columns, standard SQL requires ALTER TABLE.
    // For safety, let's try to add them if they don't exist (MySQL way is tricky, usually we catch the error).
    
    try {
      await connection.query('ALTER TABLE locations ADD COLUMN date VARCHAR(50);');
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }
    
    try {
      await connection.query('ALTER TABLE locations ADD COLUMN type VARCHAR(50);');
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }
    
    try {
      await connection.query('ALTER TABLE posts ADD COLUMN views INT DEFAULT 0;');
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.log(e.message); }

    connection.release();
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Database sync failed:", error);
  }
}
