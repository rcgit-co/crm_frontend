<script setup>
// Цифры «зажигаются» как на счётчике — плавный отсчёт от 0 до значения
// при первом появлении в зоне видимости. Поддерживает форматирование (money/groupDigits).
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  format: { type: Function, default: (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) },
  duration: { type: Number, default: 1100 },
})

const display = ref('—')
const el = ref(null)
let started = false
let raf = 0

function isNumeric(v) { return v !== '' && v != null && !Number.isNaN(Number(v)) }

function run() {
  const target = Number(props.value)
  if (!isNumeric(props.value)) { display.value = String(props.value ?? '—'); return }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) { display.value = props.format(target); return }
  const t0 = performance.now()
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / props.duration)
    const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
    display.value = props.format(target * eased)
    if (p < 1) raf = requestAnimationFrame(tick)
    else display.value = props.format(target)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  if (!isNumeric(props.value)) { display.value = String(props.value ?? '—') }
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) { started = true; run(); io.disconnect() }
  }, { threshold: 0.4 })
  if (el.value) io.observe(el.value)
  el.value._io = io
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); el.value?._io?.disconnect() })

// Если значение приходит позже (после загрузки данных) — перезапустить отсчёт.
watch(() => props.value, () => { if (started || isNumeric(props.value)) { started = true; run() } })
</script>

<template>
  <span ref="el" class="anim-num">{{ display }}</span>
</template>
