// Vite proxies /api/* to the backend on :3000 (see vite.config.js).
const BASE = '/api';

const buildUrl = (path, params = {}) => {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v);
  }
  return url;
};

export const search = async ({ q = '', genres = [], minRating, from = 0, size = 20 } = {}) => {
  const url = buildUrl('/search', { q, genres, minRating, from, size });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/search ${res.status}`);
  return res.json();
};

export const suggest = async (q) => {
  if (!q || q.length < 2) return { suggestions: [] };
  const url = buildUrl('/suggest', { q, size: 5 });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/suggest ${res.status}`);
  return res.json();
};
