<script setup>
import { ref, computed, onMounted } from 'vue'
import { dealApi } from '../api/deal.js'
import { clientApi } from '../api/client.js'
import { propertyApi } from '../api/property.js'
import { activityApi } from '../api/activity.js'
import { auth } from '../stores/auth.js'
import { money, groupDigits, date, ACTIVITY_TYPES, DEFAULT_STAGES } from '../lib/format.js'
import DataState from '../components/DataState.vue'
import AnimatedNumber from '../components/AnimatedNumber.vue'

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
const funnelTotal = computed(() => funnel.value.reduce((s, r) => s + (Number(r.amount) || 0), 0))
const firstName = computed(() => (auth.displayName || '').trim().split(/\s+/).slice(-1)[0] || auth.displayName)
const moneyFmt = (n) => groupDigits(Math.round(n)) + ' ₽'
</script>

<template>
  <div>
    <div class="page-head">
      <h1>Здравствуйте, {{ firstName }}</h1>
      <p class="sub">Сводка по агентству на сегодня</p>
    </div>

    <DataState :loading="loading" variant="kpis">
      <div class="kpis">
        <router-link to="/deals" class="card kpi interactive" v-reveal>
          <span class="klabel muted">Сделки</span>
          <strong><AnimatedNumber :value="counts.deals" /></strong>
          <span class="kgo">Открыть доску →</span>
        </router-link>
        <router-link to="/clients" class="card kpi interactive" v-reveal="{ delay: 80 }">
          <span class="klabel muted">Клиенты</span>
          <strong><AnimatedNumber :value="counts.clients" /></strong>
          <span class="kgo">База клиентов →</span>
        </router-link>
        <router-link to="/properties" class="card kpi interactive" v-reveal="{ delay: 160 }">
          <span class="klabel muted">Объекты</span>
          <strong><AnimatedNumber :value="counts.properties" /></strong>
          <span class="kgo">Каталог →</span>
        </router-link>
      </div>

      <!-- Сигнатурный «счёт»: сумма по воронке, текстура финансовых линий -->
      <section class="card ledger" v-reveal>
        <div class="ledger-bg"></div>
        <div class="ledger-head">
          <span class="muted">Сумма сделок в воронке</span>
          <span class="badge gold">воронка продаж</span>
        </div>
        <div class="ledger-total">
          <AnimatedNumber :value="funnelTotal" :format="moneyFmt" />
        </div>
        <div class="ledger-rows">
          <div v-for="(r,i) in funnel" :key="i" class="lrow" v-reveal="{ delay: i * 70 }">
            <span class="lname">{{ r.label }}</span>
            <span class="ldots"></span>
            <span class="lcount">{{ r.count || 0 }} шт.</span>
            <span class="lamount">{{ r.amount ? money(r.amount) : '—' }}</span>
          </div>
        </div>
      </section>

      <div class="two-col">
        <section class="card pad" v-reveal>
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

        <section class="card pad" v-reveal="{ delay: 100 }">
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
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: var(--s3); }
.kpi { padding: 22px 24px; display: flex; flex-direction: column; gap: 7px; color: var(--ink); }
.kpi strong { font-family: var(--serif); font-size: 40px; line-height: 1; font-variant-numeric: tabular-nums; }
.klabel { font-size: 13px; }
.kgo { font-size: 13px; font-weight: 600; color: var(--green); }

/* ——— Сигнатурный блок «счёт» ——— */
.ledger { position: relative; overflow: hidden; padding: 26px 28px; margin-bottom: var(--s3); }
.ledger-bg {
  position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: repeating-linear-gradient(180deg, transparent, transparent 31px, var(--line-soft) 31px, var(--line-soft) 32px);
}
.ledger-head { position: relative; display: flex; justify-content: space-between; align-items: center; }
.ledger-total { position: relative; font-family: var(--serif); font-size: 46px; color: var(--green-deep); margin: 6px 0 18px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.ledger-rows { position: relative; display: grid; gap: 2px; }
.lrow { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; font-size: 13.5px; }
.lname { font-weight: 600; }
.ldots { flex: 1; border-bottom: 1px dotted var(--line); transform: translateY(-3px); }
.lcount { color: var(--ink-faint); font-size: 12.5px; }
.lamount { font-family: var(--serif); font-size: 15px; color: var(--ink); min-width: 130px; text-align: right; font-variant-numeric: tabular-nums; }

.two-col { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
.pad { padding: 22px 24px; }
.funnel { margin-top: 16px; display: grid; gap: 13px; }
.frow { display: grid; grid-template-columns: 120px 1fr 40px auto; align-items: center; gap: 12px; font-size: 13.5px; }
.flabel { font-weight: 600; }
.ftrack { height: 10px; background: var(--paper-2); border-radius: 6px; overflow: hidden; }
.ffill { height: 100%; background: linear-gradient(90deg, var(--green), var(--green-deep)); border-radius: 6px; transition: width .7s cubic-bezier(.2,.7,.2,1); min-width: 2px; }
.fcount { font-weight: 700; text-align: right; }
.famount { font-size: 12px; }
.acts { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 11px; }
.acts li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; font-size: 13.5px; }
.atitle { font-weight: 500; }
.empty { padding: 28px 0; text-align: center; }
@media (max-width: 900px) { .kpis, .two-col { grid-template-columns: 1fr; } .ledger-total { font-size: 36px; } .lamount { min-width: 96px; } }
</style>
