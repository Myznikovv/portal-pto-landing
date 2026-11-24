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

  // Первый экран: «рентген скрытых работ». Готовый комплекс → скан снизу вверх проявляет скрытые работы →
  // с каждого этажа вылетает лист акта и ложится в стопку комплекта ИД → печать. Без анимации — сразу итог
  const FH = 3.2, POD = 7, ACTS_PER_FLOOR = 5, PARKING_ACTS = 12
  const towers = [{ x: 4, y: 4, w: 16, dp: 16, floors: 20 }, { x: 28, y: 4, w: 16, dp: 16, floors: 16 }]
  const totalActs = towers.reduce((sum, t) => sum + t.floors, 0) * ACTS_PER_FLOOR + PARKING_ACTS
  const axo = document.getElementById('axo')
  const counter = document.getElementById('axo-n')
  if (axo) {
    const NS = 'http://www.w3.org/2000/svg'
    const U = 8, C = Math.cos(Math.PI / 6)
    const P = (x, y, z) => [(x - y) * C * U, (x + y) * 0.5 * U - z * U]
    const pts = list => list.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ')
    const node = (tag, attrs, parent = axo) => {
      const el = document.createElementNS(NS, tag)
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
      parent.append(el)
      return el
    }
    const poly = (list, cls, parent) => node('polyline', { points: pts(list), class: cls }, parent)
    const box = (x, y, z, w, dp, h, cls, parent) => {
      const g = node('g', { class: cls }, parent)
      node('polygon', { points: pts([[x, y + dp, z], [x + w, y + dp, z], [x + w, y + dp, z + h], [x, y + dp, z + h]]), class: 'f-l' }, g)
      node('polygon', { points: pts([[x + w, y, z], [x + w, y + dp, z], [x + w, y + dp, z + h], [x + w, y, z + h]]), class: 'f-r' }, g)
      node('polygon', { points: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + dp, z + h], [x, y + dp, z + h]]), class: 'f-t' }, g)
      return g
    }
    const PL = 48, PW = 24
    const defs = node('defs', {})
    const clip = node('clipPath', { id: 'ax-reveal' }, defs)
    const revealRect = node('rect', { x: -2000, y: -2000, width: 4000, height: 4000 }, clip)
    const grad = node('linearGradient', { id: 'ax-scan-g', x1: 0, y1: 1, x2: 0, y2: 0 }, defs)
    node('stop', { offset: '0', class: 'ax-scan-s0' }, grad)
    node('stop', { offset: '1', class: 'ax-scan-s1' }, grad)

    // Оси комплекса
    const axes = node('g', { class: 'ax-axes' })
    'АБВГДЕЖ'.split('').forEach((n, i) => {
      poly([[i * 8, -4, 0], [i * 8, PW + 3, 0]], 'ax-axis', axes)
      const [cx, cy] = P(i * 8, -6, 0)
      node('circle', { cx, cy, r: 9, class: 'ax-bubble' }, axes)
      node('text', { x: cx, y: cy + 4, class: 'ax-bubble-t', 'text-anchor': 'middle' }, axes).textContent = n
    })
    ;[0, 12, 24].forEach((y, i) => {
      poly([[-4, y, 0], [PL + 3, y, 0]], 'ax-axis', axes)
      const [cx, cy] = P(-6, y, 0)
      node('circle', { cx, cy, r: 9, class: 'ax-bubble' }, axes)
      node('text', { x: cx, y: cy + 4, class: 'ax-bubble-t', 'text-anchor': 'middle' }, axes).textContent = String(i + 1)
    })

    // Контур заземления — под зданием, тоже проявляется сканом
    const ground = node('g', { class: 'ax-works', 'clip-path': 'url(#ax-reveal)' })
    poly([[-3, -3, 0], [PL + 3, -3, 0], [PL + 3, PW + 3, 0], [-3, PW + 3, 0], [-3, -3, 0]], 'ax-strip', ground)

    // Здание: стилобат и секции (дальняя первой)
    const building = node('g', { class: 'ax-building' })
    const podium = node('g', { class: 'ax-step' }, building)
    box(0, 0, 0, PL, PW, POD, 'ax-pod', podium)
    poly([[0, PW, 3.5], [PL, PW, 3.5], [PL, 0, 3.5]], 'ax-level', podium)
    const floorEls = []
    const maxFloors = Math.max(...towers.map(t => t.floors))
    for (const t of towers) {
      for (let f = 0; f < t.floors; f++) {
        const z = POD + f * FH
        const fl = box(t.x, t.y, z, t.w, t.dp, FH, 'ax-floor ax-step', building)
        floorEls.push({ g: fl, at: 0.1 + (f / maxFloors) * 0.34 + (t === towers[1] ? 0.008 : 0) })
        for (let k = 2; k < t.w; k += 2.7) poly([[t.x + k, t.y + t.dp, z + 0.6], [t.x + k, t.y + t.dp, z + FH - 0.5]], 'ax-mull', fl)
        for (let k = 2; k < t.dp; k += 2.7) poly([[t.x + t.w, t.y + k, z + 0.6], [t.x + t.w, t.y + k, z + FH - 0.5]], 'ax-mull', fl)
      }
    }

    // Скрытые работы — под маской скана
    const works = node('g', { class: 'ax-works', 'clip-path': 'url(#ax-reveal)' })
    for (const z of [2.6, 6.1]) {
      poly([[2, PW, z], [PL - 2, PW, z]], 'ax-hidden', works)
      poly([[PL, 2, z], [PL, PW - 2, z]], 'ax-hidden', works)
    }
    const flows = []
    for (const t of towers) {
      const rx = t.x + t.w * 0.55, top = POD + t.floors * FH
      const riser = [[rx, t.y + t.dp, 1], [rx, t.y + t.dp, top - 1]]
      poly(riser, 'ax-riser', works)
      flows.push(riser)
      for (let f = 0; f < t.floors; f++) {
        const z = POD + f * FH + 1.5
        poly([[rx, t.y + t.dp, z], [t.x + 2, t.y + t.dp, z]], 'ax-hidden', works)
        poly([[t.x + t.w, t.y + 2, z], [t.x + t.w, t.y + t.dp - 2, z]], 'ax-hidden', works)
        const [qx, qy] = P(rx + 2.4, t.y + t.dp, z)
        node('rect', { x: qx - 3, y: qy - 4, width: 6, height: 8, class: 'ax-board' }, works)
      }
    }
    const flowLayer = node('g', { class: 'ax-flows', 'clip-path': 'url(#ax-reveal)' })
    flows.forEach(f => node('polyline', { points: pts(f), class: 'ax-flow', pathLength: 1 }, flowLayer))

    // Скан
    const bb = building.getBBox()
    const bottom = bb.y + bb.height + 40, topY = bb.y - 20
    const scan = node('g', { class: 'ax-scan' })
    node('rect', { x: bb.x - 30, y: 0, width: bb.width + 60, height: 70, fill: 'url(#ax-scan-g)' }, scan)
    node('line', { x1: bb.x - 30, y1: 0, x2: bb.x + bb.width + 30, y2: 0, class: 'ax-scan-line' }, scan)

    // Стопка комплекта ИД справа
    const sx = bb.x + bb.width + 90, sy = bb.y + bb.height * 0.62
    const stack = node('g', { class: 'ax-stack' })
    node('rect', { x: sx - 56, y: sy, width: 112, height: 16, rx: 2, class: 'ax-folder' }, stack)
    node('text', { x: sx, y: sy + 36, class: 'ax-stack-t', 'text-anchor': 'middle' }, stack).textContent = 'КОМПЛЕКТ ИД · PDF'
    const pile = node('g', {}, stack)
    const stampAt = node('g', { transform: `translate(${sx + 62} ${sy - 112}) rotate(-12)` })
    const stamp = node('g', { class: 'ax-stamp' }, stampAt)
    node('circle', { r: 46, class: 'ax-stamp-c' }, stamp)
    node('circle', { r: 39, class: 'ax-stamp-c2' }, stamp)
    node('text', { y: -2, class: 'ax-stamp-t', 'text-anchor': 'middle' }, stamp).textContent = `${totalActs} АОСР`
    node('text', { y: 16, class: 'ax-stamp-t2', 'text-anchor': 'middle' }, stamp).textContent = 'ИД собрана'
    const sheet = (parent, x, y, cls) => {
      const g = node('g', { class: cls, transform: `translate(${x} ${y})` }, parent)
      node('rect', { x: -21, y: -27, width: 42, height: 54, rx: 2, class: 'ax-sheet' }, g)
      for (let i = 0; i < 5; i++) node('line', { x1: -14, y1: -18 + i * 7, x2: i === 4 ? 0 : 14, y2: -18 + i * 7, class: 'ax-sheet-l' }, g)
      node('circle', { cx: 9, cy: 16, r: 6, class: 'ax-sheet-s' }, g)
      return g
    }
    let piled = 0
    const addToPile = () => { sheet(pile, sx + ((piled % 3) - 1) * 1.6, sy - 27 - piled * 1.8, 'ax-piled'); piled++ }

    // Выноски
    const tags = [
      { at: [PL + 3, 14, 0], dx: 26, dy: 40, n: 'АОСР · заземление', t: 'Контур вокруг комплекса', z: 0 },
      { at: [24, PW, 6.1], dx: -70, dy: 64, n: 'АОСР · паркинг', t: 'Лотки и кабель, 2 уровня', z: 6, left: true },
      { at: [4 + 16 * 0.55, 20, POD + 13 * FH], dx: -90, dy: -40, n: 'АОСР · стояки', t: 'ВРУ → этажные щиты', z: POD + 13 * FH, left: true }
    ]
    const tagEls = tags.map(tag => {
      const [ax, ay] = P(...tag.at)
      const ex = ax + tag.dx, ey = ay + tag.dy
      const g = node('g', { class: 'ax-tag' })
      const leader = node('polyline', { class: 'ax-leader' }, g)
      node('circle', { cx: ax, cy: ay, r: 4, class: 'ax-pin' }, g)
      const num = node('text', { x: 0, y: ey - 26, class: 'ax-tag-n' }, g); num.textContent = tag.n
      const name = node('text', { x: 0, y: ey - 7, class: 'ax-tag-t' }, g); name.textContent = tag.t
      const width = Math.max(num.getComputedTextLength(), name.getComputedTextLength()) + 16
      const x0 = tag.left ? ex - width : ex + 8
      num.setAttribute('x', x0); name.setAttribute('x', x0)
      leader.setAttribute('points', `${ax},${ay} ${ex},${ey} ${tag.left ? ex - width : ex + width},${ey}`)
      return { g, y: ay }
    })

    // События скана: паркинг (2 листа), затем этажи обеих секций — по листу на этаж
    const events = [{ y: P(PL, PW, 2)[1], acts: PARKING_ACTS / 2, from: P(PL / 2, PW, 2) }, { y: P(PL, PW, 5.5)[1], acts: PARKING_ACTS / 2, from: P(PL / 2, PW, 5.5) }]
    for (const t of towers) for (let f = 0; f < t.floors; f++) {
      const z = POD + f * FH + FH / 2
      events.push({ y: P(t.x + t.w, t.y + t.dp, z)[1], acts: ACTS_PER_FLOOR, from: P(t.x + t.w * 0.6, t.y + t.dp, z) })
    }
    const all = axo.getBBox()
    axo.setAttribute('viewBox', `${(all.x - 12).toFixed(0)} ${(all.y - 12).toFixed(0)} ${(all.width + 24).toFixed(0)} ${(all.height + 24).toFixed(0)}`)

    // ── Состояние сцены по прогрессу p ∈ [0, 1]: прокрутка (закреплённая сцена) или таймер (телефон)
    const order = events.sort((a, b) => b.y - a.y)
    const stages = [...document.querySelectorAll('#hero-stages li')]
    const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)))
    const SCAN_A = 0.48, SCAN_B = 0.88
    let committed = 0, lastP = 0
    const inflight = new Set()
    const fly = ev => {
      const [fx, fy] = ev.from
      const g = sheet(axo, 0, 0, 'ax-flying')
      const tx = sx, ty = sy - 27 - pile.childElementCount * 1.8
      const mx = (fx + tx) / 2, my = Math.min(fy, ty) - 80
      const anim = g.animate([
        { transform: `translate(${fx}px, ${fy}px) scale(0.3)`, opacity: 0 },
        { transform: `translate(${mx}px, ${my}px) scale(0.9) rotate(-8deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${tx}px, ${ty}px) scale(1) rotate(0deg)`, opacity: 1 }
      ], { duration: 900, easing: 'cubic-bezier(0.3, 0.6, 0.3, 1)' })
      inflight.add(anim)
      anim.onfinish = () => { inflight.delete(anim); g.remove(); addToPile() }
    }
    const render = (p, animateSheets) => {
      axes.style.opacity = seg(p, 0, 0.05)
      podium.classList.toggle('is-on', p > 0.05)
      floorEls.forEach(f => f.g.classList.toggle('is-on', p > f.at))
      const k = seg(p, SCAN_A, SCAN_B)
      const y = bottom - (bottom - topY) * k
      scan.setAttribute('transform', `translate(0 ${y.toFixed(1)})`)
      axo.classList.toggle('is-scanning', p > SCAN_A - 0.01 && p < SCAN_B + 0.02)
      revealRect.setAttribute('y', k >= 1 ? -2000 : (k > 0 ? y : bottom + 500).toFixed(1))
      let crossed = 0, acts = 0
      if (k > 0) while (crossed < order.length && order[crossed].y > y) acts += order[crossed++].acts
      if (crossed < committed) {
        inflight.forEach(anim => anim.finish())
        while (pile.childElementCount > crossed) pile.lastChild.remove()
        piled = pile.childElementCount
      } else {
        for (let i = committed; i < crossed; i++) (animateSheets && crossed - committed <= 4) ? fly(order[i]) : addToPile()
      }
      committed = crossed
      if (counter) counter.textContent = String(p >= SCAN_B ? totalActs : acts)
      tagEls.forEach(t => t.g.classList.toggle('is-on', k > 0 && t.y > y))
      axo.classList.toggle('is-done', p > 0.92)
      const stage = p < 0.47 ? 0 : k < 0.08 ? 1 : k < 0.22 ? 2 : p < 0.92 ? 3 : 4
      stages.forEach((li, i) => { li.classList.toggle('is-on', i === stage); li.classList.toggle('is-done', i < stage) })
    }

    const hero = document.getElementById('s1')
    const canPinHero = () => !reduced && matchMedia('(min-width: 901px)').matches && innerHeight >= 640
    let autoplay = 0
    const onScroll = () => {
      if (!hero.classList.contains('is-pinned')) return
      const r = hero.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
      render(p, p > lastP)
      lastP = p
    }
    const setup = () => {
      cancelAnimationFrame(autoplay)
      if (reduced) { hero.classList.remove('is-pinned'); axo.classList.add('is-static'); render(1, false); return }
      if (canPinHero()) { hero.classList.add('is-pinned'); onScroll(); return }
      hero.classList.remove('is-pinned')
      const t0 = performance.now()
      const tick = now => { const p = Math.min(1, (now - t0) / 9000); render(p, true); if (p < 1) autoplay = requestAnimationFrame(tick) }
      autoplay = requestAnimationFrame(tick)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', setup)
    render(0, false)
    setup()
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
