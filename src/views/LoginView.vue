<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'
import BrandLogo from '../components/BrandLogo.vue'

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
        <BrandLogo variant="mark" tone="dark" :size="58" />
        <span class="eyebrow art-eyebrow">CRM для агентств недвижимости</span>
        <h1>
          Сделки, клиенты <br />и&nbsp;объекты — <em>в одном окне</em>
        </h1>
        <p>Спокойная, выверенная система для ежедневной работы агентства недвижимости.</p>
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
  color: var(--on-dark-soft); display: grid; place-items: center; padding: 40px;
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
.art-inner { position: relative; max-width: 410px; transition: transform .25s cubic-bezier(.2,.7,.2,1); z-index: 1; }
.art-eyebrow { display: block; margin: 26px 0 14px; color: var(--gold-bright); }
.art-inner h1 { color: #fff; margin: 0 0 16px; font-size: 44px; line-height: 1.08; font-weight: 700; }
.art-inner h1 em { font-style: italic; color: var(--gold-bright); font-weight: 600; }
.art-inner p { font-size: 16px; line-height: 1.55; color: var(--on-dark-soft); }
.art-inner ul { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 13px; }
.art-inner li { font-size: 15px; color: var(--on-dark); display: flex; align-items: center; gap: 11px; }
.art-inner li .ic { color: var(--gold-bright); width: 18px; text-align: center; }
.trust { margin-top: 30px; padding-top: 18px; border-top: 1px solid rgba(236,228,211,.14); font-size: 12.5px; color: var(--on-dark-soft); display: flex; align-items: center; gap: 9px; }
.tdot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 0 0 rgba(216,178,90,.6); animation: trust-pulse 2.4s infinite; }
@keyframes trust-pulse { 0% { box-shadow: 0 0 0 0 rgba(216,178,90,.55); } 70% { box-shadow: 0 0 0 8px rgba(216,178,90,0); } 100% { box-shadow: 0 0 0 0 rgba(216,178,90,0); } }

.form-side { display: grid; place-items: center; padding: 40px; }
.form-box { width: 348px; max-width: 100%; }
.form-box h2 { font-size: 29px; }
.alt { margin-top: 22px; font-size: 13.5px; }
@media (prefers-reduced-motion: reduce) { .tdot { animation: none; } .layer, .art-inner { transition: none; } }
@media (max-width: 820px) { .auth { grid-template-columns: 1fr; } .art { display: none; } }
</style>
