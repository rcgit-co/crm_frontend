<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { dealApi } from '../api/deal.js'
import { refs } from '../stores/refs.js'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'
import { money, date, initials, DEFAULT_STAGES } from '../lib/format.js'
import DataState from '../components/DataState.vue'
import Modal from '../components/Modal.vue'
import MoneyInput from '../components/MoneyInput.vue'
import Icon from '../components/Icon.vue'
import DealDetail from '../components/DealDetail.vue'

const loading = ref(true)
const error = ref('')
const deals = ref([])
const stages = ref(DEFAULT_STAGES)
const dragId = ref(null)
const dragOver = ref(null)
const selected = ref(null)

const showCreate = ref(false)
const saving = ref(false)
const form = reactive({ title: '', amount: '', stage: 'new', comment: '', client_id: '', property_id: '', owner_user_id: '' })

// Цветовые акценты стадий
const STAGE_COLORS = { new: 'var(--blue)', in_progress: 'var(--green)', deal: 'var(--ok)', archived: 'var(--ink-faint)' }
const PALETTE = ['var(--blue)', 'var(--green)', 'var(--gold)', 'var(--ok)', 'var(--rose)']
function stageColor(code, i) { return STAGE_COLORS[code] || PALETTE[i % PALETTE.length] }

// ——— Горизонтальная прокрутка доски ———
const boardEl = ref(null)
const atStart = ref(true)
const atEnd = ref(true)
function syncScroll() {
  const el = boardEl.value
  if (!el) return
  atStart.value = el.scrollLeft <= 4
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
}
function scrollBoard(dir) { boardEl.value?.scrollBy({ left: dir * 320, behavior: 'smooth' }) }

async function load() {
  loading.value = true; error.value = ''
  try {
    refs.ensureAll()
    try {
      const s = await dealApi.stages()
      if (s.items?.length) stages.value = s.items.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((x) => ({ code: x.code, title: x.title || x.code }))
    } catch { /* fallback */ }
    deals.value = (await dealApi.list({ limit: 200, offset: 0 })).items
  } catch (e) { error.value = e.message } finally {
    loading.value = false
    await nextTick(); syncScroll()
  }
}
onMounted(() => { load(); window.addEventListener('resize', syncScroll) })
onBeforeUnmount(() => window.removeEventListener('resize', syncScroll))

function stageKey(d) { return d.stage || 'new' }
const byStage = computed(() => {
  const map = {}; stages.value.forEach((s) => (map[s.code] = []))
  deals.value.forEach((d) => { const k = stageKey(d); (map[k] = map[k] || []).push(d) })
  return map
})
function stageTotal(code) { return (byStage.value[code] || []).reduce((s, d) => s + (Number(d.amount) || 0), 0) }
const boardTotal = computed(() => ({
  count: deals.value.length,
  amount: deals.value.reduce((s, d) => s + (Number(d.amount) || 0), 0),
}))

function onDragStart(d) { dragId.value = d.id }
function onDragEnd() { dragId.value = null; dragOver.value = null }
async function onDrop(stage) {
  const id = dragId.value; dragId.value = null; dragOver.value = null
  if (!id) return
  const deal = deals.value.find((x) => x.id === id)
  if (!deal || stageKey(deal) === stage.code) return
  const prev = stageKey(deal); deal.stage = stage.code
  try { await dealApi.setStage(id, stage.code); toasts.ok(`Сделка → «${stage.title}»`) }
  catch (e) { deal.stage = prev; toasts.err(e) }
}

async function create() {
  saving.value = true
  try {
    const payload = {
      title: form.title, amount: form.amount ? Number(form.amount) : null, stage: form.stage, comment: form.comment || null,
      client_id: form.client_id || null, property_id: form.property_id || null, owner_user_id: form.owner_user_id || null,
    }
    const d = await dealApi.create(payload)
    if (d?.id) deals.value.unshift(d); else await load()
    toasts.ok('Сделка создана'); showCreate.value = false
    Object.assign(form, { title: '', amount: '', stage: 'new', comment: '', client_id: '', property_id: '', owner_user_id: '' })
    await nextTick(); syncScroll()
  } catch (e) { toasts.err(e) } finally { saving.value = false }
}

function openCreate() { refs.ensureAll(); showCreate.value = true }
async function onDetailChanged() { deals.value = (await dealApi.list({ limit: 200, offset: 0 })).items }
</script>

<template>
  <div>
    <div class="page-head spread">
      <div><h1>Сделки</h1><p class="sub">Перетаскивайте карточки между стадиями · клик открывает связи и дела</p></div>
      <button class="primary" @click="openCreate"><Icon name="plus" :size="16" /> Новая сделка</button>
    </div>

    <DataState :loading="loading" :error="error" variant="block">
      <!-- Сводка по доске -->
      <div class="summary" v-reveal>
        <div class="sm-item"><span class="sm-label">Всего сделок</span><strong class="num">{{ boardTotal.count }}</strong></div>
        <div class="sm-sep"></div>
        <div class="sm-item"><span class="sm-label">Общая сумма</span><strong class="num accent">{{ money(boardTotal.amount) }}</strong></div>
        <div class="sm-sep"></div>
        <div class="sm-item"><span class="sm-label">Стадий</span><strong class="num">{{ stages.length }}</strong></div>
      </div>

      <div class="board-wrap">
        <div class="edge left" :class="{ show: !atStart }"></div>
        <div class="edge right" :class="{ show: !atEnd }"></div>
        <button v-if="!atStart" class="scroll-btn left" @click="scrollBoard(-1)" aria-label="Левее"><Icon name="chevron-left" :size="20" /></button>
        <button v-if="!atEnd" class="scroll-btn right" @click="scrollBoard(1)" aria-label="Правее"><Icon name="chevron-right" :size="20" /></button>

        <div class="board" ref="boardEl" @scroll="syncScroll">
          <div v-for="(s, si) in stages" :key="s.code" class="col" :class="{ over: dragOver === s.code }"
               @dragover.prevent="dragOver = s.code" @dragleave="dragOver = (dragOver === s.code ? null : dragOver)" @drop="onDrop(s)"
               :style="{ '--accent': stageColor(s.code, si) }">
            <div class="col-bar"></div>
            <div class="col-head">
              <span class="ctitle">{{ s.title }}</span>
              <span class="col-count">{{ (byStage[s.code] || []).length }}</span>
            </div>
            <div class="col-sum num" v-if="stageTotal(s.code)">{{ money(stageTotal(s.code)) }}</div>

            <div class="cards">
              <div v-for="d in byStage[s.code]" :key="d.id" class="deal" :class="{ dragging: dragId === d.id }"
                   draggable="true" @dragstart="onDragStart(d)" @dragend="onDragEnd" @click="selected = d">
                <div class="dtitle">{{ d.title || 'Без названия' }}</div>
                <div class="damount num">{{ money(d.amount, d.currency || '₽') }}</div>
                <div class="links" v-if="refs.clientLabel(d.client_id) || refs.propertyLabel(d.property_id)">
                  <span v-if="refs.clientLabel(d.client_id)" class="lk"><Icon name="clients" :size="13" /> {{ refs.clientLabel(d.client_id) }}</span>
                  <span v-if="refs.propertyLabel(d.property_id)" class="lk"><Icon name="properties" :size="13" /> {{ refs.propertyLabel(d.property_id) }}</span>
                </div>
                <div class="deal-foot">
                  <span class="muted">{{ date(d.created_at) }}</span>
                  <span v-if="refs.employeeLabel(d.owner_user_id)" class="owner" :title="refs.employeeLabel(d.owner_user_id)">{{ initials(refs.employeeLabel(d.owner_user_id)) }}</span>
                </div>
              </div>
              <div v-if="!(byStage[s.code] || []).length" class="col-empty">Перетащите сюда</div>
            </div>
          </div>
        </div>
      </div>
    </DataState>

    <Modal v-if="showCreate" title="Новая сделка" wide @close="showCreate = false">
      <div class="grid" style="gap:14px">
        <div class="row" style="gap:12px">
          <div style="flex:2"><label>Название *</label><input v-model="form.title" placeholder="Продажа 2-к, Ленина 14" /></div>
          <div style="flex:1"><label>Сумма</label><MoneyInput v-model="form.amount" /></div>
          <div style="flex:1"><label>Стадия</label><select v-model="form.stage"><option v-for="s in stages" :key="s.code" :value="s.code">{{ s.title }}</option></select></div>
        </div>
        <div class="row" style="gap:12px">
          <div style="flex:1">
            <label>Клиент</label>
            <select v-model="form.client_id" :disabled="!refs.clients.length"><option value="">— не выбран —</option><option v-for="c in refs.clients" :key="c.id" :value="c.id">{{ refs.clientLabel(c.id) }}</option></select>
            <small v-if="!refs.clients.length" class="hint">Сначала добавьте клиента в разделе «Клиенты»</small>
          </div>
          <div style="flex:1">
            <label>Объект</label>
            <select v-model="form.property_id" :disabled="!refs.properties.length"><option value="">— не выбран —</option><option v-for="p in refs.properties" :key="p.id" :value="p.id">{{ p.title }}</option></select>
            <small v-if="!refs.properties.length" class="hint">Сначала добавьте объект в разделе «Объекты»</small>
          </div>
          <div v-if="auth.canManage" style="flex:1">
            <label>Ответственный</label>
            <select v-model="form.owner_user_id" :disabled="!refs.employees.length"><option value="">— не назначен —</option><option v-for="u in refs.employees" :key="u.id" :value="u.id">{{ refs.employeeLabel(u.id) }}</option></select>
            <small v-if="!refs.employees.length" class="hint">Сначала добавьте сотрудника</small>
          </div>
        </div>
        <div><label>Комментарий</label><textarea v-model="form.comment" rows="2" /></div>
      </div>
      <template #footer>
        <span v-if="!form.title.trim()" class="req-hint">Введите название сделки, чтобы создать</span>
        <button class="ghost" @click="showCreate = false">Отмена</button>
        <button class="primary" :disabled="saving || !form.title.trim()" @click="create">{{ saving ? 'Сохраняем…' : 'Создать' }}</button>
      </template>
    </Modal>

    <DealDetail v-if="selected" :deal="selected" :stages="stages" @close="selected = null" @changed="onDetailChanged" />
  </div>
</template>

<style scoped>
/* ——— Сводка ——— */
.summary { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 20px; margin-bottom: 18px; }
.sm-item { display: flex; flex-direction: column; gap: 3px; padding: 0 8px; }
.sm-label { font-size: 11.5px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
.sm-item strong { font-size: 22px; font-weight: 700; }
.sm-item .accent { color: var(--green); }
.sm-sep { width: 1px; align-self: stretch; background: var(--line); margin: 2px 12px; }

/* ——— Доска ——— */
.board-wrap { position: relative; }
.board { display: flex; gap: 14px; overflow-x: auto; padding: 4px 4px 14px; align-items: flex-start; scroll-padding: 14px; }
.col { position: relative; flex: 0 0 290px; background: var(--paper-2); border: 1px solid var(--line); border-radius: 16px; padding: 14px; min-height: 140px; transition: background .15s, box-shadow .15s, border-color .15s; overflow: hidden; }
.col.over { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); background: var(--card-2); }
.col-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); opacity: .85; }
.col-head { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.ctitle { font-weight: 700; font-size: 14.5px; letter-spacing: -.01em; display: flex; align-items: center; gap: 7px; }
.ctitle::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.col-count { font-size: 12px; font-weight: 700; color: var(--ink-faint); background: var(--card); border: 1px solid var(--line); min-width: 22px; text-align: center; padding: 1px 6px; border-radius: 999px; }
.col-sum { font-size: 12.5px; margin-top: 3px; color: var(--ink-soft); font-weight: 600; }

.cards { margin-top: 12px; display: grid; gap: 10px; min-height: 40px; }
.deal { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 13px; cursor: grab; box-shadow: var(--shadow); transition: transform .14s cubic-bezier(.2,.7,.2,1), box-shadow .16s, border-color .16s; }
.deal:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); border-color: var(--accent); }
.deal:active { cursor: grabbing; }
.deal.dragging { opacity: .45; transform: rotate(1.5deg); }
.dtitle { font-weight: 600; font-size: 13.5px; line-height: 1.35; }
.damount { font-weight: 700; font-size: 18px; color: var(--green-deep); margin: 7px 0; }
[data-theme="dark"] .damount { color: var(--green); }
.links { display: flex; flex-direction: column; gap: 5px; margin-bottom: 9px; }
.lk { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lk :deep(svg) { color: var(--ink-faint); flex: 0 0 auto; }
.deal-foot { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--line-soft); padding-top: 8px; }
.deal-foot .muted { font-size: 11.5px; }
.owner { width: 24px; height: 24px; border-radius: 50%; background: var(--green-soft); color: var(--green-deep); display: grid; place-items: center; font-size: 10px; font-weight: 700; }
[data-theme="dark"] .owner { color: var(--green); }
.col-empty { text-align: center; padding: 22px 0; font-size: 12.5px; color: var(--ink-faint); border: 1.5px dashed var(--line); border-radius: 10px; }
.req-hint { font-size: 12px; color: var(--gold-strong); margin-right: auto; align-self: center; }

/* затухание краёв */
.edge { position: absolute; top: 0; bottom: 14px; width: 56px; pointer-events: none; z-index: 2; opacity: 0; transition: opacity .2s; }
.edge.show { opacity: 1; }
.edge.left { left: 0; background: linear-gradient(90deg, var(--paper), transparent); }
.edge.right { right: 0; background: linear-gradient(270deg, var(--paper), transparent); }
.scroll-btn { position: absolute; top: 64px; z-index: 3; width: 36px; height: 36px; border-radius: 50%; padding: 0; display: grid; place-items: center; background: var(--card); box-shadow: var(--shadow-lg); color: var(--green-deep); border-color: transparent; }
[data-theme="dark"] .scroll-btn { color: var(--green); }
.scroll-btn.left { left: 6px; }
.scroll-btn.right { right: 6px; }
@media (max-width: 640px) {
  .scroll-btn { display: none; }
  .summary { flex-wrap: wrap; gap: 12px; }
  .sm-sep { display: none; }
}
</style>
