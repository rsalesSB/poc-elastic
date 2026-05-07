<script setup>
import { watch, ref, nextTick } from 'vue';

const props = defineProps({ visible: { type: Boolean, default: false } });
const emit = defineEmits(['close']);

const dialogRef = ref(null);

const operators = [
  { op: '"…"', example: '"Red Car"', desc: 'Exact phrase match' },
  { op: '+', example: '+2024', desc: 'Term must be present' },
  { op: '-', example: '-horror', desc: 'Exclude documents with this term' },
  { op: '*', example: 'spider*', desc: 'Prefix / wildcard search' },
  { op: '~N', example: 'robocop~2', desc: 'Fuzzy match (edit distance N)' },
  { op: '( )', example: '(car | bike)', desc: 'Group expressions together' },
  { op: '|', example: 'drama | comedy', desc: 'OR — match either term' }
];

const close = () => emit('close');

const onBackdropClick = (e) => {
  if (e.target === e.currentTarget) close();
};

const onKeydown = (e) => {
  if (e.key === 'Escape') close();
};

watch(() => props.visible, async (v) => {
  if (v) {
    await nextTick();
    dialogRef.value?.focus();
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="backdrop"
        @click="onBackdropClick"
        @keydown="onKeydown"
      >
        <div
          ref="dialogRef"
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Search operators reference"
          tabindex="-1"
        >
          <header class="dialog-header">
            <h2>Search Operators</h2>
            <button class="btn-close" aria-label="Close" @click="close">✕</button>
          </header>

          <div class="dialog-body">
            <p class="intro">
              Type these operators directly in the search box — works just like Google.
            </p>

            <table class="op-table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Example</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in operators" :key="o.op">
                  <td><code>{{ o.op }}</code></td>
                  <td><code class="example">{{ o.example }}</code></td>
                  <td>{{ o.desc }}</td>
                </tr>
              </tbody>
            </table>

            <div class="combo-section">
              <h3>Combine them</h3>
              <ul class="combos">
                <li><code>"Red Car" -used</code> — exact phrase, exclude "used"</li>
                <li><code>"Star Wars" +2024</code> — exact phrase, must include "2024"</li>
                <li><code>"Iron Man" | "Spider-Man"</code> — one phrase or the other</li>
              </ul>
            </div>
          </div>

          <footer class="dialog-footer">
            <a
              href="https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-simple-query-string-query"
              target="_blank"
              rel="noopener"
            >
              Learn more ↗
            </a>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 94vw;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  outline: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--border);
}

.dialog-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
}

.btn-close:hover {
  color: var(--text);
  background: var(--bg);
}

.dialog-body {
  padding: 20px 24px;
}

.intro {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 13px;
}

.op-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.op-table th {
  text-align: left;
  color: var(--muted);
  font-weight: 500;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.op-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.op-table tr:last-child td {
  border-bottom: none;
}

code {
  background: var(--bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12.5px;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  white-space: nowrap;
}

.example {
  color: var(--accent-2);
}

.combo-section {
  margin-top: 20px;
}

.combo-section h3 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 8px;
}

.combos {
  margin: 0;
  padding: 0 0 0 18px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.8;
}

.combos code {
  color: var(--text);
}

.dialog-footer {
  padding: 12px 24px 16px;
  border-top: 1px solid var(--border);
  text-align: right;
}

.dialog-footer a {
  color: var(--accent);
  font-size: 12px;
  text-decoration: none;
}

.dialog-footer a:hover {
  text-decoration: underline;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: scale(0.95);
}
</style>
