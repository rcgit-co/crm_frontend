<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { clientApi } from '../api/client.js'
import { toasts } from '../stores/toast.js'
import { date, CLIENT_STATUS, INTERACTION_TYPES, clientName, initials, formatPhoneRu, EMAIL_RE } from '../lib/format.js'
import DataState from '../components/DataState.vue'
import Modal from '../components/Modal.vue'
import Icon from '../components/Icon.vue'

const loading = ref(true)
const error = ref('')
const all = ref([])
const search = ref('')
const statusFilter = ref('')

const showForm = ref(false)
const saving = ref(false)
const editing = ref(null)
const form = reactive({ last_name: '', first_name: '', middle_name: '', phone: '', email: '', source: '', status: 'lead' })
const fe = ref({})   // ошибки по полям

const detail = ref(null)
const tags = ref([]); const notes = ref([]); const interactions = ref([])
const newTag = ref(''); const newNote = ref('')
const inter = reactive({ type: 'call', summary: '', direction: 'out' })
const detailLoading = ref(false)

async function load() {
  loading.value = true; error.value = ''
  try {
    const res = await clientApi.list({ limit: 200, offset: 0 })
    all.value = res.items
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(load)

const searching = computed(() => !!(search.value.trim() || statusFilter.value))
function resetFilters() { search.value = ''; statusFilter.value = '' }

const items = computed(() => {
  const q = search.value.trim().toLowerCase()
  return all.value.filter((c) => {
    if (statusFilter.value && c.status !== statusFilter.value) return false
    if (!q) return true
    return [clientName(c), c.phone, c.email].filter(Boolean).join(' ').toLowerCase().includes(q)
  })
})

function openCreate() {
  editing.value = null
  Object.assign(form, { last_name: '', first_name: '', middle_name: '', phone: '', email: '', source: '', status: 'lead' })
  fe.value = {}
  showForm.value = true
}
function openEdit(c) {
  editing.value = c
  Object.assign(form, { last_name: c.last_name || '', first_name: c.first_name || '', middle_name: c.middle_name || '', phone: formatPhoneRu(c.phone) || '', email: c.email || '', source: c.source || '', status: c.status || 'lead' })
  fe.value = {}
  showForm.value = true
}

// Маска телефона: оставляем только цифры, приводим к +7 (XXX) XXX-XX-XX.
function onPhoneInput(e) {
  form.phone = formatPhoneRu(e.target.value)
  if (fe.value.phone) fe.value = { ...fe.value, phone: '' }
}
function phoneDigits() { return form.phone.replace(/\D/g, '') }
function clearFieldError(field) { if (fe.value[field]) fe.value = { ...fe.value, [field]: '' } }

function validate() {
  const e = {}
  if (!form.first_name.trim()) e.first_name = 'Имя обязательно'
  // email проверяем по маске, если заполнен
  if (form.email && !EMAIL_RE.test(form.email.trim())) e.email = 'Похоже на некорректный email (нужен @ и домен)'
  // телефон: если заполнен — должен содержать 11 цифр (российский формат)
  const d = phoneDigits()
  if (form.phone.trim() && d.length !== 11) e.phone = 'Телефон: 11 цифр, формат +7 (XXX) XXX-XX-XX'
  fe.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) { toasts.err('Проверьте поля формы'); return }
  saving.value = true
  try {
    const payload = { ...form, phone: phoneDigits() ? '+' + phoneDigits() : '', email: form.email.trim() }
    if (editing.value) { await clientApi.update(editing.value.id, payload); toasts.ok('Клиент обновлён') }
    else { await clientApi.create(payload); toasts.ok('Клиент добавлен') }
    showForm.value = false; await load()
  } catch (e) {
    const errs = e?.payload?.errors
    if (errs && typeof errs === 'object') fe.value = { ...fe.value, ...errs }
    toasts.err(e)
  } finally { saving.value = false }
}
async function convert(c) {
  try { await clientApi.convert(c.id); toasts.ok('Лид → контакт'); await load() }
  catch (e) { toasts.err(e) }
}

async function openDetail(c) {
  detail.value = c; detailLoading.value = true
  tags.value = []; notes.value = []; interactions.value = []
  try {
    const [tg, nt, it] = await Promise.allSettled([
      clientApi.tags(c.id), clientApi.notes(c.id), clientApi.interactions(c.id),
    ])
    if (tg.status === 'fulfilled') tags.value = tg.value.items
    if (nt.status === 'fulfilled') notes.value = nt.value.items
    if (it.status === 'fulfilled') interactions.value = it.value.items
  } finally { detailLoading.value = false }
}
async function addTag() {
  if (!newTag.value.trim()) return
  try { await clientApi.addTag(detail.value.id, newTag.value.trim()); tags.value.push({ tag: newTag.value.trim() }); newTag.value = '' }
  catch (e) { toasts.err(e) }
}
async function addNote() {
  if (!newNote.value.trim()) return
  try { await clientApi.addNote(detail.value.id, newNote.value.trim()); notes.value.unshift({ body: newNote.value.trim(), created_at: new Date().toISOString() }); newNote.value = '' }
  catch (e) { toasts.err(e) }
}
async function addInteraction() {
  if (!inter.summary.trim()) return
  try {
    await clientApi.addInteraction(detail.value.id, { type: inter.type, summary: inter.summary.trim(), direction: inter.direction })
    interactions.value.unshift({ type: inter.type, summary: inter.summary.trim(), direction: inter.direction, occurred_at: new Date().toISOString() })
    inter.summary = ''
  } catch (e) { toasts.err(e) }
}
function tagText(t) { return typeof t === 'string' ? t : (t.tag || t.name) }
</script>

<template>
  <div>
    <div class="page-head spread">
      <div><h1>Клиенты</h1><p class="sub">Лиды и контакты агентства</p></div>
      <button class="primary" @click="openCreate">+ Клиент</button>
    </div>

    <div class="toolbar card">
      <input v-model="search" placeholder="Поиск по ФИО, телефону, email…" style="max-width:340px" />
      <select v-model="statusFilter" style="max-width:180px">
        <option value="">Все</option>
        <option value="lead">Лиды</option>
        <option value="contact">Контакты</option>
      </select>
    </div>

    <div class="card" style="margin-top:14px;overflow:hidden">
      <DataState
        :loading="loading" :error="error" :empty="!items.length"
        variant="table" empty-text="Клиентов нет — добавьте первого клиента"
        :searching="searching" :search-query="search" @reset="resetFilters"
      >
        <div class="table-scroll table-cards"><table>
          <thead><tr><th>Клиент</th><th>Контакты</th><th>Статус</th><th>Источник</th><th></th></tr></thead>
          <tbody>
            <tr v-for="c in items" :key="c.id">
              <td data-label="Клиент">
                <div class="row" style="gap:11px">
                  <span class="ava" :class="c.status">{{ initials(clientName(c)) }}</span>
                  <a href="#" @click.prevent="openDetail(c)"><strong>{{ clientName(c) }}</strong></a>
                </div>
              </td>
              <td data-label="Контакты">
                <div class="contact"><Icon name="phone" :size="13" /> {{ c.phone ? formatPhoneRu(c.phone) : '—' }}</div>
                <div class="contact muted" v-if="c.email"><Icon name="mail" :size="13" /> {{ c.email }}</div>
              </td>
              <td data-label="Статус"><span class="badge" :class="(CLIENT_STATUS[c.status]||{}).cls || 'gray'"><span class="dot" />{{ (CLIENT_STATUS[c.status]||{}).label || c.status }}</span></td>
              <td class="muted" data-label="Источник">{{ c.source || '—' }}</td>
              <td class="actions-cell" style="text-align:right;white-space:nowrap">
                <button v-if="c.status === 'lead'" class="sm ghost" @click="convert(c)">В контакт</button>
                <button class="sm ghost" @click="openEdit(c)">Изм.</button>
              </td>
            </tr>
          </tbody>
        </table></div>
      </DataState>
    </div>

    <Modal v-if="showForm" :title="editing ? 'Редактирование клиента' : 'Новый клиент'" @close="showForm = false">
      <div class="grid" style="gap:14px">
        <div class="row" style="gap:12px">
          <div style="flex:1"><label>Фамилия</label><input v-model="form.last_name" /></div>
          <div style="flex:1">
            <label>Имя *</label>
            <input v-model="form.first_name" :class="{ bad: fe.first_name }" />
            <small v-if="fe.first_name" class="fe">{{ fe.first_name }}</small>
          </div>
        </div>
        <div><label>Отчество</label><input v-model="form.middle_name" /></div>
        <div class="row" style="gap:12px">
          <div style="flex:1">
            <label>Телефон</label>
            <input :value="form.phone" @input="onPhoneInput" inputmode="tel" placeholder="+7 (___) ___-__-__" :class="{ bad: fe.phone }" />
            <small v-if="fe.phone" class="fe">{{ fe.phone }}</small>
          </div>
          <div style="flex:1">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="client@mail.ru" :class="{ bad: fe.email }" @input="clearFieldError('email')" />
            <small v-if="fe.email" class="fe">{{ fe.email }}</small>
          </div>
        </div>
        <div class="row" style="gap:12px">
          <div style="flex:1"><label>Статус</label><select v-model="form.status"><option value="lead">Лид</option><option value="contact">Контакт</option></select></div>
          <div style="flex:1"><label>Источник</label><input v-model="form.source" placeholder="сайт, реклама…" /></div>
        </div>
      </div>
      <template #footer>
        <span v-if="!form.first_name.trim()" class="req-hint">Укажите имя клиента, чтобы сохранить</span>
        <button class="ghost" @click="showForm = false">Отмена</button>
        <button class="primary" :disabled="saving || !form.first_name.trim()" @click="save">{{ saving ? '…' : 'Сохранить' }}</button>
      </template>
    </Modal>

    <Modal v-if="detail" :title="clientName(detail)" wide @close="detail = null">
      <div class="profile-head">
        <span class="ava lg" :class="detail.status">{{ initials(clientName(detail)) }}</span>
        <div class="ph-info">
          <span class="badge" :class="(CLIENT_STATUS[detail.status]||{}).cls || 'gray'"><span class="dot" />{{ (CLIENT_STATUS[detail.status]||{}).label || detail.status }}</span>
          <div class="ph-contacts">
            <span v-if="detail.phone" class="ph-c"><Icon name="phone" :size="14" /> {{ formatPhoneRu(detail.phone) }}</span>
            <span v-if="detail.email" class="ph-c"><Icon name="mail" :size="14" /> {{ detail.email }}</span>
            <span v-if="detail.source" class="ph-c"><Icon name="tag" :size="14" /> {{ detail.source }}</span>
          </div>
        </div>
        <button class="sm ghost ph-edit" @click="openEdit(detail); detail = null">Изменить</button>
      </div>
      <DataState :loading="detailLoading" variant="block">
        <div class="dgrid">
          <div>
            <h4>Теги</h4>
            <div class="tags">
              <span v-for="(tg,i) in tags" :key="i" class="badge blue">{{ tagText(tg) }}</span>
              <span v-if="!tags.length" class="muted">нет тегов</span>
            </div>
            <div class="row" style="margin-top:10px;gap:8px">
              <input v-model="newTag" placeholder="новый тег" @keyup.enter="addTag" />
              <button class="sm" @click="addTag">+</button>
            </div>

            <h4 style="margin-top:22px">Взаимодействия</h4>
            <div class="row" style="gap:8px;margin-bottom:10px">
              <select v-model="inter.type" style="max-width:120px"><option v-for="(l,k) in INTERACTION_TYPES" :key="k" :value="k">{{ l }}</option></select>
              <input v-model="inter.summary" placeholder="что произошло" @keyup.enter="addInteraction" />
              <button class="sm" @click="addInteraction">+</button>
            </div>
            <ul class="timeline">
              <li v-for="(it,i) in interactions" :key="i">
                <span class="tl-type">{{ INTERACTION_TYPES[it.type] || it.type }}</span>
                <div class="tl-sum">{{ it.summary || '—' }}</div>
                <span class="muted tl-date">{{ date(it.occurred_at || it.created_at, true) }}</span>
              </li>
              <li v-if="!interactions.length" class="muted tl-empty">пока пусто</li>
            </ul>
          </div>
          <div>
            <h4>Заметки</h4>
            <div class="row" style="gap:8px;margin-bottom:12px">
              <input v-model="newNote" placeholder="добавить заметку" @keyup.enter="addNote" />
              <button class="sm" @click="addNote">+</button>
            </div>
            <ul class="notes">
              <li v-for="(n,i) in notes" :key="i" class="card" style="padding:11px 13px">
                <div>{{ n.body || n.note || n.text }}</div>
                <span class="muted" style="font-size:11.5px">{{ date(n.created_at, true) }}</span>
              </li>
              <li v-if="!notes.length" class="muted">нет заметок</li>
            </ul>
          </div>
        </div>
      </DataState>
    </Modal>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 12px; padding: 12px 14px; }
.ava { width: 32px; height: 32px; border-radius: 50%; background: var(--green-soft); color: var(--green-deep); display: grid; place-items: center; font-weight: 700; font-size: 11px; flex: 0 0 auto; box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--line); }
[data-theme="dark"] .ava { color: var(--green); }
.ava.contact { box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--ok); }
.ava.lead { box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--gold); }
.contact { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.contact :deep(svg) { color: var(--ink-faint); flex: 0 0 auto; }
.contact + .contact { margin-top: 3px; }
.req-hint { font-size: 12px; color: var(--gold-strong); margin-right: auto; align-self: center; }

/* Шапка профиля клиента */
.profile-head { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; margin-bottom: 6px; border-bottom: 1px solid var(--line-soft); }
.ava.lg { width: 56px; height: 56px; font-size: 18px; }
.ph-info { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.ph-contacts { display: flex; flex-wrap: wrap; gap: 14px; }
.ph-c { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-soft); }
.ph-c :deep(svg) { color: var(--ink-faint); }
.ph-edit { align-self: flex-start; }

.dgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 18px; }
.dgrid h4 { font-size: 15px; margin-bottom: 10px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.timeline { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.timeline li { position: relative; font-size: 13px; border-left: 2px solid var(--line); padding: 4px 0 10px 14px; }
.timeline li::before { content: ''; position: absolute; left: -5px; top: 8px; width: 8px; height: 8px; border-radius: 50%; background: var(--green); border: 2px solid var(--card); }
.timeline .tl-type { font-weight: 700; font-size: 12px; color: var(--green-deep); }
[data-theme="dark"] .timeline .tl-type { color: var(--green); }
.timeline .tl-sum { font-size: 13px; }
.timeline .tl-date { font-size: 11px; }
.timeline .tl-empty::before { display: none; }
.notes { list-style: none; padding: 0; margin: 0; display: grid; gap: 9px; }
@media (max-width: 720px) { .dgrid { grid-template-columns: 1fr; } .profile-head { flex-wrap: wrap; } }
</style>
