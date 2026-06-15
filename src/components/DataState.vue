<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  loading: Boolean,
  error: String,
  empty: Boolean,
  emptyText: { type: String, default: 'Пока пусто' },
  // вид скелетона: table | cards | list | kpis | block
  variant: { type: String, default: 'block' },
  // включён ли поиск/фильтр — чтобы отличить «база пуста» от «ничего не найдено»
  searching: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
})
const emit = defineEmits(['reset'])

// «Загружаем данные…» появляется только при долгом ответе, чтобы не мигать на быстрых.
const slow = ref(false)
let timer = null
watch(() => props.loading, (v) => {
  clearTimeout(timer)
  if (v) { slow.value = false; timer = setTimeout(() => { slow.value = true }, 700) }
  else slow.value = false
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <!-- Скелетон рендерится с первого кадра — никакого «белого экрана» -->
  <div v-if="loading" class="ds-skel" aria-busy="true">
    <template v-if="variant === 'kpis'">
      <div class="kpi-skel"><div class="skel" v-for="i in 3" :key="i" /></div>
    </template>
    <template v-else-if="variant === 'cards'">
      <div class="cards-skel"><div class="card-skel" v-for="i in 6" :key="i">
        <div class="skel l-badge" /><div class="skel l-title" /><div class="skel l-price" /><div class="skel l-meta" />
      </div></div>
    </template>
    <template v-else-if="variant === 'list'">
      <div class="list-skel"><div class="row-skel" v-for="i in 6" :key="i">
        <div class="skel l-check" /><div class="skel l-line" /><div class="skel l-tag" />
      </div></div>
    </template>
    <template v-else-if="variant === 'table'">
      <div class="table-skel"><div class="row-skel" v-for="i in 6" :key="i">
        <div class="skel l-ava" /><div class="skel l-line" /><div class="skel l-tag" />
      </div></div>
    </template>
    <template v-else>
      <div class="block-skel"><div class="skel" v-for="i in 4" :key="i" /></div>
    </template>
    <p v-if="slow" class="slow muted">Загружаем данные…</p>
  </div>

  <div v-else-if="error" class="state err">
    <strong>Не удалось загрузить</strong>
    <span class="muted">{{ error }}</span>
  </div>

  <!-- Пустой результат поиска ≠ пустая база -->
  <div v-else-if="empty && searching" class="state">
    <div class="ico"><Icon name="search" :size="22" /></div>
    <strong>Ничего не найдено<span v-if="searchQuery"> по запросу «{{ searchQuery }}»</span></strong>
    <span class="muted">Попробуйте изменить запрос или сбросить фильтры</span>
    <button class="sm" @click="emit('reset')">Сбросить фильтры</button>
  </div>

  <div v-else-if="empty" class="state">
    <span class="muted">{{ emptyText }}</span>
  </div>

  <slot v-else />
</template>

<style scoped>
.state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 52px 20px; color: var(--ink-soft); text-align: center; }
.state.err strong { color: var(--rose); }
.state .ico { width: 46px; height: 46px; border-radius: 50%; background: var(--paper-2); color: var(--ink-faint); display: grid; place-items: center; font-size: 22px; margin-bottom: 2px; }

.ds-skel { padding: 6px; }
.slow { text-align: center; margin: 18px 0 6px; font-size: 13px; }

.kpi-skel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-skel .skel { height: 104px; border-radius: var(--radius); }

.cards-skel { display: grid; grid-template-columns: repeat(auto-fill, minmax(248px, 1fr)); gap: 16px; }
.card-skel { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 18px; display: grid; gap: 10px; }
.l-badge { height: 16px; width: 40%; }
.l-title { height: 18px; width: 80%; }
.l-price { height: 24px; width: 55%; }
.l-meta { height: 13px; width: 65%; }

.list-skel, .table-skel { display: grid; gap: 2px; padding: 6px 10px; }
.row-skel { display: flex; align-items: center; gap: 14px; padding: 14px 6px; border-bottom: 1px solid var(--line-soft); }
.row-skel:last-child { border-bottom: none; }
.l-check, .l-ava { width: 28px; height: 28px; border-radius: 50%; flex: 0 0 auto; }
.l-line { height: 14px; flex: 1; }
.l-tag { height: 16px; width: 80px; border-radius: 999px; flex: 0 0 auto; }

.block-skel { display: grid; gap: 12px; padding: 8px; }
.block-skel .skel { height: 20px; }
.block-skel .skel:nth-child(1) { width: 60%; }
.block-skel .skel:nth-child(2) { width: 90%; }
.block-skel .skel:nth-child(3) { width: 75%; }
.block-skel .skel:nth-child(4) { width: 85%; }
</style>
