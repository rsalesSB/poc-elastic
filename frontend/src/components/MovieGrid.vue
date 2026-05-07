<script setup>
import MovieCard from './MovieCard.vue';

defineProps({
  hits: { type: Array, required: true }
});
</script>

<template>
  <div v-if="hits.length" class="grid">
    <MovieCard v-for="hit in hits" :key="hit.id" :hit="hit" />
  </div>
  <div v-else class="empty">
    <p>No results.</p>
    <p class="hint">Try a less restrictive filter, or search a different term.</p>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.empty {
  background: var(--panel);
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 48px 16px;
  text-align: center;
  color: var(--muted);
}

.empty p {
  margin: 0;
}

.hint {
  font-size: 12px;
  margin-top: 8px !important;
}
</style>
