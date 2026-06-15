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
const todayLabel = computed(() => {
  const s = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const stats = computed(() => [
  { to: '/deals', label: 'Активные сделки', value: counts.value.deals },
  { to: '/clients', label: 'Клиенты и лиды', value: counts.value.clients },
  { to: '/properties', label: 'Объекты в каталоге', value: counts.value.properties },
])
</script>

<template>
  <div class="dash">
    <!-- ——— Тёмный хиро ——— -->
    <header class="hero">
      <div class="hero-grid"></div>
      <div class="hero-glow"></div>
      <div class="hero-inner">
        <span class="eyebrow hero-eyebrow">Панель агентства · {{ todayLabel }}</span>
        <h1>Здравствуйте, {{ firstName }}</h1>
        <p class="hero-sub">Сводка по сделкам, клиентам и объектам на сегодня.</p>

        <div class="hero-stats">
          <router-link v-for="(s, i) in stats" :key="s.to" :to="s.to" class="glass stat" v-reveal="{ delay: i * 90 }">
            <span class="stat-label">{{ s.label }}</span>
            <strong class="num"><AnimatedNumber :value="s.value" /></strong>
            <span class="stat-go">Открыть →</span>
          </router-link>
        </div>
      </div>
    </header>

    <DataState :loading="loading" variant="block">
      <!-- ——— Сигнатурный «счёт» ——— -->
      <section class="card ledger" v-reveal>
        <div class="ledger-bg"></div>
        <div class="ledger-head">
          <span class="eyebrow">Сумма сделок в воронке</span>
          <span class="badge gold">воронка продаж</span>
        </div>
        <div class="ledger-total num">
          <AnimatedNumber :value="funnelTotal" :format="moneyFmt" />
        </div>
        <div class="ledger-rows">
          <div v-for="(r,i) in funnel" :key="i" class="lrow" v-reveal="{ delay: i * 70 }">
            <span class="lname">{{ r.label }}</span>
            <span class="ldots"></span>
            <span class="lcount">{{ r.count || 0 }} шт.</span>
            <span class="lamount num">{{ r.amount ? money(r.amount) : '—' }}</span>
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
              <span class="fcount num">{{ r.count || 0 }}</span>
              <span class="famount muted num">{{ r.amount ? money(r.amount) : '' }}</span>
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
/* ——— Хиро ——— */
.hero {
  position: relative; overflow: hidden; border-radius: var(--radius-lg);
  background: var(--grad-hero); color: var(--on-dark);
  padding: 40px 44px 30px; margin-bottom: var(--s4);
  box-shadow: var(--shadow-lg);
}
.hero-grid {
  position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image:
    linear-gradient(rgba(200,162,74,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(200,162,74,.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(80% 90% at 80% 0%, #000 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(80% 90% at 80% 0%, #000 30%, transparent 85%);
}
.hero-glow { position: absolute; top: -120px; right: -60px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(200,162,74,.22), transparent 65%); pointer-events: none; }
.hero-inner { position: relative; z-index: 1; }
.hero-eyebrow { color: var(--gold-bright); }
.hero h1 { color: #fff; font-size: 38px; margin: 12px 0 8px; }
.hero-sub { color: var(--on-dark-soft); font-size: 15px; margin: 0 0 26px; }
.hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat { padding: 18px 20px; display: flex; flex-direction: column; gap: 7px; color: var(--on-dark); transition: transform .2s, border-color .2s, background .2s; }
.stat:hover { transform: translateY(-3px); border-color: rgba(200,162,74,.45); background: rgba(255,255,255,.09); }
.stat-label { font-size: 12.5px; color: var(--on-dark-soft); }
.stat strong { font-size: 38px; line-height: 1; color: #fff; }
.stat-go { font-size: 12px; font-weight: 600; color: var(--gold-bright); }

/* ——— Сигнатурный блок «счёт» ——— */
.ledger { position: relative; overflow: hidden; padding: 26px 28px; margin-bottom: var(--s3); }
.ledger-bg { position: absolute; inset: 0; pointer-events: none; opacity: .5; background-image: repeating-linear-gradient(180deg, transparent, transparent 31px, var(--line-soft) 31px, var(--line-soft) 32px); }
.ledger-head { position: relative; display: flex; justify-content: space-between; align-items: center; }
.ledger-total { position: relative; font-size: 46px; color: var(--green-deep); margin: 8px 0 18px; font-weight: 600; }
.ledger-rows { position: relative; display: grid; gap: 2px; }
.lrow { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; font-size: 13.5px; }
.lname { font-weight: 600; }
.ldots { flex: 1; border-bottom: 1px dotted var(--line); transform: translateY(-3px); }
.lcount { color: var(--ink-faint); font-size: 12.5px; }
.lamount { font-size: 15px; color: var(--ink); min-width: 130px; text-align: right; font-weight: 500; }

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

@media (max-width: 900px) {
  .hero { padding: 28px 22px 22px; }
  .hero h1 { font-size: 30px; }
  .hero-stats { grid-template-columns: 1fr; gap: 12px; }
  .stat { flex-direction: row; align-items: baseline; justify-content: space-between; }
  .stat strong { font-size: 30px; }
  .stat-go { display: none; }
  .two-col { grid-template-columns: 1fr; }
  .ledger-total { font-size: 34px; }
  .lamount { min-width: 96px; }
}
</style>
