<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '../stores/auth.js'
import { ROLES, initials } from '../lib/format.js'

const route = useRoute()
const mobileOpen = ref(false)
watch(() => route.path, () => { mobileOpen.value = false })

const nav = [
  { to: '/dashboard', label: 'Обзор', icon: '◆' },
  { to: '/deals', label: 'Сделки', icon: '⬡' },
  { to: '/clients', label: 'Клиенты', icon: '◉' },
  { to: '/properties', label: 'Объекты', icon: '⌂' },
  { to: '/activities', label: 'Дела', icon: '◷' },
  { to: '/employees', label: 'Сотрудники', icon: '☰', manage: true },
  { to: '/agency', label: 'Агентство', icon: '✦', manage: true },
]
const visibleNav = computed(() => nav.filter((n) => !n.manage || auth.canManage))
</script>

<template>
  <div class="shell" :class="{ 'drawer-open': mobileOpen }">
    <!-- затемнение под выехавшим меню (моб.) -->
    <div class="scrim" @click="mobileOpen = false"></div>

    <aside class="side">
      <div class="brand">
        <span class="mark">Р</span>
        <span class="word">Реалти<em>CRM</em></span>
        <button class="drawer-close" @click="mobileOpen = false" aria-label="Закрыть">✕</button>
      </div>
      <nav>
        <router-link v-for="n in visibleNav" :key="n.to" :to="n.to" class="navlink" active-class="active">
          <span class="ic">{{ n.icon }}</span>{{ n.label }}
        </router-link>
      </nav>
      <div class="side-foot muted"><div>Шлюз: <code>/api → :8081</code></div></div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button class="burger" @click="mobileOpen = true" aria-label="Меню">
          <span></span><span></span><span></span>
        </button>

        <router-link to="/agency" v-if="auth.agencyId" class="agency-tag">
          <span class="muted">Агентство</span><code>{{ String(auth.agencyId).slice(0, 8) }}…</code>
        </router-link>
        <router-link v-else to="/agency" class="agency-tag warn">⚠ Агентство не привязано</router-link>

        <div class="spacer"></div>

        <div class="user">
          <div class="ava">{{ initials(auth.displayName) }}</div>
          <div class="uinfo">
            <strong>{{ auth.displayName }}</strong>
            <span class="badge green">{{ ROLES[auth.role] || auth.role }}</span>
          </div>
          <button class="ghost sm logout" @click="auth.logout()">Выйти</button>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in"><component :is="Component" /></transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 248px 1fr; min-height: 100vh; }
.side {
  background: var(--green-deep); color: #d8e6e0;
  display: flex; flex-direction: column; padding: 22px 16px;
  position: sticky; top: 0; height: 100vh;
}
.brand { display: flex; align-items: center; gap: 11px; padding: 4px 8px 24px; position: relative; }
.mark { width: 34px; height: 34px; border-radius: 9px; background: #d8b25a; color: var(--green-deep); display: grid; place-items: center; font-family: var(--serif); font-weight: 700; font-size: 19px; }
.word { font-family: var(--serif); font-size: 19px; color: #fff; }
.word em { font-style: normal; color: #9fc4b8; font-size: 13px; margin-left: 2px; }
.drawer-close { display: none; margin-left: auto; background: transparent; border: none; color: #9fc4b8; font-size: 18px; }
nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.navlink { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 9px; color: #aecabf; font-weight: 500; font-size: 14px; transition: all .12s; }
.navlink .ic { width: 18px; text-align: center; opacity: .8; }
.navlink:hover { background: rgba(255,255,255,.07); color: #fff; }
.navlink.active { background: rgba(255,255,255,.13); color: #fff; }
.side-foot { font-size: 11.5px; padding: 12px 10px 0; border-top: 1px solid rgba(255,255,255,.1); color: #7fa498; }
.side-foot code { color: #cfe0d9; }

.main { display: flex; flex-direction: column; min-width: 0; }
.topbar { display: flex; align-items: center; gap: 12px; padding: 13px 28px; background: var(--card); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 20; }
.spacer { flex: 1; }
.burger { display: none; flex-direction: column; gap: 4px; padding: 8px; background: transparent; border: 1px solid var(--line); }
.burger span { width: 18px; height: 2px; background: var(--ink); border-radius: 2px; }
.agency-tag { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--ink); }
.agency-tag code { background: var(--paper-2); padding: 2px 7px; border-radius: 6px; }
.agency-tag.warn { color: var(--gold); font-weight: 600; }
.user { display: flex; align-items: center; gap: 12px; }
.ava { width: 36px; height: 36px; border-radius: 50%; background: var(--green-soft); color: var(--green-deep); display: grid; place-items: center; font-weight: 700; font-size: 13px; flex: 0 0 auto; }
.uinfo { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.uinfo strong { font-size: 13.5px; }
.content { padding: 28px; max-width: 1280px; width: 100%; }
.scrim { display: none; }

/* ---------- Планшет/телефон ---------- */
@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .burger { display: flex; }
  .drawer-close { display: block; }
  .side {
    position: fixed; top: 0; left: 0; z-index: 60; width: 264px; height: 100vh;
    transform: translateX(-100%); transition: transform .22s ease; box-shadow: 0 0 40px rgba(0,0,0,.3);
  }
  .drawer-open .side { transform: translateX(0); }
  .scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 55; opacity: 0; pointer-events: none; transition: opacity .2s; }
  .drawer-open .scrim { opacity: 1; pointer-events: auto; }
  .topbar { padding: 11px 16px; }
  .content { padding: 18px 16px; }
  .agency-tag { display: none; }             /* доступно из меню «Агентство» */
  .uinfo { display: none; }                  /* в шапке — аватар + выход */
}
</style>
