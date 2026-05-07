<script setup>
import { computed } from 'vue';

const props = defineProps({
  facets: { type: Object, required: true },
  selectedGenres: { type: Array, required: true },
  minRating: { type: Number, default: null }
});

const emit = defineEmits(['change']);

const toggleGenre = (genre) => {
  const next = props.selectedGenres.includes(genre)
    ? props.selectedGenres.filter(g => g !== genre)
    : [...props.selectedGenres, genre];
  emit('change', { genres: next, minRating: props.minRating });
};

const setRating = (e) => {
  const val = parseFloat(e.target.value);
  emit('change', { genres: props.selectedGenres, minRating: val > 0 ? val : null });
};

const clearAll = () => {
  emit('change', { genres: [], minRating: null });
};

const hasFilters = computed(() => props.selectedGenres.length > 0 || props.minRating != null);
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h3>Filters</h3>
      <button v-if="hasFilters" class="clear" @click="clearAll">Clear</button>
    </div>

    <div class="section">
      <h4>Rating ≥ {{ minRating ?? '—' }}</h4>
      <input
        type="range"
        min="0"
        max="9"
        step="0.5"
        :value="minRating ?? 0"
        @input="setRating"
      />
      <div class="range-labels">
        <span>0</span>
        <span>9</span>
      </div>
    </div>

    <div class="section">
      <h4>Genres</h4>
      <ul v-if="facets.genres.length" class="genre-list">
        <li v-for="g in facets.genres" :key="g.value">
          <label>
            <input
              type="checkbox"
              :checked="selectedGenres.includes(g.value)"
              @change="toggleGenre(g.value)"
            />
            <span class="genre-name">{{ g.value }}</span>
            <span class="genre-count">{{ g.count }}</span>
          </label>
        </li>
      </ul>
      <p v-else class="empty">No data</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  height: fit-content;
  position: sticky;
  top: 130px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--muted);
}

.clear {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
}

.section {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  margin-top: 14px;
}

.section:first-of-type {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
  margin-top: -4px;
}

.genre-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 360px;
  overflow-y: auto;
}

.genre-list li {
  margin: 2px 0;
}

.genre-list label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  font-size: 13px;
}

.genre-list input[type="checkbox"] {
  accent-color: var(--accent);
}

.genre-name {
  flex: 1;
}

.genre-count {
  color: var(--muted);
  font-size: 11px;
  background: var(--bg);
  padding: 1px 6px;
  border-radius: 8px;
}

.empty {
  color: var(--muted);
  font-style: italic;
  margin: 0;
  font-size: 12px;
}
</style>
