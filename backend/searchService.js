import { Client } from '@elastic/elasticsearch';

const ES_URL = process.env.ES_URL || 'http://localhost:9200';
const INDEX = process.env.INDEX || 'movies';

export const es = new Client({ node: ES_URL });

export const search = async ({ q, genres, minRating, from, size }) => {
  // Google-style query syntax: "phrase" for exact, +required, -excluded, term*, term~N
  // Default OR for broad recall on plain queries (Mario Bros → all Mario films).
  // Switch to AND when the user uses `-` (exclude), because OR + MUST_NOT degenerates
  // in Lucene and the exclusion stops working — AND ensures `-Term` actually excludes.
  const hasExclusion = /(^|\s)-\S/.test(q);
  const defaultOp = hasExclusion ? 'AND' : 'OR';

  const must = q
    ? [{
        simple_query_string: {
          query: q,
          fields: ['title^3', 'short_description^2', 'content^1'],
          default_operator: defaultOp
        }
      }]
    : [{ match_all: {} }];

  // Boost docs where the query terms appear as an adjacent phrase, even without quotes.
  // Keeps "best matches" at the top when user types Spider-Man without quoting it.
  const should = q
    ? [{
        multi_match: {
          query: q,
          type: 'phrase',
          fields: ['title^3', 'short_description^2'],
          slop: 1
        }
      }]
    : [];

  const filter = [];
  if (genres.length) filter.push({ terms: { genres } });
  if (minRating != null && !Number.isNaN(minRating)) {
    filter.push({ range: { vote_average: { gte: minRating } } });
  }

  const sort = q ? ['_score'] : [{ popularity: 'desc' }];

  const resp = await es.search({
    index: INDEX,
    from,
    size,
    query: { bool: { must, should, filter } },
    sort,
    highlight: {
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
      fields: {
        title: {},
        short_description: { fragment_size: 150, number_of_fragments: 2 }
      }
    },
    aggs: {
      by_genre: { terms: { field: 'genres', size: 15 } },
      by_year: { histogram: { field: 'year', interval: 5, min_doc_count: 1 } }
    }
  });

  return {
    total: resp.hits.total.value,
    took_ms: resp.took,
    hits: resp.hits.hits.map(h => ({
      id: h._id,
      score: h._score,
      ...h._source,
      highlight: h.highlight || {}
    })),
    facets: {
      genres: resp.aggregations.by_genre.buckets.map(b => ({ value: b.key, count: b.doc_count })),
      years: resp.aggregations.by_year.buckets.map(b => ({ value: b.key, count: b.doc_count }))
    }
  };
};

export const suggest = async ({ q, size }) => {
  if (!q) return { suggestions: [] };
  const resp = await es.search({
    index: INDEX,
    size: 0,
    suggest: {
      title_suggest: {
        prefix: q,
        completion: { field: 'title.suggest', size, skip_duplicates: true }
      }
    }
  });
  const options = resp.suggest.title_suggest[0]?.options || [];
  return {
    suggestions: options.map(o => ({
      text: o.text,
      id: o._id,
      title: o._source?.title,
      year: o._source?.year,
      poster_url: o._source?.poster_url
    }))
  };
};

export const getById = async (id) => {
  try {
    const resp = await es.get({ index: INDEX, id });
    return { id: resp._id, ...resp._source };
  } catch (e) {
    if (e.meta?.statusCode === 404) return null;
    throw e;
  }
};
