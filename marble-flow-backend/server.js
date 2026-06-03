require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const authRoutes = require('./routes/auth');
const tilesRoutes = require('./routes/tiles');
const logsRoutes = require('./routes/logs');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config');
const { initDb, pool } = require('./db');
const { sendBackup } = require('./telegram');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/billing-products', async (_req, res) => {
  const BILLING_API_URL = process.env.BILLING_API_URL || 'http://localhost:3002';
  try {
    const billingRes = await fetch(`${BILLING_API_URL}/api/items/public`);
    if (!billingRes.ok) {
      const errorText = await billingRes.text();
      return res.status(502).json({ error: 'Failed to fetch billing products', detail: errorText });
    }
    const products = await billingRes.json();
    res.json(products);
  } catch (err) {
    console.error('Billing products fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch billing products' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/tiles', tilesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);

const PORT = process.env.PORT || 3001;
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Idempotent migration: add source column to tiles if missing
    pool.query("ALTER TABLE tiles ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual'").catch(e => console.error('Migration:', e.message));

    // Idempotent migration: add price column to tiles if missing
    pool.query("ALTER TABLE tiles ADD COLUMN IF NOT EXISTS price REAL").catch(e => console.error('Migration:', e.message));

    // Keep DB connection pool warm every 14 min (prevents Railway cold-start DB reconnect)
    cron.schedule('*/14 * * * *', async () => {
      try { await pool.query('SELECT 1'); } catch (e) { console.error('Keepalive failed:', e.message); }
    });

    // Hourly Telegram backup
    cron.schedule('0 * * * *', async () => {
      console.log('Running scheduled Telegram backup...');
      try {
        await sendBackup(pool);
        console.log('Scheduled backup sent successfully');
      } catch (err) {
        console.error('Scheduled backup failed:', err.message);
      }
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

