<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../stores/auth.js'
import { toasts } from '../stores/toast.js'
import AuthShell from '../components/AuthShell.vue'
import BrandLogo from '../components/BrandLogo.vue'

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
  <AuthShell>
    <div class="brand"><BrandLogo variant="full" tone="dark" :size="40" /></div>
    <span class="eyebrow">Вход в систему</span>
    <h1>С возвращением</h1>
    <p class="lead">Управляйте сделками, клиентами и объектами агентства в одном окне.</p>

    <form @submit.prevent="submit">
      <div class="grid" style="gap:15px;margin-top:22px">
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
        <button class="primary submit" :disabled="busy" type="submit">
          {{ busy ? 'Входим…' : 'Войти' }}
        </button>
      </div>
    </form>

    <p class="alt">Нет аккаунта агентства? <router-link to="/register">Зарегистрировать</router-link></p>
    <div class="secure"><span class="dot"></span> Защищённый доступ по ИНН агентства</div>
  </AuthShell>
</template>

<style scoped>
.brand { margin-bottom: 22px; }
.lead { font-size: 14px; margin: 0; line-height: 1.5; }
.submit { width: 100%; font-size: 14px; padding: 12px; }
.alt { margin-top: 20px; font-size: 13.5px; }
.secure { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(236,228,211,.12); font-size: 12px; color: var(--on-dark-soft); display: flex; align-items: center; gap: 8px; }
.secure .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold-bright); box-shadow: 0 0 8px var(--gold-bright); }
</style>
