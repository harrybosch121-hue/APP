const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// GET /api/config - returns dynamic types, sizes, godowns for the frontend
router.get('/', async (_req, res) => {
  try {
    const [types, sizes, godowns] = await Promise.all([
      pool.query('SELECT id, value FROM config_types ORDER BY created_at ASC'),
      pool.query('SELECT id, value FROM config_sizes ORDER BY created_at ASC'),
      pool.query('SELECT id, value FROM config_godowns ORDER BY created_at ASC'),
    ]);
    res.json({
      types: types.rows.map(r => r.value),
      sizes: sizes.rows.map(r => r.value),
      godowns: godowns.rows.map(r => r.value),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

