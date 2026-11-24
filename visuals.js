// Визуализации листов 2, 5, 7 и живая «основная надпись» заявки (лист 9).
// Скрытые начальные состояния включаются только здесь (.vis-anim): без скрипта и при reduced-motion всё видно сразу.
;(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const blocks = ['#lag', '#kit', '#route'].map(selector => document.querySelector(selector)).filter(Boolean)
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return
      observer.unobserve(entry.target)
      entry.target.classList.add('is-in')
    }), { threshold: 0.35 })
    blocks.forEach(block => { block.classList.add('vis-anim'); observer.observe(block) })
  }

  // Заявка: что вводят в форму, сразу появляется в основной надписи листа; после отправки ставится печать
  const form = document.getElementById('form')
  const stamp = document.getElementById('req-stamp')
  const message = document.getElementById('form-msg')
  if (!form || !stamp || !message) return
  const outs = Object.fromEntries([...document.querySelectorAll('[data-out]')].map(node => [node.dataset.out, node]))
  const sync = () => {
    const data = new FormData(form)
    for (const key of ['company', 'name', 'phone', 'topic', 'note']) {
      if (!outs[key]) continue
      const value = String(data.get(key) || '').trim()
      outs[key].textContent = value || (key === 'note' ? '' : '—')
    }
  }
  if (outs.date) outs.date.textContent = new Date().toLocaleDateString('ru-RU')
  form.addEventListener('input', sync)
  form.addEventListener('change', sync)
  form.addEventListener('reset', () => setTimeout(sync))
  document.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => setTimeout(sync)))
  // Печать — когда main.js сообщил об успешной отправке (сообщение есть и это не ошибка)
  new MutationObserver(() => {
    const ok = Boolean(message.textContent) && !message.classList.contains('is-error')
    stamp.classList.toggle('is-pending', !ok)
    stamp.classList.toggle('is-stamped', ok)
  }).observe(message, { childList: true, characterData: true, subtree: true, attributes: true })
  sync()
})()
