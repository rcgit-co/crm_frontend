<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'
import { ROLES, initials } from '../lib/format.js'
import BrandLogo from './BrandLogo.vue'
import Icon from './Icon.vue'

const route = useRoute()
const mobileOpen = ref(false)
watch(() => route.path, () => { mobileOpen.value = false })

const isDev = import.meta.env.DEV

const nav = [
  { to: '/dashboard', label: 'Обзор', icon: 'dashboard', primary: true },
  { to: '/deals', label: 'Сделки', icon: 'deals', primary: true },
  { to: '/clients', label: 'Клиенты', icon: 'clients', primary: true },
  { to: '/properties', label: 'Объекты', icon: 'properties', primary: true },
  { to: '/activities', label: 'Дела', icon: 'activities' },
  { to: '/employees', label: 'Сотрудники', icon: 'employees', manage: true },
  { to: '/agency', label: 'Агентство', icon: 'agency', manage: true },
]
const visibleNav = computed(() => nav.filter((n) => !n.manage || auth.canManage))
// Нижняя панель на телефоне: 4 основных раздела + «Ещё»
const bottomNav = computed(() => nav.filter((n) => n.primary))

async function copyAgencyId() {
  try {
    await navigator.clipboard.writeText(String(auth.agencyId))
    toasts.ok('ID агентства скопирован')
  } catch { toasts.err('Не удалось скопировать') }
}
</script>

<template>
  <div class="shell" :class="{ 'drawer-open': mobileOpen }">
    <div class="scrim" @click="mobileOpen = false"></div>

    <aside class="side">
      <div class="side-glow"></div>
      <div class="brand">
        <BrandLogo variant="full" tone="dark" :size="36" />
        <button class="drawer-close" @click="mobileOpen = false" aria-label="Закрыть">✕</button>
      </div>

      <nav>
        <router-link v-for="(n, i) in visibleNav" :key="n.to" :to="n.to" class="navlink" active-class="active" :style="{ '--d': i * 40 + 'ms' }">
          <Icon :name="n.icon" :size="19" class="ic" /><span class="lbl">{{ n.label }}</span>
        </router-link>
      </nav>

      <div class="side-foot">
        <div class="user-card">
          <div class="ava">{{ initials(auth.displayName) }}</div>
          <div class="ui">
            <strong>{{ auth.displayName }}</strong>
            <span class="role">{{ ROLES[auth.role] || auth.role }}</span>
          </div>
          <button class="logout" @click="auth.logout()" aria-label="Выйти" title="Выйти"><Icon name="logout" :size="17" /></button>
        </div>
        <div v-if="isDev" class="dev-tag">dev · шлюз <code>/api → :8081</code></div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="burger" @click="mobileOpen = true" aria-label="Меню">
          <span></span><span></span><span></span>
        </button>

        <div v-if="auth.agencyId" class="agency-tag" :title="'ID агентства: ' + auth.agencyId">
          <router-link to="/agency" class="agency-link"><span class="muted">Агентство</span><code>{{ String(auth.agencyId).slice(0, 8) }}…</code></router-link>
          <button class="copy" @click="copyAgencyId" aria-label="Скопировать ID агентства" title="Скопировать полный ID"><Icon name="copy" :size="15" /></button>
        </div>
        <router-link v-else to="/agency" class="agency-tag warn">⚠ Агентство не привязано</router-link>

        <div class="spacer"></div>

        <div class="user">
          <div class="ava sm">{{ initials(auth.displayName) }}</div>
          <div class="uinfo">
            <strong>{{ auth.displayName }}</strong>
            <span class="badge gold">{{ ROLES[auth.role] || auth.role }}</span>
          </div>
          <button class="ghost sm logout-top" @click="auth.logout()">Выйти</button>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in"><component :is="Component" /></transition>
        </router-view>
      </main>
    </div>

    <!-- Нижняя навигация (только телефон) -->
    <nav class="bottom-nav">
      <router-link v-for="n in bottomNav" :key="n.to" :to="n.to" class="bn-item" active-class="active">
        <Icon :name="n.icon" :size="21" class="bn-ic" /><span class="bn-lbl">{{ n.label }}</span>
      </router-link>
      <button class="bn-item" @click="mobileOpen = true">
        <Icon name="more" :size="21" class="bn-ic" /><span class="bn-lbl">Ещё</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 264px 1fr; min-height: 100vh; }

/* ——— Сайдбар: полуночный тил ——— */
.side {
  position: sticky; top: 0; height: 100vh;
  background: var(--grad-hero);
  color: var(--on-dark);
  display: flex; flex-direction: column; padding: 24px 16px 18px;
  overflow: hidden;
}
.side-glow {
  position: absolute; top: -80px; left: -40px; width: 260px; height: 260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(200,162,74,.18), transparent 65%); pointer-events: none;
}
.brand { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 22px; position: relative; z-index: 1; }
.drawer-close { display: none; background: transparent; border: none; color: var(--on-dark-soft); font-size: 18px; }

nav { display: flex; flex-direction: column; gap: 3px; flex: 1; position: relative; z-index: 1; }
.navlink {
  display: flex; align-items: center; gap: 13px; padding: 11px 13px; border-radius: 11px;
  color: var(--on-dark-soft); font-weight: 600; font-size: 14px; position: relative;
  transition: background .14s, color .14s, transform .14s;
  animation: navIn .45s both; animation-delay: var(--d, 0ms);
}
@keyframes navIn { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .navlink { animation: none; } }
.navlink .ic { width: 20px; text-align: center; opacity: .85; font-size: 13px; }
.navlink:hover { background: rgba(236,228,211,.07); color: var(--on-dark); transform: translateX(2px); }
.navlink.active { background: rgba(236,228,211,.10); color: #fff; }
.navlink.active::before { content: ''; position: absolute; left: -16px; top: 9px; bottom: 9px; width: 3px; border-radius: 0 3px 3px 0; background: var(--grad-brass); }

.side-foot { position: relative; z-index: 1; border-top: 1px solid rgba(236,228,211,.12); padding-top: 14px; }
.user-card { display: flex; align-items: center; gap: 11px; padding: 6px 6px; }
.user-card .ava { width: 38px; height: 38px; border-radius: 11px; background: rgba(236,228,211,.10); color: var(--gold-bright); display: grid; place-items: center; font-weight: 700; font-size: 13px; flex: 0 0 auto; }
.user-card .ui { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.user-card strong { font-size: 13px; color: var(--on-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-card .role { font-size: 11px; color: var(--gold-bright); font-weight: 600; }
.user-card .logout { background: transparent; border: none; color: var(--on-dark-faint); font-size: 16px; padding: 6px; border-radius: 8px; }
.user-card .logout:hover { background: rgba(236,228,211,.08); color: #fff; transform: none; }
.dev-tag { font-size: 11px; color: var(--on-dark-faint); padding: 10px 8px 2px; }
.dev-tag code { color: var(--on-dark-soft); }

/* ——— Основная зона ——— */
.main { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  display: flex; align-items: center; gap: 12px; padding: 13px 30px;
  background: rgba(252,250,244,.82); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 20;
}
.spacer { flex: 1; }
.burger { display: none; flex-direction: column; gap: 4px; padding: 9px; background: transparent; border: 1px solid var(--line); }
.burger span { width: 18px; height: 2px; background: var(--ink); border-radius: 2px; }
.agency-tag { display: flex; gap: 4px; align-items: center; font-size: 13px; color: var(--ink); }
.agency-link { display: flex; gap: 8px; align-items: center; color: var(--ink); }
.agency-tag code { background: var(--paper-2); padding: 2px 7px; border-radius: 6px; font-family: ui-monospace, Menlo, monospace; }
.agency-tag .copy { padding: 3px 7px; font-size: 13px; line-height: 1; background: transparent; border-color: transparent; color: var(--ink-faint); border-radius: 6px; }
.agency-tag .copy:hover { background: var(--paper-2); color: var(--gold-strong); transform: none; }
.agency-tag.warn { color: var(--gold-strong); font-weight: 600; }
.user { display: flex; align-items: center; gap: 12px; }
.user .ava.sm { width: 36px; height: 36px; border-radius: 50%; background: var(--green-soft); color: var(--green-deep); display: grid; place-items: center; font-weight: 700; font-size: 13px; flex: 0 0 auto; }
.uinfo { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.uinfo strong { font-size: 13.5px; }
.content { padding: 32px; max-width: 1320px; width: 100%; }
.scrim { display: none; }

/* ——— Нижняя навигация ——— */
.bottom-nav { display: none; }

/* ---------- Планшет/телефон ---------- */
@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .burger { display: flex; }
  .drawer-close { display: block; }
  .side {
    position: fixed; top: 0; left: 0; z-index: 60; width: 280px; height: 100vh;
    transform: translateX(-100%); transition: transform .24s cubic-bezier(.2,.7,.2,1); box-shadow: 0 0 50px rgba(0,0,0,.4);
  }
  .drawer-open .side { transform: translateX(0); }
  .scrim { display: block; position: fixed; inset: 0; background: rgba(10,32,31,.5); z-index: 55; opacity: 0; pointer-events: none; transition: opacity .2s; }
  .drawer-open .scrim { opacity: 1; pointer-events: auto; }
  .topbar { padding: 11px 16px; }
  .content { padding: 20px 16px 90px; }   /* запас под нижнюю навигацию */
  .agency-tag { display: none; }
  .uinfo, .user .ava.sm, .logout-top { display: none; }

  .bottom-nav {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: rgba(252,250,244,.9); backdrop-filter: blur(14px);
    border-top: 1px solid var(--line); padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
    justify-content: space-around;
  }
  .bn-item {
    background: transparent; border: none; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    color: var(--ink-faint); font-size: 10.5px; font-weight: 600; padding: 4px 2px; border-radius: 10px;
  }
  .bn-item:hover { transform: none; }
  .bn-ic { font-size: 16px; line-height: 1; }
  .bn-item.active { color: var(--green-deep); }
  .bn-item.active .bn-ic { color: var(--gold-strong); }
}
</style>
