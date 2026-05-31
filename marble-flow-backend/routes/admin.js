const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { pool } = require('../db');
const requireAuth = require('../middleware/auth');
const { sendBackup } = require('../telegram');

const router = express.Router();

// All admin routes require auth + admin role
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.username !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}
router.use(requireAdmin);

/* ─── Types ─── */
router.get('/types', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, value FROM config_types ORDER BY created_at ASC');
  res.json(rows);
});
router.post('/types', async (req, res) => {
  const { value } = req.body;
  if (!value?.trim()) return res.status(400).json({ error: 'Value required' });
  try {
    const id = randomUUID();
    await pool.query('INSERT INTO config_types (id, value) VALUES ($1, $2)', [id, value.trim()]);
    res.status(201).json({ id, value: value.trim() });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' });
    res.status(500).json({ error: err.message });
  }
});
router.delete('/types/:id', async (req, res) => {
  await pool.query('DELETE FROM config_types WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ─── Sizes ─── */
router.get('/sizes', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, value FROM config_sizes ORDER BY created_at ASC');
  res.json(rows);
});
router.post('/sizes', async (req, res) => {
  const { value } = req.body;
  if (!value?.trim()) return res.status(400).json({ error: 'Value required' });
  try {
    const id = randomUUID();
    await pool.query('INSERT INTO config_sizes (id, value) VALUES ($1, $2)', [id, value.trim()]);
    res.status(201).json({ id, value: value.trim() });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' });
    res.status(500).json({ error: err.message });
  }
});
router.delete('/sizes/:id', async (req, res) => {
  await pool.query('DELETE FROM config_sizes WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ─── Godowns ─── */
router.get('/godowns', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, value FROM config_godowns ORDER BY created_at ASC');
  res.json(rows);
});
router.post('/godowns', async (req, res) => {
  const { value } = req.body;
  if (!value?.trim()) return res.status(400).json({ error: 'Value required' });
  try {
    const id = randomUUID();
    await pool.query('INSERT INTO config_godowns (id, value) VALUES ($1, $2)', [id, value.trim()]);
    res.status(201).json({ id, value: value.trim() });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already exists' });
    res.status(500).json({ error: err.message });
  }
});
router.delete('/godowns/:id', async (req, res) => {
  await pool.query('DELETE FROM config_godowns WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ─── Users ─── */
router.get('/users', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, username FROM users ORDER BY username');
  res.json(rows);
});
router.post('/users', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = randomUUID();
    await pool.query('INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)', [id, username.trim(), hash]);
    res.status(201).json({ id, username: username.trim() });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
});
router.put('/users/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  const hash = bcrypt.hashSync(password, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
  res.json({ ok: true });
});
router.delete('/users/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT username FROM users WHERE id = $1', [req.params.id]);
  if (rows[0]?.username === 'admin') return res.status(400).json({ error: 'Cannot delete admin' });
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

/* ─── Products (Tiles) ─── */
  router.get('/products', async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM tiles ORDER BY name ASC');
    res.json(rows);
  });
  router.post('/products', async (req, res) => {
    const { name, type, size, quantity, quantityUnit, location } = req.body;
    if (!name?.trim() || !type || !size || quantity === undefined || !quantityUnit || !location) {
      return res.status(400).json({ error: 'All fields required' });
    }
    try {
      const id = randomUUID();
      const { rows } = await pool.query(
        'INSERT INTO tiles (id, name, type, size, quantity, "quantityUnit", location) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [id, name.trim(), type, size, Number(quantity), quantityUnit, location]
      );
      res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.put('/products/:id', async (req, res) => {
    const { name, type, size, quantity, quantityUnit, location } = req.body;
    try {
      const { rows } = await pool.query(
        'UPDATE tiles SET name=$1, type=$2, size=$3, quantity=$4, "quantityUnit"=$5, location=$6 WHERE id=$7 RETURNING *',
        [name, type, size, Number(quantity), quantityUnit, location, req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.delete('/products/:id', async (req, res) => {
    await pool.query('DELETE FROM tiles WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  /* ─── Telegram Backup ─── */
router.post('/backup', async (_req, res) => {
  try {
    const result = await sendBackup(pool);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

