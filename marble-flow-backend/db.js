const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
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
      "quantityUnit" TEXT NOT NULL,
      location TEXT NOT NULL,
      image TEXT,
      price REAL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      "staffName" TEXT NOT NULL,
      action TEXT NOT NULL,
      "tileName" TEXT NOT NULL,
      quantity REAL NOT NULL,
      "quantityUnit" TEXT NOT NULL,
      location TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config_types (
      id TEXT PRIMARY KEY,
      value TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS config_sizes (
      id TEXT PRIMARY KEY,
      value TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS config_godowns (
      id TEXT PRIMARY KEY,
      value TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (parseInt(rows[0].count) === 0) {
    const hash = bcrypt.hashSync('1234', 10);
    await pool.query(
      'INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)',
      [randomUUID(), 'admin', hash]
    );
    console.log('Default user created — username: admin  password: 1234');
  }

  const { rows: typeRows } = await pool.query('SELECT COUNT(*) AS count FROM config_types');
  if (parseInt(typeRows[0].count) === 0) {
    for (const v of ['Gloss', 'Matt', 'Carving']) {
      await pool.query('INSERT INTO config_types (id, value) VALUES ($1, $2) ON CONFLICT DO NOTHING', [randomUUID(), v]);
    }
  }

  const { rows: sizeRows } = await pool.query('SELECT COUNT(*) AS count FROM config_sizes');
  if (parseInt(sizeRows[0].count) === 0) {
    for (const v of ['2x2', '2x4', '12x18']) {
      await pool.query('INSERT INTO config_sizes (id, value) VALUES ($1, $2) ON CONFLICT DO NOTHING', [randomUUID(), v]);
    }
  }

  const { rows: godownRows } = await pool.query('SELECT COUNT(*) AS count FROM config_godowns');
  if (parseInt(godownRows[0].count) === 0) {
    for (const v of ['D Godown', 'A Godown', 'B1 Godown', 'B2 Godown', 'Main Godown', 'Side Godown']) {
      await pool.query('INSERT INTO config_godowns (id, value) VALUES ($1, $2) ON CONFLICT DO NOTHING', [randomUUID(), v]);
    }
  }
}

module.exports = { pool, initDb };

