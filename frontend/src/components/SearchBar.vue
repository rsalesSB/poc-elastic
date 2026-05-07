<script setup>
import { ref, watch } from 'vue';
import { suggest } from '../api.js';

const props = defineProps({ modelValue: { type: String, default: '' } });
const emit = defineEmits(['submit', 'select']);

const localQuery = ref(props.modelValue);
const suggestions = ref([]);
const showDropdown = ref(false);
const highlightedIndex = ref(-1);

let debounceTimer = null;

watch(() => props.modelValue, v => { localQuery.value = v; });

watch(localQuery, async (q) => {
  clearTimeout(debounceTimer);
  if (!q || q.length < 2) {
    suggestions.value = [];
    return;
  }
  debounceTimer = setTimeout(async () => {
    try {
      const r = await suggest(q);
      suggestions.value = r.suggestions || [];
      highlightedIndex.value = -1;
    } catch (e) {
      suggestions.value = [];
    }
  }, 250);
});

const onSubmit = () => {
  showDropdown.value = false;
  emit('submit', localQuery.value);
};

const onSelect = (s) => {
  localQuery.value = s.title;
  suggestions.value = [];
  showDropdown.value = false;
  emit('select', s);
};

const onKeydown = (e) => {
  if (!suggestions.value.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
  } else if (e.key === 'Enter' && highlightedIndex.value >= 0) {
    e.preventDefault();
    onSelect(suggestions.value[highlightedIndex.value]);
  } else if (e.key === 'Escape') {
    showDropdown.value = false;
  }
};

const onBlur = () => {
  // Delay so a click on a suggestion still registers.
  setTimeout(() => { showDropdown.value = false; }, 150);
};
</script>

<template>
  <div class="search-bar">
    <div class="search-wrap">
      <input
        type="text"
        v-model="localQuery"
        placeholder='Search movies… ("phrase" for exact, +required, -exclude, term*)'
        @keydown="onKeydown"
        @keydown.enter="onSubmit"
        @focus="showDropdown = true"
        @blur="onBlur"
      />
      <button class="btn-search" @click="onSubmit">Search</button>
    </div>

    <ul v-if="showDropdown && suggestions.length" class="dropdown">
      <li
        v-for="(s, i) in suggestions"
        :key="s.id"
        :class="{ highlighted: i === highlightedIndex }"
        @mousedown.prevent="onSelect(s)"
      >
        <img v-if="s.poster_url" :src="s.poster_url" alt="" class="thumb" />
        <div v-else class="thumb thumb-placeholder">🎬</div>
        <div class="info">
          <div class="title">{{ s.title }}</div>
          <div class="year">{{ s.year || '—' }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
}

.search-wrap {
  display: flex;
  gap: 0;
}

input[type="text"] {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-right: none;
  padding: 12px 16px;
  font-size: 15px;
  border-radius: 8px 0 0 8px;
  outline: none;
  transition: border-color 0.15s;
}

input[type="text"]:focus {
  border-color: var(--accent);
}

.btn-search {
  background: var(--accent);
  color: white;
  border: 1px solid var(--accent);
  padding: 0 22px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-search:hover {
  background: var(--accent-2);
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 360px;
  overflow-y: auto;
  z-index: 20;
}

.dropdown li {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  cursor: pointer;
  align-items: center;
}

.dropdown li.highlighted,
.dropdown li:hover {
  background: var(--bg);
}

.thumb {
  width: 36px;
  height: 54px;
  object-fit: cover;
  border-radius: 3px;
  background: var(--bg);
  flex-shrink: 0;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.info .title {
  font-weight: 500;
  font-size: 14px;
}

.info .year {
  font-size: 12px;
  color: var(--muted);
}
</style>
