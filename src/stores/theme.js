import { reactive } from 'vue'

// Тема свет/тёмная: применяется через data-theme на <html>, хранится в localStorage,
// по умолчанию берётся из системной настройки prefers-color-scheme.
const LS = 'crm_theme'
const saved = localStorage.getItem(LS)
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const initial = saved || (prefersDark ? 'dark' : 'light')

function apply(mode) {
  document.documentElement.setAttribute('data-theme', mode)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#120e1c' : '#2a1b4a')
}
apply(initial)

export const theme = reactive({
  mode: initial,
  get isDark() { return this.mode === 'dark' },
  toggle() {
    this.mode = this.mode === 'dark' ? 'light' : 'dark'
    localStorage.setItem(LS, this.mode)
    apply(this.mode)
  },
  set(mode) {
    this.mode = mode
    localStorage.setItem(LS, mode)
    apply(mode)
  },
})
