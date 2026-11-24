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

  // Первый экран: аксонометрия жилого комплекса — стилобат с паркингом и две секции по 16 этажей.
  // Этажи растут снизу вверх, скрытые работы — синим пунктиром (как невидимые линии на чертеже), счётчик актов идёт вместе с этажами
  const axo = document.getElementById('axo')
  const FH = 3.2, POD = 7, ACTS_PER_FLOOR = 5, PARKING_ACTS = 12
  const towers = [{ x: 4, y: 4, w: 16, dp: 16, lag: 0, floors: 20 }, { x: 28, y: 4, w: 16, dp: 16, lag: 55, floors: 16 }]
  const FLOORS = Math.max(...towers.map(t => t.floors))
  const totalActs = towers.reduce((sum, t) => sum + t.floors, 0) * ACTS_PER_FLOOR + PARKING_ACTS
  if (axo) {
    const NS = 'http://www.w3.org/2000/svg'
    const U = 7, C = Math.cos(Math.PI / 6)
    const P = (x, y, z) => [(x - y) * C * U, (x + y) * 0.5 * U - z * U]
    const pts = list => list.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ')
    const node = (tag, attrs, parent = axo) => {
      const el = document.createElementNS(NS, tag)
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
      parent.append(el)
      return el
    }
    const line = (list, cls, d, parent) => {
      const attrs = { points: pts(list), class: cls, style: `--d: ${d}ms` }
      if (/ax-(work|dim)/.test(cls)) attrs.pathLength = 1
      return node('polyline', attrs, parent)
    }
    const box = (x, y, z, w, dp, h, cls, d, parent = axo) => {
      const g = node('g', { class: 'ax-box ' + cls, style: `--d: ${d}ms` }, parent)
      node('polygon', { points: pts([[x, y + dp, z], [x + w, y + dp, z], [x + w, y + dp, z + h], [x, y + dp, z + h]]), class: 'f-l' }, g)
      node('polygon', { points: pts([[x + w, y, z], [x + w, y + dp, z], [x + w, y + dp, z + h], [x + w, y, z + h]]), class: 'f-r' }, g)
      node('polygon', { points: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + dp, z + h], [x, y + dp, z + h]]), class: 'f-t' }, g)
      return g
    }
    const PL = 48, PW = 24
    const floorAt = f => 1700 + f * 110

    // Оси комплекса
    const axes = node('g', { class: 'ax-axes' })
    'АБВГДЕЖ'.split('').forEach((n, i) => {
      const x = i * 8
      line([[x, -4, 0], [x, PW + 2, 0]], 'ax-axis', i * 50, axes)
      const [cx, cy] = P(x, -6, 0)
      const g = node('g', { class: 'ax-fade', style: `--d: ${150 + i * 50}ms` }, axes)
      node('circle', { cx, cy, r: 9, class: 'ax-bubble' }, g)
      node('text', { x: cx, y: cy + 4, class: 'ax-bubble-t', 'text-anchor': 'middle' }, g).textContent = n
    })
    ;[0, 12, 24].forEach((y, i) => {
      line([[-4, y, 0], [PL + 2, y, 0]], 'ax-axis', 350 + i * 50, axes)
      const [cx, cy] = P(-6, y, 0)
      const g = node('g', { class: 'ax-fade', style: `--d: ${500 + i * 50}ms` }, axes)
      node('circle', { cx, cy, r: 9, class: 'ax-bubble' }, g)
      node('text', { x: cx, y: cy + 4, class: 'ax-bubble-t', 'text-anchor': 'middle' }, g).textContent = String(i + 1)
    })

    // Контур заземления вокруг стилобата
    line([[-3, -3, 0], [PL + 3, -3, 0], [PL + 3, PW + 3, 0], [-3, PW + 3, 0], [-3, -3, 0]], 'ax-work ax-strip', 700)

    // Стилобат: два уровня паркинга, лотки по фасадам — пунктиром, как скрытые
    box(0, 0, 0, PL, PW, POD, 'ax-pod', 900)
    line([[0, PW, 3.5], [PL, PW, 3.5]], 'ax-level', 1000)
    line([[PL, 0, 3.5], [PL, PW, 3.5]], 'ax-level', 1000)
    line([[2, PW, 2.6], [PL - 2, PW, 2.6]], 'ax-hidden ax-fade', 1500)
    line([[2, PW, 6.1], [PL - 2, PW, 6.1]], 'ax-hidden ax-fade', 1600)
    line([[PL, 2, 6.1], [PL, PW - 2, 6.1]], 'ax-hidden ax-fade', 1600)

    // Секции: этаж за этажом, дальняя первой. На фасаде — стояк ВРУ и этажные ответвления пунктиром
    for (const t of towers) {
      const g = node('g', { class: 'ax-tower' })
      for (let f = 0; f < t.floors; f++) {
        const z = POD + f * FH, d = floorAt(f) + t.lag
        const fl = box(t.x, t.y, z, t.w, t.dp, FH, 'ax-floor', d, g)
        // импосты окон на двух видимых гранях
        for (let k = 2; k < t.w; k += 2.7) node('polyline', { points: pts([[t.x + k, t.y + t.dp, z + 0.6], [t.x + k, t.y + t.dp, z + FH - 0.5]]), class: 'ax-mull' }, fl)
        for (let k = 2; k < t.dp; k += 2.7) node('polyline', { points: pts([[t.x + t.w, t.y + k, z + 0.6], [t.x + t.w, t.y + k, z + FH - 0.5]]), class: 'ax-mull' }, fl)
        // стояк и ответвление к этажному щиту
        node('polyline', { points: pts([[t.x + t.w * 0.55, t.y + t.dp, z], [t.x + t.w * 0.55, t.y + t.dp, z + FH]]), class: 'ax-hidden' }, fl)
        node('polyline', { points: pts([[t.x + t.w * 0.55, t.y + t.dp, z + 1.6], [t.x + t.w * 0.8, t.y + t.dp, z + 1.6]]), class: 'ax-hidden' }, fl)
      }
    }

    // Выноски
    const top = POD + towers[0].floors * FH
    const tags = [
      { at: [PL + 3, 14, 0], dx: 30, dy: 46, n: 'АОСР · заземление', t: 'Контур вокруг комплекса', d: 900 },
      { at: [24, PW, 6.1], dx: -60, dy: 60, n: 'АОСР · паркинг', t: 'Лотки и кабель, 2 уровня', d: 1700, left: true },
      { at: [28 + 16 * 0.55, 20, POD + 6 * FH], dx: 70, dy: -10, n: 'АОСР · стояки', t: 'ВРУ → этажные щиты', d: floorAt(8) },
      { at: [4 + 8, 4, top], dx: 60, dy: -20, n: 'Секция 1 · 20 этажей', t: 'по 5 актов на этаж', d: floorAt(FLOORS) + 200 }
    ]
    for (const tag of tags) {
      const [ax, ay] = P(...tag.at)
      const ex = ax + tag.dx, ey = ay + tag.dy
      const g = node('g', { class: 'ax-tag', style: `--d: ${tag.d}ms` })
      const leader = node('polyline', { class: 'ax-leader' }, g)
      node('circle', { cx: ax, cy: ay, r: 4, class: 'ax-pin' }, g)
      const num = node('text', { x: 0, y: ey - 26, class: 'ax-tag-n' }, g); num.textContent = tag.n
      const name = node('text', { x: 0, y: ey - 7, class: 'ax-tag-t' }, g); name.textContent = tag.t
      const width = Math.max(num.getComputedTextLength(), name.getComputedTextLength()) + 16
      const x0 = tag.left ? ex - width : ex + 8
      num.setAttribute('x', x0); name.setAttribute('x', x0)
      leader.setAttribute('points', `${ax},${ay} ${ex},${ey} ${tag.left ? ex - width : ex + width},${ey}`)
    }

    const bb = axo.getBBox()
    axo.setAttribute('viewBox', `${(bb.x - 10).toFixed(0)} ${(bb.y - 10).toFixed(0)} ${(bb.width + 20).toFixed(0)} ${(bb.height + 20).toFixed(0)}`)

    // Счётчик актов: растёт вместе с этажами, итог — в разметке
    const counter = document.getElementById('axo-n')
    if (counter && !reduced) {
      counter.textContent = '0'
      const start = performance.now() + floorAt(0) - 400, end = performance.now() + floorAt(FLOORS) + 55
      const tick = now => {
        const k = Math.min(1, Math.max(0, (now - start) / (end - start)))
        counter.textContent = String(Math.round(k * totalActs))
        if (k < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
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
