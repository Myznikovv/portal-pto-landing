// Визуализации листов 2, 5, 7 и живая «основная надпись» заявки (лист 9).
// Скрытые начальные состояния включаются только здесь (.vis-anim): без скрипта и при reduced-motion всё видно сразу.
;(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const blocks = ['#lag', '#kit', '#route', '#registry', '#browser'].map(selector => document.querySelector(selector)).filter(Boolean)
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
    const stages = []
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

  // Лист 6: окно портала — вкладки и подсветка места на экране по пункту расшифровки
  const browser = document.getElementById('browser')
  if (browser) {
    const tabs = [...browser.querySelectorAll('[role="tab"]')], panels = [...browser.querySelectorAll('.br-panel')]
    const show = i => {
      tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)))
      panels.forEach((p, k) => p.classList.toggle('is-on', k === i))
    }
    tabs.forEach((t, i) => t.addEventListener('click', () => show(i)))
    browser.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement)
      if (i < 0 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return
      const next = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
      tabs[next].focus(); show(next)
    })
    panels.forEach(panel => {
      const hot = (n, on) => panel.querySelectorAll(`.mark[data-m="${n}"]`).forEach(m => m.classList.toggle('is-hot', on))
      panel.querySelectorAll('.shot-legend li').forEach(li => {
        const n = li.dataset.m
        for (const [ev, on] of [['mouseenter', true], ['mouseleave', false], ['focus', true], ['blur', false]]) li.addEventListener(ev, () => { hot(n, on); panel.classList.toggle('is-pointing', on) })
      })
    })
  }

  // Лист 4: акт собирается из источников. Этап 1–5: источник загорается, к строке акта тянется пунктир, текст печатается;
  // подписи, фото, печать. Без скрипта и при reduced-motion — итоговый акт целиком
  const asm = document.getElementById('asm-doc')
  if (asm) {
    const build = asm.closest('.build'), wires = document.getElementById('asm-wires')
    const steps = [...document.querySelectorAll('#asm-steps .asm-step')]
    const srcs = [...build.querySelectorAll('.src')]
    const field = id => document.getElementById(id)
    const typed = new Map()
    build.querySelectorAll('.aosr-fields b').forEach(b => typed.set(b, b.textContent))
    const typeIn = (b, on) => {
      const full = typed.get(b)
      clearInterval(b._t)
      if (!on) { b.textContent = ''; b.classList.remove('is-typed'); return }
      if (b.classList.contains('is-typed')) return
      b.classList.add('is-typed')
      let i = 0
      b._t = setInterval(() => { i += 2; b.textContent = full.slice(0, i); if (i >= full.length) clearInterval(b._t) }, 18)
    }
    const NS = 'http://www.w3.org/2000/svg'
    const drawWire = (src, target, on) => {
      let path = wires.querySelector(`[data-w="${src.dataset.src}"]`)
      if (!path) { path = document.createElementNS(NS, 'path'); path.dataset.w = src.dataset.src; path.setAttribute('pathLength', '1'); wires.append(path) }
      const box = build.getBoundingClientRect(), a = src.getBoundingClientRect(), t = target.getBoundingClientRect()
      const x1 = a.left + a.width / 2 - box.left, y1 = a.bottom - box.top
      const x2 = t.left - box.left - 6, y2 = t.top + Math.min(t.height / 2, 24) - box.top
      // разводка под прямым углом, как на чертеже: вниз → влево по полю слева от акта → к строке
      const doc = asm.getBoundingClientRect()
      const gy = doc.top - box.top - 18 + Number(src.dataset.src) * 4, gx = doc.left - box.left - 14 - Number(src.dataset.src) * 5
      path.setAttribute('d', `M${x1},${y1} V${gy} H${gx} V${y2} H${x2}`)
      path.classList.toggle('is-on', on)
    }
    let stage = 0
    const render = n => {
      stage = n
      wires.setAttribute('viewBox', `0 0 ${build.clientWidth} ${build.clientHeight}`)
      srcs.forEach((src, i) => { src.classList.toggle('is-on', n >= i + 1); src.classList.toggle('is-now', n === i + 1); drawWire(src, field(src.dataset.to), n >= i + 1 && n === i + 1) })
      typeIn(field('f1').querySelector('b'), n >= 1)
      typeIn(field('f3').querySelector('b'), n >= 2)
      ;['f2', 'f4', 'f5'].forEach(id => typeIn(field(id).querySelector('b'), n >= 4))
      build.classList.toggle('st-sign', n >= 3)
      build.classList.toggle('st-photo', n >= 4)
      build.classList.toggle('st-stamp', n >= 5)
      ;['f1', 'f3', 'sign', 'f2'].forEach((id, i) => field(id).classList.toggle('is-now', n === i + 1))
      steps.forEach((b, i) => { const li = b.parentElement; li.classList.toggle('is-on', i + 1 === n); li.classList.toggle('is-done', i + 1 < n); b.setAttribute('aria-pressed', String(i + 1 === n)) })
    }
    if (reduced) { build.classList.add('asm-static') }
    else {
      build.classList.add('asm-live')
      render(0)
      let timer = 0
      const play = () => { let n = 0; clearInterval(timer); timer = setInterval(() => { render(++n); if (n >= 5) clearInterval(timer) }, 1400) }
      steps.forEach((b, i) => b.addEventListener('click', () => { clearInterval(timer); render(i + 1) }))
      new IntersectionObserver((entries, obs) => { if (entries[0].isIntersecting) { obs.disconnect(); setTimeout(play, 300) } }, { threshold: 0.35 }).observe(build)
      addEventListener('resize', () => render(stage))
    }
  }

  // Бургер-меню на телефоне
  const burger = document.querySelector('.burger'), menu = document.getElementById('m-menu')
  if (burger && menu) {
    const toggle = open => { menu.hidden = !open; burger.setAttribute('aria-expanded', String(open)) }
    burger.addEventListener('click', () => toggle(menu.hidden))
    menu.addEventListener('click', e => { if (e.target.closest('a')) toggle(false) })
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false) })
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
    const ok = /^(Заявка отправлена|Открыли письмо)/.test(message.textContent) && !message.classList.contains('is-error')
    stamp.classList.toggle('is-pending', !ok)
    stamp.classList.toggle('is-stamped', ok)
  }).observe(message, { childList: true, characterData: true, subtree: true, attributes: true })
  sync()
})()
