<script setup>
import { ref, computed, onMounted } from 'vue'
import { dealApi } from '../api/deal.js'
import { clientApi } from '../api/client.js'
import { propertyApi } from '../api/property.js'
import { activityApi } from '../api/activity.js'
import { auth } from '../stores/auth.js'
import { money, groupDigits, date, ACTIVITY_TYPES, DEFAULT_STAGES } from '../lib/format.js'
import AnimatedNumber from '../components/AnimatedNumber.vue'
import Icon from '../components/Icon.vue'

const counts = ref({ deals: '—', clients: '—', properties: '—' })
const funnel = ref(DEFAULT_STAGES.map((s) => ({ label: s.title, count: 0, amount: 0 })))
const today = ref([])

function num(res) { return res?.pagination?.total ?? res?.items?.length ?? '—' }
async function loadCount(fn) { try { return num(await fn({ limit: 1, offset: 0 })) } catch { return '—' } }

onMounted(async () => {
  const [d, c, p] = await Promise.all([loadCount(dealApi.list), loadCount(clientApi.list), loadCount(propertyApi.list)])
  counts.value = { deals: d, clients: c, properties: p }
  try {
    const f = await dealApi.funnel()
    const rows = f?.funnel || f?.stages || (Array.isArray(f) ? f : [])
    if (rows.length) funnel.value = rows.map((r) => ({ label: r.title || r.label || r.stage || r.code, count: r.count ?? r.deals_count ?? 0, amount: r.amount ?? r.total_amount ?? 0 }))
  } catch { /* дефолтные стадии */ }
  try { today.value = (await activityApi.today()).items } catch { today.value = [] }
})

const maxCount = () => Math.max(1, ...funnel.value.map((r) => Number(r.count) || 0))
const funnelTotal = computed(() => funnel.value.reduce((s, r) => s + (Number(r.amount) || 0), 0))
const firstName = computed(() => (auth.displayName || '').trim().split(/\s+/).slice(-1)[0] || auth.displayName)
const moneyFmt = (n) => groupDigits(Math.round(n)) + ' ₽'
const todayLabel = computed(() => {
  const s = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const kpis = computed(() => [
  { to: '/deals', icon: 'deals', label: 'Активные сделки', value: counts.value.deals },
  { to: '/clients', icon: 'clients', label: 'Клиенты и лиды', value: counts.value.clients },
  { to: '/properties', icon: 'properties', label: 'Объекты в каталоге', value: counts.value.properties },
])
</script>

<template>
  <div class="dash">
    <!-- Блок 1 — приветствие (много воздуха) -->
    <header class="greet" v-reveal>
      <span class="eyebrow">{{ todayLabel }}</span>
      <h1>Здравствуйте, {{ firstName }}</h1>
      <p class="sub">Сводка по сделкам, клиентам и объектам агентства на сегодня.</p>
    </header>

    <!-- Блок 2 — KPI -->
    <section class="kpis">
      <router-link v-for="(k, i) in kpis" :key="k.to" :to="k.to" class="stat" v-reveal="{ delay: i * 80 }">
        <span class="stat-ic"><Icon :name="k.icon" :size="20" /></span>
        <span class="stat-label">{{ k.label }}</span>
        <strong class="stat-num num"><AnimatedNumber :value="k.value" /></strong>
        <span class="stat-go">Открыть <Icon name="arrow-right" :size="15" /></span>
      </router-link>
    </section>

    <!-- Блок 3 — пайплайн + дела -->
    <div class="cols">
      <section class="card pipeline" v-reveal>
        <div class="ph">
          <h3><Icon name="funnel" :size="18" class="ph-ic" /> Пайплайн</h3>
          <div class="ph-total num">{{ moneyFmt(funnelTotal) }}</div>
        </div>
        <div class="bars">
          <div v-for="(r,i) in funnel" :key="i" class="bar-row" v-reveal="{ delay: i * 60 }">
            <span class="bl">{{ r.label }}</span>
            <div class="track"><div class="fill" :style="{ width: ((Number(r.count)||0)/maxCount()*100)+'%' }" /></div>
            <span class="bc num">{{ r.count || 0 }}</span>
            <span class="ba num">{{ r.amount ? money(r.amount) : '—' }}</span>
          </div>
        </div>
      </section>

      <section class="card today" v-reveal="{ delay: 120 }">
        <div class="ph"><h3><Icon name="calendar" :size="18" class="ph-ic" /> Дела сегодня</h3><router-link to="/activities" class="link-sm">все</router-link></div>
        <div v-if="!today.length" class="empty">На сегодня дел нет</div>
        <ul v-else class="acts">
          <li v-for="a in today" :key="a.id">
            <span class="badge brand">{{ ACTIVITY_TYPES[a.type] || a.type }}</span>
            <span class="at">{{ a.title }}</span>
            <span class="aw">{{ date(a.due_at, true) }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dash { max-width: 1100px; }

/* ——— Приветствие ——— */
.greet { padding: 8px 0 var(--s4); }
.greet h1 { font-size: clamp(36px, 5vw, 56px); margin: 10px 0 10px; }
.greet .sub { color: var(--ink-soft); font-size: 16px; max-width: 56ch; }

/* ——— KPI ——— */
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: var(--s5); }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px 26px; display: flex; flex-direction: column; gap: 10px; color: var(--ink); transition: transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .2s, border-color .2s; }
.stat:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--green); }
.stat-ic { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--green-soft); color: var(--green-deep); }
[data-theme="dark"] .stat-ic { color: var(--green); }
.stat-label { font-size: 13px; color: var(--ink-soft); }
.stat-num { font-size: 52px; line-height: 1; font-weight: 800; letter-spacing: -.02em; }
.stat-go { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--green); margin-top: 2px; }

/* ——— Блоки ——— */
.cols { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
.card { padding: 26px 28px; }
.ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.ph h3 { display: flex; align-items: center; gap: 9px; font-size: 18px; }
.ph-ic { color: var(--green); }
.ph-total { font-size: 24px; font-weight: 800; color: var(--green-deep); }
[data-theme="dark"] .ph-total { color: var(--green); }
.link-sm { font-size: 13px; color: var(--ink-faint); }

.bars { display: grid; gap: 16px; }
.bar-row { display: grid; grid-template-columns: 110px 1fr 38px auto; align-items: center; gap: 14px; font-size: 14px; }
.bl { font-weight: 600; }
.track { height: 8px; background: var(--paper-2); border-radius: 999px; overflow: hidden; }
.fill { height: 100%; background: var(--green); border-radius: 999px; transition: width .7s cubic-bezier(.2,.7,.2,1); min-width: 2px; }
.bc { font-weight: 800; text-align: right; }
.ba { font-size: 12.5px; color: var(--ink-faint); }

.acts { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.acts li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 11px; font-size: 14px; }
.at { font-weight: 500; }
.aw { font-size: 12.5px; color: var(--ink-faint); white-space: nowrap; }
.badge.brand { background: var(--green-soft); color: var(--green-deep); }
[data-theme="dark"] .badge.brand { color: var(--green); }
.empty { padding: 30px 0; text-align: center; color: var(--ink-faint); }

@media (max-width: 900px) {
  .kpis { grid-template-columns: 1fr; gap: 14px; }
  .stat { flex-direction: row; align-items: center; flex-wrap: wrap; }
  .stat-num { font-size: 40px; margin-left: auto; }
  .stat-go { flex-basis: 100%; }
  .cols { grid-template-columns: 1fr; }
  .bar-row { grid-template-columns: 90px 1fr auto; }
  .bar-row .ba { display: none; }
}
</style>
