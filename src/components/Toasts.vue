<script setup>
import { toasts } from '../stores/toast.js'
</script>

<template>
  <div class="toast-wrap">
    <transition-group name="toast">
      <div v-for="t in toasts.items" :key="t.id" class="toast" :class="t.type" @click="toasts.dismiss(t.id)">
        <span class="ico">{{ t.type === 'ok' ? '✓' : t.type === 'err' ? '!' : 'i' }}</span>
        <span>{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-wrap { position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 200; }
.toast {
  display: flex; align-items: center; gap: 10px;
  background: #18222b; color: #f1f4f3;
  padding: 11px 15px; border-radius: 11px; font-size: 13.5px; font-weight: 500;
  box-shadow: 0 8px 26px rgba(0,0,0,.32); cursor: pointer; max-width: 360px;
  border: 1px solid rgba(255,255,255,.08);
}
.toast.ok { background: #0e3f38; }
.toast.err { background: #6e2a22; }
.ico {
  width: 19px; height: 19px; border-radius: 50%; flex: 0 0 auto;
  display: grid; place-items: center; font-size: 12px; font-weight: 700;
  background: rgba(255,255,255,.18);
}
.toast-enter-active, .toast-leave-active { transition: all .22s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
