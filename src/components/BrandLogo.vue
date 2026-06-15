<script setup>
// Логотип РеалтиCRM: чеканный знак (крыша + точка-сделка) + словесная марка.
// variant: 'full' | 'mark' · tone: 'light' (тёмный текст) | 'dark' (кремовый текст)
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'full' },
  tone: { type: String, default: 'light' },
  size: { type: Number, default: 34 },
})

// уникальный id градиента, чтобы несколько логотипов на странице не конфликтовали
const uid = Math.random().toString(36).slice(2, 8)
const textColor = computed(() => (props.tone === 'dark' ? 'var(--on-dark)' : 'var(--ink)'))
const subColor = computed(() => (props.tone === 'dark' ? 'var(--on-dark-soft)' : 'var(--ink-faint)'))
</script>

<template>
  <span class="brand-logo" :class="tone">
    <svg class="mark" :width="size" :height="size" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient :id="'g' + uid" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6f97ec" />
          <stop offset="0.55" stop-color="#3b6fe0" />
          <stop offset="1" stop-color="#2f5fd0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" :fill="'url(#g' + uid + ')'" />
      <rect x="10.5" y="10.5" width="19" height="19" rx="3.5" fill="none" stroke="#ffffff" stroke-width="2.6" />
      <line x1="20" y1="10.5" x2="20" y2="29.5" stroke="#ffffff" stroke-width="2.6" />
      <line x1="10.5" y1="20" x2="29.5" y2="20" stroke="#ffffff" stroke-width="2.6" />
      <rect x="12.4" y="12.4" width="6" height="6" rx="1" fill="#ffffff" opacity="0.6" />
    </svg>
    <span v-if="variant === 'full'" class="word">
      <span class="name">Реалти</span>
      <span class="crm">CRM</span>
    </span>
  </span>
</template>

<style scoped>
.brand-logo { display: inline-flex; align-items: center; gap: 11px; }
.mark { flex: 0 0 auto; border-radius: 11px; box-shadow: 4px 4px 10px var(--nm-d), -4px -4px 10px var(--nm-l); }
.word { display: inline-flex; align-items: baseline; gap: 6px; line-height: 1; }
.name { font-family: var(--serif); font-weight: 700; font-size: 21px; letter-spacing: -.01em; color: v-bind(textColor); }
.crm { font-family: var(--sans); font-weight: 700; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); padding-bottom: 2px; }
.brand-logo.dark .crm { color: var(--gold-bright); }
</style>
