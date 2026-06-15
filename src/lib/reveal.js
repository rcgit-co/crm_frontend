// Директива v-reveal: блок появляется при попадании в зону видимости при скролле.
// Использование: <section v-reveal>…</section> или <div v-reveal="{ delay: 120 }">
const reduce = typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const reveal = {
  mounted(el, binding) {
    if (reduce) return
    el.classList.add('reveal')
    const delay = binding.value?.delay
    if (delay) el.style.transitionDelay = delay + 'ms'
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          el.classList.add('is-visible')
          io.unobserve(el)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    el._revealIo = io
  },
  unmounted(el) {
    el._revealIo?.disconnect()
  },
}
