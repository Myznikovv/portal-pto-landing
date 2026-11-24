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

  // Первый экран: тонколинейная аксонометрия пролёта. Оси → каркас → пять скрытых работ по очереди, к каждой выноска АОСР.
  // Чертёж строится в осях здания (метры), проекция изометрическая; задержки появления — в --d (мс)
  const axo = document.getElementById('axo')
  if (axo) {
    const NS = 'http://www.w3.org/2000/svg'
    const U = 30, C = Math.cos(Math.PI / 6)
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
      if (/ax-(work|dim|flow)/.test(cls)) attrs.pathLength = 1   // только прорисовываемым: у пунктирных осей и сетки штрих задан в единицах чертежа
      return node('polyline', attrs, parent)
    }
    // Параллелепипед: видны верх и две ближние грани (к +x и +y)
    const box = (x, y, z, w, dp, h, cls, d) => {
      const g = node('g', { class: 'ax-box ' + cls, style: `--d: ${d}ms` })
      node('polygon', { points: pts([[x, y + dp, z], [x + w, y + dp, z], [x + w, y + dp, z + h], [x, y + dp, z + h]]), class: 'f-l' }, g)
      node('polygon', { points: pts([[x + w, y, z], [x + w, y + dp, z], [x + w, y + dp, z + h], [x + w, y, z + h]]), class: 'f-r' }, g)
      node('polygon', { points: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + dp, z + h], [x, y + dp, z + h]]), class: 'f-t' }, g)
      return g
    }
    const L = 12, W = 6, H = 3.4

    // Заземление лежит ниже плиты — рисуем первым, плита перекроет дальние стороны
    const W1 = 1400, W2 = 2100, W3 = 2800, W4 = 3500, W5 = 4200
    line([[-0.8, -0.8, -1], [L + 0.8, -0.8, -1], [L + 0.8, W + 0.8, -1], [-0.8, W + 0.8, -1], [-0.8, -0.8, -1]], 'ax-work ax-strip', W1)
    for (const [x, y] of [[L + 0.8, -0.8], [L + 0.8, W + 0.8], [-0.8, W + 0.8]]) line([[x, y, -1], [x, y, -2.4]], 'ax-work ax-strip', W1 + 300)
    line([[L + 0.8, W + 0.8, -0.3], [L + 0.8, W + 0.8, -1]], 'ax-work ax-strip', W1 + 300)

    // Оси и размеры
    const axes = node('g', { class: 'ax-axes' })
    ;[[0, '1'], [6, '2'], [12, '3']].forEach(([x, n], i) => {
      line([[x, -2, 0], [x, W + 0.6, 0]], 'ax-axis', i * 80, axes)
      const [cx, cy] = P(x, -2.5, 0)
      const g = node('g', { class: 'ax-fade', style: `--d: ${200 + i * 80}ms` }, axes)
      node('circle', { cx, cy, r: 11, class: 'ax-bubble' }, g)
      node('text', { x: cx, y: cy + 4, class: 'ax-bubble-t', 'text-anchor': 'middle' }, g).textContent = n
    })
    ;[[0, 'А'], [6, 'Б']].forEach(([y, n], i) => {
      line([[-2, y, 0], [L + 0.6, y, 0]], 'ax-axis', 240 + i * 80, axes)
      const [cx, cy] = P(-2.5, y, 0)
      const g = node('g', { class: 'ax-fade', style: `--d: ${440 + i * 80}ms` }, axes)
      node('circle', { cx, cy, r: 11, class: 'ax-bubble' }, g)
      node('text', { x: cx, y: cy + 4, class: 'ax-bubble-t', 'text-anchor': 'middle' }, g).textContent = n
    })
    line([[0, -1.4, 0], [L, -1.4, 0]], 'ax-dim', 400, axes)
    ;[3, 9].forEach((x, i) => {
      const [tx, ty] = P(x, -3.3, 0)
      node('text', { x: tx, y: ty, class: 'ax-dim-t ax-fade', 'text-anchor': 'middle', style: `--d: ${600 + i * 80}ms` }, axes).textContent = '6000'
    })

    // Каркас: плита пола, колонны, щит на дальней стене, фантом перекрытия и каркас потолка
    box(0, 0, -0.3, L, W, 0.3, 'ax-slab', 500)
    box(9.5, 0, 0.9, 1.2, 0.3, 1.4, 'ax-panel', 900)
    const [px, py] = P(9.4, 0.3, 1.6)
    node('text', { x: px - 8, y: py, class: 'ax-panel-t ax-fade', 'text-anchor': 'end', style: '--d: 1000ms' }).textContent = 'ЩР-1'
    ;[[0, 0], [6, 0], [12, 0], [0, W], [6, W], [12, W]]
      .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
      .forEach(([x, y], i) => box(x - 0.22, y - 0.22, 0, 0.44, 0.44, H, 'ax-col', 650 + i * 70))
    line([[0, 0, H], [L, 0, H], [L, W, H], [0, W, H], [0, 0, H]], 'ax-phantom', 1000)
    const grid = node('g', { class: 'ax-ceilgrid' })
    for (let x = 4.8; x <= L; x += 1.2) line([[x, 0, 2.85], [x, W, 2.85]], 'ax-grid', 1100, grid)
    for (let y = 0; y <= W; y += 1.2) line([[4.8, y, 2.85], [L, y, 2.85]], 'ax-grid', 1150, grid)

    // Гофротруба в стяжке пола к щиту
    line([[2, 5.2, 0.02], [2, 1.2, 0.02], [9.8, 1.2, 0.02], [9.8, 0.3, 0.02], [9.8, 0.3, 0.9]], 'ax-work ax-pipe', W2)
    // Лотки под перекрытием на шпильках
    for (let x = 1.6; x < 11; x += 1.6) line([[x, 3, H], [x, 3, 3.12]], 'ax-work ax-rod', W3)
    box(1, 2.8, 3.02, 10, 0.4, 0.1, 'ax-tray ax-work-box', W3 + 200)
    // Кабель в лотках и к щиту
    line([[1.3, 3, 3.13], [10.6, 3, 3.13]], 'ax-work ax-cable', W4)
    line([[10.6, 3, 3.13], [10.1, 3, 3.13], [10.1, 0.3, 3.13], [10.1, 0.3, 2.3]], 'ax-work ax-cable', W5)
    // «Ток» по кабелям после сборки
    line([[1.3, 3, 3.13], [10.6, 3, 3.13], [10.1, 3, 3.13], [10.1, 0.3, 3.13], [10.1, 0.3, 2.3]], 'ax-flow', 0)
    line([[2, 5.2, 0.02], [2, 1.2, 0.02], [9.8, 1.2, 0.02], [9.8, 0.3, 0.02], [9.8, 0.3, 0.9]], 'ax-flow', 0)

    // Выноски: точка на работе → полка → номер акта и название; галочка-печать, когда акт готов
    const tags = [
      { at: [L + 0.8, 4, -1], dx: 46, dy: 56, n: 'АОСР-1', t: 'Контур заземления', d: W1 },
      { at: [2, 4, 0.02], dx: -70, dy: 70, n: 'АОСР-2', t: 'Гофротруба в стяжке', d: W2, left: true },
      { at: [3.2, 2.8, 3.07], dx: -40, dy: -84, n: 'АОСР-3', t: 'Лотки 200×50', d: W3, left: true },
      { at: [7.5, 3, 3.13], dx: 30, dy: -96, n: 'АОСР-4', t: 'Кабель в лотках', d: W4 },
      { at: [10.1, 0.3, 2.8], dx: 70, dy: -40, n: 'АОСР-5', t: 'Кабель к ЩР-1', d: W5 }
    ]
    for (const tag of tags) {
      const [ax, ay] = P(...tag.at)
      const ex = ax + tag.dx, ey = ay + tag.dy
      const g = node('g', { class: 'ax-tag', style: `--d: ${tag.d + 600}ms` })
      const leader = node('polyline', { class: 'ax-leader' }, g)
      node('circle', { cx: ax, cy: ay, r: 4, class: 'ax-pin' }, g)
      const num = node('text', { x: 0, y: ey - 26, class: 'ax-tag-n' }, g); num.textContent = tag.n
      const name = node('text', { x: 0, y: ey - 7, class: 'ax-tag-t' }, g); name.textContent = tag.t
      // Полка по длине текста: номер и название над ней, галочка-печать в конце полки
      const width = Math.max(num.getComputedTextLength(), name.getComputedTextLength()) + 44
      const x0 = tag.left ? ex - width : ex
      num.setAttribute('x', x0 + (tag.left ? 0 : 8)); name.setAttribute('x', x0 + (tag.left ? 0 : 8))
      leader.setAttribute('points', `${ax},${ay} ${ex},${ey} ${tag.left ? ex - width : ex + width},${ey}`)
      const cx = tag.left ? ex - 16 : ex + width - 16
      node('circle', { cx, cy: ey - 20, r: 12, class: 'ax-check' }, g)
      node('text', { x: cx, y: ey - 15, class: 'ax-check-t', 'text-anchor': 'middle' }, g).textContent = '✓'
    }

    const bb = axo.getBBox()
    axo.setAttribute('viewBox', `${(bb.x - 10).toFixed(0)} ${(bb.y - 10).toFixed(0)} ${(bb.width + 20).toFixed(0)} ${(bb.height + 20).toFixed(0)}`)
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
