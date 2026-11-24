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

  // Первый экран: иллюстрация комплекса (Higgsfield) и её «рентген». Скан снизу вверх открывает скрытые работы,
  // с линии скана листы актов летят в комплект ИД → КС-2 подписан → оплата. ~6,5 с, повтор по клику, без анимации — итог
  const totalActs = (20 + 16) * 5 + 12
  const xr = document.getElementById('hero-shot')
  const counter = document.getElementById('axo-n')
  if (xr && xr.classList.contains('xr')) {
    const art = document.getElementById('xr-art')
    const pile = document.getElementById('xr-pile')
    const tags = [...xr.querySelectorAll('.xr-tag')].map(el => ({ el, y: parseFloat(el.style.getPropertyValue('--y')) / 100 }))
    const stages = [...document.querySelectorAll('#hero-stages li')]
    const SHEETS = 24, SCAN_A = 0.12, SCAN_B = 0.66, DUR = 6500
    const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)))
    let committed = 0, raf = 0
    let filled = 0
    const addToPile = () => { filled++; pile.style.setProperty('--fill', Math.min(1, filled / SHEETS)) }
    const resetPile = n => { filled = n; pile.style.setProperty('--fill', Math.min(1, n / SHEETS)) }
    const fly = k => {
      const a = art.getBoundingClientRect(), t = pile.getBoundingClientRect(), f = xr.getBoundingClientRect()
      const leaf = document.createElement('i')
      leaf.className = 'xr-fly'
      xr.append(leaf)
      const fx = a.left - f.left + a.width * (0.25 + Math.random() * 0.5), fy = a.top - f.top + a.height * (1 - k)
      const tx = t.left - f.left + t.width / 2, ty = t.top - f.top + t.height / 2
      const mx = (fx + tx) / 2, my = Math.min(fy, ty) - 90
      const anim = leaf.animate([
        { transform: `translate(${fx}px, ${fy}px) scale(0.4)`, opacity: 0 },
        { transform: `translate(${mx}px, ${my}px) scale(1) rotate(-10deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${tx}px, ${ty}px) scale(1) rotate(0deg)`, opacity: 1 }
      ], { duration: 850, easing: 'cubic-bezier(0.3, 0.6, 0.3, 1)' })
      anim.onfinish = () => { leaf.remove(); addToPile() }
    }
    const render = (p, animate) => {
      const k = seg(p, SCAN_A, SCAN_B)
      xr.style.setProperty('--scan', k.toFixed(4))
      xr.classList.toggle('is-scanning', k > 0 && k < 1)
      tags.forEach(t => t.el.classList.toggle('is-on', k >= 1 - t.y))
      const due = Math.floor(k * SHEETS)
      if (due < committed) resetPile(due)
      else for (let i = committed; i < due; i++) animate ? fly(k) : addToPile()
      committed = due
      if (counter) counter.textContent = String(Math.round(k * totalActs))
      xr.classList.toggle('is-kit', p > 0.7)
      xr.classList.toggle('is-ks2', p > 0.78)
      xr.classList.toggle('is-signed', p > 0.85)
      xr.classList.toggle('is-paid', p > 0.93)
      const stage = k <= 0 ? 0 : k < 0.45 ? 1 : k < 1 ? 2 : p < 0.85 ? 3 : 4
      stages.forEach((li, i) => { li.classList.toggle('is-on', i === stage); li.classList.toggle('is-done', i < stage) })
    }
    const play = () => {
      cancelAnimationFrame(raf)
      render(0, false)
      const t0 = performance.now()
      const tick = now => { const p = Math.min(1, (now - t0) / DUR); render(p, true); if (p < 1) raf = requestAnimationFrame(tick) }
      raf = requestAnimationFrame(tick)
    }
    if (reduced) { xr.classList.add('is-static'); render(1, false) }
    else {
      xr.classList.add('is-live')
      const start = () => (art.querySelector('.xr-xray').complete ? play() : art.querySelector('.xr-xray').addEventListener('load', play, { once: true }))
      start()
      art.addEventListener('click', play)
    }
  }
  const heroShot = document.getElementById('hero-shot')
  if (heroShot && !reduced) {
    heroShot.classList.add('vis-anim')
    requestAnimationFrame(() => requestAnimationFrame(() => heroShot.classList.add('is-in')))
  }

  // Журнал объекта на первом экране: события сменяются по одному. Без скрипта и при reduced-motion видны все четыре
  const feed = document.getElementById('feed')
  if (feed && !reduced) {
    const items = [...feed.querySelectorAll('.feed-list li')]
    let current = 0
    feed.classList.add('is-live')
    items[0].classList.add('is-on')
    setInterval(() => {
      if (document.hidden) return
      items[current].classList.remove('is-on')
      current = (current + 1) % items.length
      items[current].classList.add('is-on')
    }, 2800)
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
