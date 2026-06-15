<script setup>
// Светлая неоморфная оболочка входа/регистрации: мягкая выпуклая карточка
// по центру на монохромной базе, спокойные декоративные пятна, переключатель темы.
import { theme } from '../stores/theme.js'
import Icon from './Icon.vue'

defineProps({ wide: Boolean })
</script>

<template>
  <div class="auth">
    <div class="bg">
      <span class="blob b1"></span>
      <span class="blob b2"></span>
    </div>

    <button class="theme-fab" @click="theme.toggle()" :aria-label="theme.isDark ? 'Светлая тема' : 'Тёмная тема'">
      <Icon :name="theme.isDark ? 'sun' : 'moon'" :size="18" />
    </button>

    <div class="panel" :class="{ wide }">
      <div class="auth-card"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.auth { position: fixed; inset: 0; overflow: hidden; display: grid; place-items: center; background: var(--paper); padding: 20px; }
.bg { position: absolute; inset: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; }
.b1 { width: 460px; height: 460px; top: -140px; left: -80px; background: radial-gradient(circle, rgba(59,111,224,.18), transparent 70%); }
.b2 { width: 520px; height: 520px; bottom: -200px; right: -100px; background: radial-gradient(circle, rgba(111,151,236,.14), transparent 70%); }

.theme-fab { position: absolute; top: 22px; right: 24px; z-index: 5; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; border-radius: 14px; background: var(--card); box-shadow: var(--nm-raise-sm); color: var(--ink-soft); }
.theme-fab:hover { color: var(--green); box-shadow: var(--nm-raise); }
.theme-fab:active { box-shadow: var(--nm-press-sm); }

.panel { position: relative; z-index: 2; width: 100%; max-width: 430px; }
.panel.wide { max-width: 560px; }
.auth-card {
  background: var(--card);
  border-radius: 28px; padding: 38px 36px;
  box-shadow: var(--nm-raise);
  max-height: calc(100vh - 48px); overflow-y: auto;
}

@media (max-width: 560px) {
  .auth-card { padding: 28px 22px; border-radius: 24px; }
}
</style>
