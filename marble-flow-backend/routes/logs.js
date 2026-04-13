const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (_req, res) => {
  const logs = db.prepare(
    'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200'
  ).all();
  res.json(logs);
});

module.exports = router;
