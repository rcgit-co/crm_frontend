<script setup>
// Поле суммы с разделением разрядов при вводе: 15000000 → «15 000 000».
// Наружу (v-model) отдаёт чистое число, внутри показывает сгруппированное значение.
import { ref, watch } from 'vue'
import { groupDigits } from '../lib/format.js'

const props = defineProps({
  modelValue: { type: [Number, String], default: '' },
  placeholder: { type: String, default: '0' },
  currency: { type: String, default: '₽' },
})
const emit = defineEmits(['update:modelValue'])

const display = ref(groupDigits(props.modelValue))
watch(() => props.modelValue, (v) => {
  const g = groupDigits(v)
  if (g !== display.value) display.value = g
})

function onInput(e) {
  const digits = e.target.value.replace(/\D/g, '')
  display.value = groupDigits(digits)
  emit('update:modelValue', digits === '' ? '' : Number(digits))
}
</script>

<template>
  <div class="money-field">
    <input
      :value="display"
      @input="onInput"
      inputmode="numeric"
      :placeholder="placeholder"
    />
    <span class="cur">{{ currency }}</span>
  </div>
</template>

<style scoped>
.money-field { position: relative; }
.money-field input { padding-right: 30px; font-variant-numeric: tabular-nums; }
.cur { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--ink-faint); font-weight: 600; pointer-events: none; }
</style>
