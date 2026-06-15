<script setup>
import { ref, onMounted } from 'vue'
import { dealApi } from '../api/deal.js'
import { clientApi } from '../api/client.js'
import { propertyApi } from '../api/property.js'
import { activityApi } from '../api/activity.js'
import { auth } from '../stores/auth.js'
import { money, date, ACTIVITY_TYPES, DEFAULT_STAGES } from '../lib/format.js'
import DataState from '../components/DataState.vue'

const loading = ref(true)
const counts = ref({ deals: '—', clients: '—', properties: '—' })
const funnel = ref([])
const today = ref([])

function num(res) { return res?.pagination?.total ?? res?.items?.length ?? '—' }
async function loadCount(fn) { try { return num(await fn({ limit: 1, offset: 0 })) } catch { return '—' } }

onMounted(async () => {
  const [d, c, p] = await Promise.all([
    loadCount(dealApi.list), loadCount(clientApi.list), loadCount(propertyApi.list),
  ])
  counts.value = { deals: d, clients: c, properties: p }

  try {
    const f = await dealApi.funnel()
    const rows = f?.funnel || f?.stages || (Array.isArray(f) ? f : [])
    funnel.value = rows.length
      ? rows.map((r) => ({ label: r.title || r.label || r.stage || r.code, count: r.count ?? r.deals_count ?? 0, amount: r.amount ?? r.total_amount ?? 0 }))
      : DEFAULT_STAGES.map((s) => ({ label: s.title, count: 0, amount: 0 }))
  } catch {
    funnel.value = DEFAULT_STAGES.map((s) => ({ label: s.title, count: 0, amount: 0 }))
  }

  try { today.value = (await activityApi.today()).items } catch { today.value = [] }
  loading.value = false
})

const maxCount = () => Math.max(1, ...funnel.value.map((r) => Number(r.count) || 0))
</script>

<template>
  <div>
    <div class="spread" style="margin-bottom:22px">
      <div>
        <h1 style="font-size:30px">Здравствуйте, {{ auth.displayName.split(' ').slice(-1)[0] }}</h1>
        <p class="muted">Сводка по агентству на сегодня</p>
      </div>
    </div>

    <DataState :loading="loading">
      <div class="kpis">
        <div class="card kpi"><span class="muted">Сделки</span><strong>{{ counts.deals }}</strong><router-link to="/deals">Открыть доску →</router-link></div>
        <div class="card kpi"><span class="muted">Клиенты</span><strong>{{ counts.clients }}</strong><router-link to="/clients">База клиентов →</router-link></div>
        <div class="card kpi"><span class="muted">Объекты</span><strong>{{ counts.properties }}</strong><router-link to="/properties">Каталог →</router-link></div>
      </div>

      <div class="two-col">
        <section class="card pad">
          <div class="spread"><h3>Воронка продаж</h3><router-link to="/deals" class="muted">подробнее</router-link></div>
          <div class="funnel">
            <div v-for="(r,i) in funnel" :key="i" class="frow">
              <span class="flabel">{{ r.label }}</span>
              <div class="ftrack"><div class="ffill" :style="{ width: ((Number(r.count)||0) / maxCount() * 100) + '%' }" /></div>
              <span class="fcount">{{ r.count || 0 }}</span>
              <span class="famount muted">{{ r.amount ? money(r.amount) : '' }}</span>
            </div>
          </div>
        </section>

        <section class="card pad">
          <div class="spread"><h3>Дела на сегодня</h3><router-link to="/activities" class="muted">все дела</router-link></div>
          <div v-if="!today.length" class="muted empty">На сегодня дел нет</div>
          <ul v-else class="acts">
            <li v-for="a in today" :key="a.id">
              <span class="badge gray">{{ ACTIVITY_TYPES[a.type] || a.type }}</span>
              <span class="atitle">{{ a.title }}</span>
              <span class="muted">{{ date(a.due_at, true) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </DataState>
  </div>
</template>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 22px; }
.kpi { padding: 20px 22px; display: flex; flex-direction: column; gap: 6px; }
.kpi strong { font-family: var(--serif); font-size: 36px; }
.kpi a { font-size: 13px; font-weight: 600; }
.two-col { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
.pad { padding: 20px 22px; }
.funnel { margin-top: 16px; display: grid; gap: 12px; }
.frow { display: grid; grid-template-columns: 120px 1fr 40px auto; align-items: center; gap: 12px; font-size: 13.5px; }
.flabel { font-weight: 600; }
.ftrack { height: 10px; background: var(--paper-2); border-radius: 6px; overflow: hidden; }
.ffill { height: 100%; background: var(--green); border-radius: 6px; transition: width .5s ease; min-width: 2px; }
.fcount { font-weight: 700; text-align: right; }
.famount { font-size: 12px; }
.acts { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px; }
.acts li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; font-size: 13.5px; }
.atitle { font-weight: 500; }
.empty { padding: 28px 0; text-align: center; }
@media (max-width: 900px) { .kpis, .two-col { grid-template-columns: 1fr; } }
</style>
