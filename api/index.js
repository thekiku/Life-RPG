// vercel serverless function handler
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { authRouter } from '../server/src/routes/auth.js';
import { taskRouter } from '../server/src/routes/tasks.js';
import { statRouter } from '../server/src/routes/stats.js';
import { requireAuth } from '../server/src/auth.js';

const app = express();

app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, taskRouter);
app.use('/api/stats', requireAuth, statRouter);

app.get('/api/ping', (req, res) => {
  return res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
