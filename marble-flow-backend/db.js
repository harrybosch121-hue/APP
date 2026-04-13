const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    quantityUnit TEXT NOT NULL,
    location TEXT NOT NULL,
    image TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    staffName TEXT NOT NULL,
    action TEXT NOT NULL,
    tileName TEXT NOT NULL,
    quantity REAL NOT NULL,
    quantityUnit TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

// Seed default admin user if none exists
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('1234', 10);
  db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
    .run(randomUUID(), 'admin', hash);
  console.log('Default user created — username: admin  password: 1234');
}

module.exports = db;
