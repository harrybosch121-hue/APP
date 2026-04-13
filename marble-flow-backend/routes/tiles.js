const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (_req, res) => {
  const tiles = db.prepare('SELECT * FROM tiles ORDER BY created_at DESC').all();
  res.json(tiles);
});

router.post('/', requireAuth, (req, res) => {
  const { name, type, size, quantity, quantityUnit, location, image } = req.body;
  if (!name || !type || !size || quantity === undefined || !quantityUnit || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = randomUUID();
  db.prepare(
    'INSERT INTO tiles (id, name, type, size, quantity, quantityUnit, location, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, type, size, quantity, quantityUnit, location, image || null);

  const logId = randomUUID();
  db.prepare(
    'INSERT INTO audit_logs (id, staffName, action, tileName, quantity, quantityUnit, location, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(logId, req.user.username, 'Added', name, quantity, quantityUnit, location, new Date().toISOString());

  res.status(201).json({ id, name, type, size, quantity, quantityUnit, location, image: image || null });
});

router.put('/:id/stock', requireAuth, (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity required' });
  }

  const tile = db.prepare('SELECT * FROM tiles WHERE id = ?').get(req.params.id);
  if (!tile) return res.status(404).json({ error: 'Tile not found' });

  db.prepare('UPDATE tiles SET quantity = ? WHERE id = ?').run(quantity, req.params.id);

  const diff = quantity - tile.quantity;
  if (diff !== 0) {
    const logId = randomUUID();
    db.prepare(
      'INSERT INTO audit_logs (id, staffName, action, tileName, quantity, quantityUnit, location, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      logId, req.user.username, diff > 0 ? 'Added' : 'Removed',
      tile.name, Math.abs(diff), tile.quantityUnit, tile.location,
      new Date().toISOString()
    );
  }

  res.json({ ...tile, quantity });
});

router.post('/:id/remove', requireAuth, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Valid quantity required' });
  }

  const tile = db.prepare('SELECT * FROM tiles WHERE id = ?').get(req.params.id);
  if (!tile) return res.status(404).json({ error: 'Tile not found' });

  const newQty = Math.max(0, tile.quantity - quantity);
  db.prepare('UPDATE tiles SET quantity = ? WHERE id = ?').run(newQty, req.params.id);

  const logId = randomUUID();
  db.prepare(
    'INSERT INTO audit_logs (id, staffName, action, tileName, quantity, quantityUnit, location, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(logId, req.user.username, 'Removed', tile.name, quantity, tile.quantityUnit, tile.location, new Date().toISOString());

  res.json({ ...tile, quantity: newQty });
});

module.exports = router;
