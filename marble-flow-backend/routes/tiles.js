const express = require('express');
const { randomUUID } = require('crypto');
const { pool } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tiles ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { name, type, size, quantity, quantityUnit, location, image, source } = req.body;
  if (!name || !type || !size || quantity === undefined || !quantityUnit || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO tiles (id, name, type, size, quantity, "quantityUnit", location, image, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, name, type, size, quantity, quantityUnit, location, image || null, source || 'manual']
    );

    const logId = randomUUID();
    await pool.query(
      'INSERT INTO audit_logs (id, "staffName", action, "tileName", quantity, "quantityUnit", location, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [logId, req.user.username, 'Added', name, quantity, quantityUnit, location, new Date().toISOString()]
    );

    res.status(201).json({ id, name, type, size, quantity, quantityUnit, location, image: image || null, source: source || 'manual' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/stock', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM tiles WHERE id = $1', [req.params.id]);
    const tile = rows[0];
    if (!tile) return res.status(404).json({ error: 'Tile not found' });

    await pool.query('UPDATE tiles SET quantity = $1 WHERE id = $2', [quantity, req.params.id]);

    const diff = quantity - tile.quantity;
    if (diff !== 0) {
      const logId = randomUUID();
      await pool.query(
        'INSERT INTO audit_logs (id, "staffName", action, "tileName", quantity, "quantityUnit", location, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [logId, req.user.username, diff > 0 ? 'Added' : 'Removed', tile.name, Math.abs(diff), tile.quantityUnit, tile.location, new Date().toISOString()]
      );
    }

    res.json({ ...tile, quantity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/remove', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Valid quantity required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM tiles WHERE id = $1', [req.params.id]);
    const tile = rows[0];
    if (!tile) return res.status(404).json({ error: 'Tile not found' });

    const newQty = Math.max(0, tile.quantity - quantity);
    await pool.query('UPDATE tiles SET quantity = $1 WHERE id = $2', [newQty, req.params.id]);

    const logId = randomUUID();
    await pool.query(
      'INSERT INTO audit_logs (id, "staffName", action, "tileName", quantity, "quantityUnit", location, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [logId, req.user.username, 'Removed', tile.name, quantity, tile.quantityUnit, tile.location, new Date().toISOString()]
    );

    res.json({ ...tile, quantity: newQty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
