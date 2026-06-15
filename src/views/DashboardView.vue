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
  const [d, c, p] = await Promise.all([
    loadCount(dealApi.list), loadCount(clientApi.list), loadCount(propertyApi.list),
  ])
  counts.value = { deals: d, clients: c, properties: p }
  try {
    const f = await dealApi.funnel()
    const rows = f?.funnel || f?.stages || (Array.isArray(f) ? f : [])
    if (rows.length) funnel.value = rows.map((r) => ({ label: r.title || r.label || r.stage || r.code, count: r.count ?? r.deals_count ?? 0, amount: r.amount ?? r.total_amount ?? 0 }))
  } catch { /* оставляем дефолтные стадии */ }
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
  <div class="bento">
    <!-- Приветствие (тёмная плитка) -->
    <section class="tile dark greet c8" v-reveal>
      <div class="dark-grid"></div>
      <div class="dark-glow"></div>
      <div class="greet-in">
        <span class="eyebrow on">{{ todayLabel }}</span>
        <h1>Здравствуйте, {{ firstName }}</h1>
        <p>Сводка по сделкам, клиентам и объектам агентства на сегодня.</p>
      </div>
    </section>

    <!-- Сигнатурный «счёт»: сумма в воронке (тёмная плитка) -->
    <section class="tile dark total c4" v-reveal="{ delay: 80 }">
      <div class="dark-grid"></div>
      <span class="eyebrow on">Сумма в воронке</span>
      <div class="total-num num"><AnimatedNumber :value="funnelTotal" :format="moneyFmt" /></div>
      <span class="total-cap">по всем стадиям сделок</span>
    </section>

    <!-- KPI-плитки -->
    <router-link v-for="(k, i) in kpis" :key="k.to" :to="k.to" class="tile kpi interactive c4" v-reveal="{ delay: 120 + i * 80 }">
      <span class="kpi-ic"><Icon :name="k.icon" :size="20" /></span>
      <span class="kpi-label muted">{{ k.label }}</span>
      <strong class="num"><AnimatedNumber :value="k.value" /></strong>
      <span class="kpi-go">Открыть <Icon name="arrow-right" :size="14" /></span>
    </router-link>

    <!-- Воронка продаж -->
    <section class="tile c8" v-reveal>
      <div class="tile-head">
        <h3><Icon name="funnel" :size="17" class="th-ic" /> Воронка продаж</h3>
        <router-link to="/deals" class="muted small">подробнее</router-link>
      </div>
      <div class="funnel">
        <div v-for="(r,i) in funnel" :key="i" class="frow">
          <span class="flabel">{{ r.label }}</span>
          <div class="ftrack"><div class="ffill" :style="{ width: ((Number(r.count)||0) / maxCount() * 100) + '%' }" /></div>
          <span class="fcount num">{{ r.count || 0 }}</span>
          <span class="famount muted num">{{ r.amount ? money(r.amount) : '' }}</span>
        </div>
      </div>
    </section>

    <!-- Дела на сегодня -->
    <section class="tile c4" v-reveal="{ delay: 100 }">
      <div class="tile-head">
        <h3><Icon name="calendar" :size="17" class="th-ic" /> Дела на сегодня</h3>
        <router-link to="/activities" class="muted small">все</router-link>
      </div>
      <div v-if="!today.length" class="empty muted">На сегодня дел нет</div>
      <ul v-else class="acts">
        <li v-for="a in today" :key="a.id">
          <span class="badge gray">{{ ACTIVITY_TYPES[a.type] || a.type }}</span>
          <span class="atitle">{{ a.title }}</span>
          <span class="muted small">{{ date(a.due_at, true) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.tile { padding: 22px 24px; }
.tile-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.tile-head h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; }
.th-ic { color: var(--green); }
.small { font-size: 12.5px; }

/* ——— Тёмные плитки ——— */
.dark { position: relative; overflow: hidden; background: var(--grad-hero); color: var(--on-dark); border: none; }
.dark-grid {
  position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: linear-gradient(rgba(216,178,90,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(216,178,90,.06) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(80% 90% at 85% 0%, #000 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(80% 90% at 85% 0%, #000 30%, transparent 85%);
}
.dark-glow { position: absolute; top: -100px; right: -50px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(216,178,90,.2), transparent 65%); pointer-events: none; }
.eyebrow.on { color: var(--gold-bright); position: relative; }
.greet { display: flex; align-items: center; min-height: 168px; }
.greet-in { position: relative; z-index: 1; }
.greet h1 { color: #fff; font-size: 34px; margin: 10px 0 8px; }
.greet p { color: var(--on-dark-soft); font-size: 14.5px; margin: 0; max-width: 46ch; }
.total { display: flex; flex-direction: column; justify-content: center; min-height: 168px; }
.total-num { position: relative; z-index: 1; color: #fff; font-size: 34px; font-weight: 700; margin: 10px 0 6px; }
.total-cap { position: relative; z-index: 1; color: var(--on-dark-soft); font-size: 12.5px; }

/* ——— KPI ——— */
.kpi { display: flex; flex-direction: column; gap: 8px; color: var(--ink); min-height: 150px; }
.kpi-ic { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: var(--green-soft); color: var(--green-deep); }
[data-theme="dark"] .kpi-ic { color: var(--green); }
.kpi-label { font-size: 13px; }
.kpi strong { font-size: 38px; line-height: 1; font-weight: 700; }
.kpi-go { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600; color: var(--green); margin-top: auto; }

/* ——— Воронка ——— */
.funnel { margin-top: 14px; display: grid; gap: 13px; }
.frow { display: grid; grid-template-columns: 120px 1fr 40px auto; align-items: center; gap: 12px; font-size: 13.5px; }
.flabel { font-weight: 600; }
.ftrack { height: 10px; background: var(--paper-2); border-radius: 6px; overflow: hidden; }
.ffill { height: 100%; background: linear-gradient(90deg, var(--green), var(--green-deep)); border-radius: 6px; transition: width .7s cubic-bezier(.2,.7,.2,1); min-width: 2px; }
.fcount { font-weight: 700; text-align: right; }
.famount { font-size: 12px; }

/* ——— Дела ——— */
.acts { list-style: none; padding: 0; margin: 14px 0 0; display: grid; gap: 11px; }
.acts li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; font-size: 13.5px; }
.atitle { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty { padding: 28px 0; text-align: center; }

@media (max-width: 640px) {
  .greet h1 { font-size: 27px; }
  .greet, .total { min-height: auto; }
  .kpi strong { font-size: 32px; }
}
</style>
