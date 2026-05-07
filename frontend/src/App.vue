<script setup>
import { ref, onMounted, computed } from 'vue';
import { search } from './api.js';
import SearchBar from './components/SearchBar.vue';
import FacetSidebar from './components/FacetSidebar.vue';
import MovieGrid from './components/MovieGrid.vue';

const query = ref('');
const selectedGenres = ref([]);
const minRating = ref(null);
const from = ref(0);
const pageSize = 20;

const result = ref({ hits: [], facets: { genres: [], years: [] }, total: 0, took_ms: 0 });
const loading = ref(false);
const error = ref(null);

const totalPages = computed(() => Math.ceil(result.value.total / pageSize));
const currentPage = computed(() => Math.floor(from.value / pageSize) + 1);

const runSearch = async () => {
  loading.value = true;
  error.value = null;
  try {
    result.value = await search({
      q: query.value,
      genres: selectedGenres.value,
      minRating: minRating.value,
      from: from.value,
      size: pageSize
    });
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const onSearchSubmit = (q) => {
  query.value = q;
  from.value = 0;
  runSearch();
};

const onSuggestSelect = (s) => {
  query.value = s.title;
  from.value = 0;
  runSearch();
};

const onFiltersChange = ({ genres, minRating: rating }) => {
  selectedGenres.value = genres;
  minRating.value = rating;
  from.value = 0;
  runSearch();
};

const goToPage = (page) => {
  from.value = (page - 1) * pageSize;
  runSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(runSearch);
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎬 Movie Search <span class="badge">Elasticsearch POC</span></h1>
      <SearchBar
        :model-value="query"
        @submit="onSearchSubmit"
        @select="onSuggestSelect"
      />
    </header>

    <main class="main">
      <FacetSidebar
        :facets="result.facets"
        :selected-genres="selectedGenres"
        :min-rating="minRating"
        @change="onFiltersChange"
      />

      <section class="results">
        <div class="results-meta">
          <span v-if="loading">Searching…</span>
          <span v-else-if="error" class="error">Error: {{ error }}</span>
          <span v-else>
            <strong>{{ result.total.toLocaleString() }}</strong> results
            <span class="took">({{ result.took_ms }}ms)</span>
            <span v-if="query" class="meta-q">for "<em>{{ query }}</em>"</span>
            <span v-if="!query" class="meta-q">— sorted by popularity</span>
          </span>
        </div>

        <MovieGrid :hits="result.hits" />

        <nav v-if="totalPages > 1" class="pager">
          <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">←</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">→</button>
        </nav>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 24px 32px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h1 {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  font-size: 11px;
  font-weight: 500;
  background: var(--accent);
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  padding: 24px 32px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
}

.results-meta {
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 13px;
}

.results-meta strong {
  color: var(--text);
}

.took {
  color: var(--muted);
  margin-left: 4px;
}

.meta-q {
  margin-left: 8px;
}

.error {
  color: #f87171;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  color: var(--muted);
}

.pager button {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager button:not(:disabled):hover {
  border-color: var(--accent);
}

@media (max-width: 800px) {
  .main {
    grid-template-columns: 1fr;
  }
}
</style>
