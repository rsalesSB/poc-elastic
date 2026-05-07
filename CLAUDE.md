# CLAUDE.md — Elasticsearch POC

Context guide for Claude Code sessions working on this project.

## Overview

POC to demonstrate full-text search with Elasticsearch. Core use case: given a query like "Red Car", find and rank documents that match in the `title`, `short_description`, and `content` fields, prioritizing matches in the title. The POC is in English — it is intended for a demo with an international team.

The POC will progressively demonstrate:

- Relevance via `multi_match` with per-field boosts
- Highlighting of matched snippets
- Typo tolerance (`fuzziness: AUTO`)
- Autocomplete via the `completion` field
- Facets / aggregations by genre and year

## Stack

| Layer       | Technology                                       | Status         |
| ----------- | ------------------------------------------------ | -------------- |
| Search      | Elasticsearch 8.13.4 (single-node, security off) | Part 1 ✅      |
| Admin UI    | Kibana 8.13.4 (Dev Tools)                        | Part 1 ✅      |
| Ingestion   | Node.js + `@elastic/elasticsearch` client        | Part 2 ✅      |
| Data source | TMDB API (API key required)                      | Part 2 ✅      |
| Backend     | Node.js + Express                                | Part 3 ✅      |
| Frontend    | Vue 3 + Vite                                     | Part 4 ✅      |

## Planned structure

```
poc-elastic/
├── docker-compose.yml        # ES + Kibana
├── mappings/
│   └── movies.json           # PUT /movies — analyzer and schema
├── ingestion/                # (Part 2) Node seed script using TMDB
├── backend/                  # (Part 3) Express API with /search
├── frontend/                 # (Part 4) Vue 3 + Vite
├── README.md                 # step-by-step for the current part
└── CLAUDE.md                 # this file
```

## How to run (current state)

```bash
docker compose up -d
curl http://localhost:9200          # should return JSON with cluster_name
open http://localhost:5601          # Kibana → Dev Tools
```

Paste the contents of [mappings/movies.json](mappings/movies.json) into Dev Tools and execute it to create the index.

### Useful commands

```bash
docker compose up -d                            # start
docker compose logs -f elasticsearch            # tail ES logs
docker compose down                             # stop (data preserved)
docker compose down -v                          # stop and wipe volume (full reset)
```

## Conventions and decisions

- **Field names in English** (`title`, `genres`, `year`, `release_date`, `vote_average`, `popularity`). Keep consistent across ingestion, backend, and frontend.
- **Single analyzer `english_analyzer`** chains `english_possessive_stemmer` + `lowercase` + `asciifolding` + English stopwords + English stemmer. Ensures "running cars" matches "car runs" and possessives like "Disney's" are normalized.
- **Agreed search strategy** (to be implemented in Part 3):
  ```json
  {
    "multi_match": {
      "query": "<term>",
      "type": "best_fields",
      "fields": ["title^3", "short_description^2", "content^1"],
      "fuzziness": "AUTO"
    }
  }
  ```
- **Multi-fields on `title`**: `text` (search), `keyword` (sort/exact), `completion` (autocomplete).
- **Never expose Elasticsearch directly to the frontend.** The Express layer in Part 3 acts as a search proxy — better security and a single place to customize query/ranking.
- **Single-node, 1 shard, 0 replicas.** It's a POC; replication adds no value here.
- **ES heap**: Elastic's rule of thumb is 50% of available RAM, max ~31GB. Adjust `ES_JAVA_OPTS=-Xms<N>g -Xmx<N>g` in docker-compose based on real volume.
- **Security disabled** (`xpack.security.enabled=false`) — only for local POC use. Do not carry this setting into any environment beyond localhost.

## Where decisions live

- [README.md](README.md) — executable step-by-step for the current part (concrete instructions for the user to run).
- [CLAUDE.md](CLAUDE.md) — this file, persistent project view: stack, conventions, decisions.
- `mappings/*.json` — versioned schema for each index.

## Status by part

- **Part 1 — Infra + Mapping** ✅ docker-compose, `movies` mapping, and this CLAUDE.md ready.
- **Part 2 — TMDB ingestion** ✅ `ingestion/seed.js` fetches from TMDB and bulk-indexes via `--reset`. Run with `cd ingestion && npm install && npm run seed -- --reset`.
- **Part 3 — Express backend** ✅ `backend/` exposes `/search`, `/suggest`, `/movies/:id`, `/health` on port 3000. Search DSL (multi_match, boosts, highlight, aggs) lives in `backend/searchService.js`. Run with `cd backend && npm install && npm start`.
- **Part 4 — Vue frontend** ✅ `frontend/` is a Vite + Vue 3 SPA on port 5173. Components: `SearchBar` (autocomplete), `FacetSidebar` (genres + rating slider), `MovieGrid`, `MovieCard` (poster + highlighted title/desc + score). Vite proxies `/api/*` to backend. Run with `cd frontend && npm install && npm run dev`.
