<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'

const router = useRouter()
const form = reactive({ inn: '', login: '', password: '' })
const busy = ref(false)

// Параллакс героя: фоновый слой смещается медленнее текста за курсором.
const px = ref(0); const py = ref(0)
function onMove(e) {
  const r = e.currentTarget.getBoundingClientRect()
  px.value = ((e.clientX - r.left) / r.width - 0.5) * 2
  py.value = ((e.clientY - r.top) / r.height - 0.5) * 2
}
function onLeave() { px.value = 0; py.value = 0 }

async function submit() {
  busy.value = true
  try {
    await auth.login({ inn: form.inn, login: form.login, password: form.password })
    toasts.ok('Вход выполнен')
    router.replace('/dashboard')
  } catch (e) {
    toasts.err(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth">
    <div class="pane art" @mousemove="onMove" @mouseleave="onLeave">
      <!-- Параллакс-слои: паттерн тонких линий + латунные пятна -->
      <div class="layer grid-lines" :style="{ transform: `translate(${px * -10}px, ${py * -10}px)` }"></div>
      <div class="layer glow" :style="{ transform: `translate(${px * -22}px, ${py * -22}px)` }"></div>

      <div class="art-inner" :style="{ transform: `translate(${px * 8}px, ${py * 8}px)` }">
        <span class="mark">Р</span>
        <h1>
          <span class="serif">Реалти</span>
          <span class="sans">CRM для агентств недвижимости</span>
        </h1>
        <p>Сделки, клиенты и объекты агентства — в одном спокойном, выверенном окне.</p>
        <ul>
          <li><span class="ic">◆</span> Канбан сделок и воронка продаж</li>
          <li><span class="ic">◉</span> База клиентов и лидов</li>
          <li><span class="ic">⌂</span> Каталог объектов и ЖК</li>
          <li><span class="ic">◷</span> Календарь дел и показов</li>
        </ul>
        <div class="trust">
          <span class="tdot"></span> Данные агентства · защищённый доступ по ИНН
        </div>
      </div>
    </div>

    <div class="pane form-side">
      <div class="form-box">
        <h2>Вход в систему</h2>
        <p class="muted">Введите реквизиты вашего агентства</p>

        <form @submit.prevent="submit">
          <div class="grid" style="gap:16px;margin-top:22px">
            <div>
              <label>ИНН агентства</label>
              <input v-model="form.inn" placeholder="7707083893" autocomplete="off" />
            </div>
            <div>
              <label>Логин</label>
              <input v-model="form.login" placeholder="ivanov" autocomplete="username" />
            </div>
            <div>
              <label>Пароль</label>
              <input v-model="form.password" type="password" placeholder="••••••••" autocomplete="current-password" />
            </div>
            <button class="primary" :disabled="busy" type="submit">
              {{ busy ? 'Входим…' : 'Войти' }}
            </button>
          </div>
        </form>

        <p class="alt">Нет аккаунта агентства? <router-link to="/register">Зарегистрировать</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }
.art {
  position: relative; overflow: hidden;
  background: var(--grad-hero);
  color: #cfe0d9; display: grid; place-items: center; padding: 40px;
}
.layer { position: absolute; inset: -40px; pointer-events: none; transition: transform .25s cubic-bezier(.2,.7,.2,1); }
.grid-lines {
  background-image:
    linear-gradient(rgba(216,178,90,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(216,178,90,.07) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(80% 80% at 50% 40%, #000 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(80% 80% at 50% 40%, #000 30%, transparent 80%);
}
.glow {
  background:
    radial-gradient(40% 40% at 22% 22%, rgba(216,178,90,.30), transparent 70%),
    radial-gradient(36% 36% at 82% 78%, rgba(31,95,83,.55), transparent 70%);
}
.art-inner { position: relative; max-width: 380px; transition: transform .25s cubic-bezier(.2,.7,.2,1); z-index: 1; }
.art-inner .mark { display: inline-grid; place-items: center; width: 50px; height: 50px; border-radius: 13px; background: var(--grad-brass); color: var(--green-darker); font-family: var(--serif); font-weight: 700; font-size: 28px; box-shadow: 0 6px 22px rgba(216,178,90,.4); }
.art-inner h1 { color: #fff; margin: 22px 0 14px; display: flex; flex-direction: column; gap: 4px; }
.art-inner h1 .serif { font-family: var(--serif); font-size: 46px; line-height: 1; }
.art-inner h1 .sans { font-family: var(--sans); font-weight: 600; font-size: 17px; color: #a9cabe; letter-spacing: .005em; }
.art-inner p { font-size: 16px; line-height: 1.55; color: #b6d0c6; }
.art-inner ul { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 13px; }
.art-inner li { font-size: 15px; color: #d8e6e0; display: flex; align-items: center; gap: 11px; }
.art-inner li .ic { color: var(--gold-bright); width: 18px; text-align: center; }
.trust { margin-top: 30px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.12); font-size: 12.5px; color: #9fc4b8; display: flex; align-items: center; gap: 9px; }
.tdot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 0 0 rgba(216,178,90,.6); animation: trust-pulse 2.4s infinite; }
@keyframes trust-pulse { 0% { box-shadow: 0 0 0 0 rgba(216,178,90,.55); } 70% { box-shadow: 0 0 0 8px rgba(216,178,90,0); } 100% { box-shadow: 0 0 0 0 rgba(216,178,90,0); } }

.form-side { display: grid; place-items: center; padding: 40px; }
.form-box { width: 348px; max-width: 100%; }
.form-box h2 { font-size: 29px; }
.alt { margin-top: 22px; font-size: 13.5px; }
@media (prefers-reduced-motion: reduce) { .tdot { animation: none; } .layer, .art-inner { transition: none; } }
@media (max-width: 820px) { .auth { grid-template-columns: 1fr; } .art { display: none; } }
</style>
