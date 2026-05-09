require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tilesRoutes = require('./routes/tiles');
const logsRoutes = require('./routes/logs');
const { initDb } = require('./db');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

const BILLING_API_URL = process.env.BILLING_API_URL || 'http://localhost:3002';

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

const PORT = process.env.PORT || 3001;
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
