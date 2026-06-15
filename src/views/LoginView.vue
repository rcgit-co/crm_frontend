<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'

const router = useRouter()
const form = reactive({ inn: '', login: '', password: '' })
const busy = ref(false)

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
    <div class="pane art">
      <div class="art-inner">
        <span class="mark">Р</span>
        <h1>Реалти<span>CRM</span></h1>
        <p>Сделки, клиенты и объекты агентства недвижимости в одном окне.</p>
        <ul>
          <li>◆ Канбан сделок и воронка</li>
          <li>◉ База клиентов и лидов</li>
          <li>⌂ Каталог объектов и ЖК</li>
          <li>◷ Календарь дел и показов</li>
        </ul>
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
.art { background: var(--green-deep); color: #cfe0d9; display: grid; place-items: center; padding: 40px;
  background-image: radial-gradient(circle at 20% 20%, rgba(216,178,90,.18), transparent 45%); }
.art-inner { max-width: 360px; }
.art-inner .mark { display: inline-grid; place-items: center; width: 46px; height: 46px; border-radius: 12px; background: #d8b25a; color: var(--green-deep); font-family: var(--serif); font-weight: 700; font-size: 26px; }
.art-inner h1 { color: #fff; font-size: 38px; margin: 18px 0 12px; }
.art-inner h1 span { color: #9fc4b8; font-size: 22px; }
.art-inner p { font-size: 16px; line-height: 1.5; color: #aecabf; }
.art-inner ul { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 12px; }
.art-inner li { font-size: 15px; color: #cfe0d9; }
.form-side { display: grid; place-items: center; padding: 40px; }
.form-box { width: 340px; max-width: 100%; }
.form-box h2 { font-size: 27px; }
.alt { margin-top: 22px; font-size: 13.5px; }
@media (max-width: 820px) { .auth { grid-template-columns: 1fr; } .art { display: none; } }
</style>
