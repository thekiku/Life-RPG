import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { authRouter } from './routes/auth.js';
import { taskRouter } from './routes/tasks.js';
import { statRouter } from './routes/stats.js';
import { requireAuth } from './auth.js';
import { getDb } from './db.js';
import { seedDb } from './seed.js';

const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cookieParser());
if (CLIENT_ORIGIN !== '*') app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
else app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

// Initialize DB on boot
await getDb();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, taskRouter);
app.use('/api/stats', requireAuth, statRouter);

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/seed', async (req, res, next) => {
    try {
      const result = await seedDb();
      return res.json(result);
    } catch (err) {
      next(err);
    }
  });
}

app.get('/api/ping', (req, res) => {
  return res.json({ ok: true, timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`QUESTLOG server running @ http://localhost:${PORT}`);
  });
}

export default app;