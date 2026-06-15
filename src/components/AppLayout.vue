<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'
import { theme } from '../stores/theme.js'
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

        <button class="theme-btn" @click="theme.toggle()" :aria-label="theme.isDark ? 'Светлая тема' : 'Тёмная тема'" :title="theme.isDark ? 'Светлая тема' : 'Тёмная тема'">
          <Icon :name="theme.isDark ? 'sun' : 'moon'" :size="18" />
        </button>

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

/* ——— Сайдбар: светлый неоморфизм ——— */
.side {
  position: sticky; top: 0; height: 100vh;
  background: var(--paper);
  color: var(--ink);
  display: flex; flex-direction: column; padding: 22px 18px 18px;
  box-shadow: 10px 0 28px -20px var(--nm-d);
  z-index: 2;
}
.side-glow { display: none; }
.brand { display: flex; align-items: center; justify-content: space-between; padding: 4px 6px 24px; }
.drawer-close { display: none; background: transparent; box-shadow: none; color: var(--ink-faint); font-size: 18px; padding: 6px; }

.side nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.navlink {
  display: flex; align-items: center; gap: 13px; padding: 11px 14px; border-radius: 14px;
  color: var(--ink-soft); font-weight: 700; font-size: 14px;
  transition: box-shadow .16s, color .14s, background .14s;
  animation: navIn .45s both; animation-delay: var(--d, 0ms);
}
@keyframes navIn { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .navlink { animation: none; } }
.navlink .ic { width: 20px; display: grid; place-items: center; color: var(--ink-faint); }
.navlink:hover { color: var(--ink); background: var(--card); box-shadow: var(--nm-raise-sm); }
.navlink.active { color: var(--green); background: var(--card); box-shadow: var(--nm-press-sm); }
.navlink.active .ic { color: var(--green); }

.side-foot { border-top: 1px solid var(--line); padding-top: 14px; }
.user-card { display: flex; align-items: center; gap: 11px; padding: 6px; }
.user-card .ava { width: 38px; height: 38px; border-radius: 12px; background: var(--card); box-shadow: var(--nm-press-sm); color: var(--green); display: grid; place-items: center; font-weight: 800; font-size: 13px; flex: 0 0 auto; }
.user-card .ui { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.user-card strong { font-size: 13px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-card .role { font-size: 11px; color: var(--green); font-weight: 700; }
.user-card .logout { background: transparent; box-shadow: none; color: var(--ink-faint); font-size: 16px; padding: 8px; border-radius: 10px; }
.user-card .logout:hover { box-shadow: var(--nm-raise-sm); background: var(--card); color: var(--ink); }
.dev-tag { font-size: 11px; color: var(--ink-faint); padding: 10px 6px 2px; }
.dev-tag code { color: var(--ink-soft); }

/* ——— Основная зона ——— */
.main { display: flex; flex-direction: column; min-width: 0; }
.topbar {
  display: flex; align-items: center; gap: 12px; padding: 14px 30px;
  background: var(--paper); position: sticky; top: 0; z-index: 20;
  box-shadow: 0 10px 22px -20px var(--nm-d);
}
.theme-btn { width: 40px; height: 40px; padding: 0; display: grid; place-items: center; border-radius: 12px; background: var(--card); box-shadow: var(--nm-raise-sm); color: var(--ink-soft); }
.theme-btn:hover { color: var(--green); box-shadow: var(--nm-raise); }
.theme-btn:active { box-shadow: var(--nm-press-sm); }
.spacer { flex: 1; }
.burger { display: none; flex-direction: column; gap: 4px; padding: 11px; background: var(--card); box-shadow: var(--nm-raise-sm); }
.burger span { width: 18px; height: 2px; background: var(--ink); border-radius: 2px; }
.agency-tag { display: flex; gap: 4px; align-items: center; font-size: 13px; color: var(--ink); }
.agency-link { display: flex; gap: 8px; align-items: center; color: var(--ink); font-weight: 600; }
.agency-tag code { background: var(--card); box-shadow: var(--nm-press-sm); padding: 4px 9px; border-radius: 8px; font-family: ui-monospace, Menlo, monospace; }
.agency-tag .copy { padding: 5px 8px; font-size: 13px; line-height: 1; background: transparent; box-shadow: none; color: var(--ink-faint); border-radius: 8px; }
.agency-tag .copy:hover { box-shadow: var(--nm-raise-sm); background: var(--card); color: var(--green); }
.agency-tag.warn { color: var(--green); font-weight: 700; }
.user { display: flex; align-items: center; gap: 12px; }
.user .ava.sm { width: 38px; height: 38px; border-radius: 50%; background: var(--card); box-shadow: var(--nm-raise-sm); color: var(--green); display: grid; place-items: center; font-weight: 800; font-size: 13px; flex: 0 0 auto; }
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
    transform: translateX(-100%); transition: transform .24s cubic-bezier(.2,.7,.2,1); box-shadow: 14px 0 40px -10px rgba(43,50,66,.3);
  }
  .drawer-open .side { transform: translateX(0); }
  .scrim { display: block; position: fixed; inset: 0; background: rgba(43,50,66,.35); z-index: 55; opacity: 0; pointer-events: none; transition: opacity .2s; }
  .drawer-open .scrim { opacity: 1; pointer-events: auto; }
  .topbar { padding: 11px 16px; }
  .content { padding: 20px 16px 90px; }   /* запас под нижнюю навигацию */
  .agency-tag { display: none; }
  .uinfo, .user .ava.sm, .logout-top { display: none; }

  .bottom-nav {
    display: flex; flex-direction: row; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: var(--paper);
    box-shadow: 0 -10px 26px -18px var(--nm-d);
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
    justify-content: space-around; align-items: stretch; gap: 6px;
  }
  .bn-item {
    background: transparent; box-shadow: none; flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    color: var(--ink-faint); font-size: 10.5px; font-weight: 700; padding: 7px 2px; border-radius: 14px; min-height: 52px;
  }
  .bn-item:hover { transform: none; }
  .bn-item.active { color: var(--green); background: var(--card); box-shadow: var(--nm-press-sm); }
  .bn-item.active .bn-ic { color: var(--green); }
}
</style>
