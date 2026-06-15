<script setup>
// Иммерсивная оболочка для экранов входа/регистрации: атмосферный фон
// (градиент, аврора, городской силуэт недвижимости с «горящими окнами»),
// параллакс за курсором, переключатель темы и центрированный слот.
import { ref, computed } from 'vue'
import { theme } from '../stores/theme.js'
import Icon from './Icon.vue'

const px = ref(0); const py = ref(0)
function onMove(e) {
  px.value = (e.clientX / window.innerWidth - 0.5) * 2
  py.value = (e.clientY / window.innerHeight - 0.5) * 2
}

const VW = 1440, VH = 280
const buildings = [
  [20, 70, 120], [96, 46, 175], [150, 78, 96], [236, 54, 210], [298, 90, 138],
  [396, 60, 168], [462, 110, 110], [580, 64, 196], [652, 84, 130], [744, 50, 226],
  [802, 96, 150], [906, 66, 184], [980, 120, 116], [1108, 58, 204], [1174, 92, 142],
  [1274, 70, 176], [1352, 110, 120],
]
const windows = computed(() => {
  const out = []
  buildings.forEach(([bx, bw, bh], bi) => {
    const top = VH - bh
    for (let x = bx + 10; x < bx + bw - 8; x += 16) {
      for (let y = top + 14; y < VH - 14; y += 20) {
        const lit = (bi * 7 + x * 3 + y) % 6 === 0
        out.push({ x, y, lit, d: ((x + y) % 40) / 10 })
      }
    }
  })
  return out
})
</script>

<template>
  <div class="auth" @mousemove="onMove">
    <div class="scene">
      <div class="aurora a1" :style="{ transform: `translate(${px * -26}px, ${py * -18}px)` }"></div>
      <div class="aurora a2" :style="{ transform: `translate(${px * 22}px, ${py * 16}px)` }"></div>
      <div class="grid-lines" :style="{ transform: `translate(${px * -10}px, ${py * -8}px)` }"></div>
      <svg class="skyline" :viewBox="`0 0 ${VW} ${VH}`" preserveAspectRatio="xMidYMax slice"
           :style="{ transform: `translateX(${px * -14}px)` }" aria-hidden="true">
        <g class="far"><rect v-for="(b, i) in buildings" :key="'f'+i" :x="b[0] - 24" :y="VH - b[2] * 0.7" :width="b[1]" :height="b[2] * 0.7" rx="2" /></g>
        <g class="near"><rect v-for="(b, i) in buildings" :key="'b'+i" :x="b[0]" :y="VH - b[2]" :width="b[1]" :height="b[2]" rx="3" /></g>
        <g class="windows"><rect v-for="(w, i) in windows" :key="'w'+i" :x="w.x" :y="w.y" width="5" height="6" rx="1" :class="{ lit: w.lit }" :style="w.lit ? { animationDelay: w.d + 's' } : null" /></g>
      </svg>
    </div>

    <button class="theme-fab" @click="theme.toggle()" :aria-label="theme.isDark ? 'Светлая тема' : 'Тёмная тема'">
      <Icon :name="theme.isDark ? 'sun' : 'moon'" :size="18" />
    </button>

    <div class="panel" :class="{ wide }" :style="{ transform: `translate(${px * 5}px, ${py * 5}px)` }">
      <div class="auth-card glass"><slot /></div>
    </div>
  </div>
</template>

<script>
export default { props: { wide: Boolean } }
</script>

<style scoped>
.auth { position: fixed; inset: 0; overflow: hidden; display: grid; place-items: center; background: #08201d; padding: 20px; }
.scene { position: absolute; inset: 0; background: radial-gradient(130% 100% at 50% 0%, #1a5249 0%, #0d3a34 45%, #08211e 100%); }
.aurora { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; transition: transform .3s cubic-bezier(.2,.7,.2,1); }
.a1 { width: 520px; height: 520px; top: -160px; left: 8%; background: radial-gradient(circle, rgba(216,178,90,.5), transparent 65%); }
.a2 { width: 600px; height: 600px; bottom: -260px; right: 4%; background: radial-gradient(circle, rgba(45,212,191,.4), transparent 65%); }
.grid-lines {
  position: absolute; inset: -40px; transition: transform .3s cubic-bezier(.2,.7,.2,1);
  background-image: linear-gradient(rgba(216,178,90,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(216,178,90,.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(70% 60% at 50% 35%, #000, transparent 80%);
  -webkit-mask-image: radial-gradient(70% 60% at 50% 35%, #000, transparent 80%);
}
.skyline { position: absolute; left: -2%; right: -2%; bottom: 0; width: 104%; height: 46vh; min-height: 280px; transition: transform .3s cubic-bezier(.2,.7,.2,1); }
.skyline .far rect { fill: #0a2a26; opacity: .7; }
.skyline .near rect { fill: #061a17; }
.skyline .windows rect { fill: rgba(170,200,190,.10); }
.skyline .windows rect.lit { fill: #e6c987; animation: twinkle 3.2s ease-in-out infinite alternate; }
@keyframes twinkle { 0% { opacity: .35; } 100% { opacity: 1; } }

.theme-fab { position: absolute; top: 22px; right: 24px; z-index: 5; width: 42px; height: 42px; padding: 0; display: grid; place-items: center; border-radius: 12px; background: rgba(255,255,255,.08); border: 1px solid rgba(236,228,211,.18); color: var(--on-dark); backdrop-filter: blur(8px); }
.theme-fab:hover { color: var(--gold-bright); border-color: rgba(216,178,90,.5); }

.panel { position: relative; z-index: 2; width: 100%; max-width: 440px; transition: transform .3s cubic-bezier(.2,.7,.2,1); }
.panel.wide { max-width: 560px; }
.auth-card {
  background: rgba(12, 32, 29, .55);
  border: 1px solid rgba(236,228,211,.16);
  border-radius: 22px; padding: 34px;
  backdrop-filter: blur(18px) saturate(1.1);
  box-shadow: 0 30px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06);
  color: var(--on-dark);
  max-height: calc(100vh - 48px); overflow-y: auto;
}

/* Стилизация слот-содержимого (форма входа/регистрации) под тёмное стекло */
.auth-card :deep(h1) { color: #fff; font-size: 32px; margin: 10px 0 8px; }
.auth-card :deep(h2) { color: #fff; font-size: 26px; }
.auth-card :deep(.eyebrow) { color: var(--gold-bright); }
.auth-card :deep(.lead), .auth-card :deep(.muted) { color: var(--on-dark-soft); }
.auth-card :deep(label) { color: var(--on-dark-soft); }
.auth-card :deep(input), .auth-card :deep(select) {
  background: rgba(255,255,255,.05); border: 1px solid rgba(236,228,211,.18); color: var(--on-dark);
}
.auth-card :deep(input::placeholder) { color: rgba(170,200,190,.5); }
.auth-card :deep(input:focus), .auth-card :deep(select:focus) { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(216,178,90,.18); background: rgba(255,255,255,.08); }
.auth-card :deep(.primary), .auth-card :deep(.submit) { background: var(--grad-brass); border: none; color: #23180a; font-weight: 700; }
.auth-card :deep(.primary:hover:not(:disabled)) { box-shadow: 0 10px 26px rgba(216,178,90,.4); animation: none; }
.auth-card :deep(a) { color: var(--gold-bright); font-weight: 600; }
.auth-card :deep(.hint) { color: rgba(170,200,190,.6); }
.auth-card :deep(.fe) { color: #f3a39a; }

@media (prefers-reduced-motion: reduce) {
  .aurora, .grid-lines, .skyline, .panel { transition: none; }
  .skyline .windows rect.lit { animation: none; opacity: .9; }
}
@media (max-width: 560px) {
  .auth-card { padding: 26px 22px; border-radius: 18px; }
  .auth-card :deep(h1) { font-size: 27px; }
  .skyline { height: 32vh; }
}
</style>
