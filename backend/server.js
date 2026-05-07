import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { search, suggest, getById, es } from './searchService.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  req._start = Date.now();
  next();
});

app.get('/health', async (_req, res) => {
  const cluster = await es.cluster.health().catch(() => null);
  res.json({ status: 'ok', es: cluster?.status || 'unreachable' });
});

app.get('/search', async (req, res, next) => {
  try {
    const { q = '', genres = '', minRating, from = '0', size = '20' } = req.query;
    const result = await search({
      q: String(q).trim(),
      genres: genres ? String(genres).split(',').map(s => s.trim()).filter(Boolean) : [],
      minRating: minRating != null ? Number(minRating) : null,
      from: Math.max(0, parseInt(from, 10) || 0),
      size: Math.min(50, Math.max(1, parseInt(size, 10) || 20))
    });
    console.log(`GET /search q="${q}" genres="${genres}" min=${minRating ?? '-'} hits=${result.total} took=${Date.now() - req._start}ms`);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

app.get('/suggest', async (req, res, next) => {
  try {
    const { q = '', size = '5' } = req.query;
    const result = await suggest({
      q: String(q).trim(),
      size: Math.min(10, Math.max(1, parseInt(size, 10) || 5))
    });
    console.log(`GET /suggest q="${q}" results=${result.suggestions.length} took=${Date.now() - req._start}ms`);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

app.get('/movies/:id', async (req, res, next) => {
  try {
    const result = await getById(req.params.id);
    if (!result) return res.status(404).json({ error: 'not found' });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

app.use((err, _req, res, _next) => {
  console.error('ERROR:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`backend listening on http://localhost:${PORT}`);
  console.log(`  GET /health`);
  console.log(`  GET /search?q=...&genres=Action,Drama&minRating=7&from=0&size=20`);
  console.log(`  GET /suggest?q=spi&size=5`);
  console.log(`  GET /movies/:id`);
});
