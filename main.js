// Лендинг ПТО: динамика и форма. Страница читается и без этого скрипта: текст и итоговое состояние акта уже в разметке.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

// ── Куда уходят заявки. Пусто — открывается письмо в почте посетителя. Адрес приёма заявок (скрипт/CRM) укажет владелец сайта
const LEAD_ENDPOINT = ''
const LEAD_EMAIL = '7537070@mail.ru'

// ── Заголовок «собирается»: буквы сходятся слева направо. Настоящий текст уже в разметке (sr-only) и остаётся после анимации
const glyphs = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ'
const scramble = el => {
  const final = el.dataset.scramble
  if (reduced) return
  const start = performance.now()
  const tick = now => {
    const progress = Math.min(1, (now - start) / 800)
    el.textContent = [...final].map((ch, i) => (/\s|[—.]/.test(ch) || i / final.length < progress ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('')
    if (progress < 1) requestAnimationFrame(tick)
    else el.textContent = final
  }
  requestAnimationFrame(tick)
}
const seen = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return
  seen.unobserve(entry.target)
  if (entry.target.dataset.scramble) scramble(entry.target)
  if (entry.target.classList.contains('reveal')) entry.target.classList.add('is-in')
}), { threshold: 0.4 })
$$('[data-scramble], .reveal').forEach(el => seen.observe(el))
if (reduced) $$('.reveal').forEach(el => el.classList.add('is-in'))

// ── Полоса прогресса, рейка листов, шапка
const bar = $('#progress'), rail = $('#rail')
const sheets = $$('[id^="s"]').filter(el => /^s\d$/.test(el.id))
sheets.forEach((section, i) => {
  const link = document.createElement('a')
  link.href = '#' + section.id
  link.textContent = String(i + 1).padStart(2, '0')
  link.setAttribute('aria-label', 'Лист ' + (i + 1))
  rail.append(link)
})

// ── Длинная иллюстрация: прокрутка по закреплённой сцене двигает разрез вбок, дорисовывает работы по очереди и отмечает акты
const story = $('#s3'), reel = $('#reel'), cut = $('#cut'), works = $$('#cut .w'), acts = $$('#acts .act')
// Закрепляем только на широком и достаточно высоком экране; на телефоне разрез листается пальцем и показан целиком
const canPin = () => !reduced && matchMedia('(min-width: 801px)').matches && innerHeight >= 700
const syncPin = () => {
  const pin = canPin()
  story.classList.toggle('is-pinned', pin)
  if (!pin) {
    cut.style.transform = ''
    works.forEach(work => work.style.setProperty('--d', 1))
  }
}
const updateStory = () => {
  if (!story.classList.contains('is-pinned')) return
  const rect = story.getBoundingClientRect()
  const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)))
  const span = Math.max(0, cut.getBoundingClientRect().width - reel.clientWidth)
  cut.style.transform = `translateX(${-span * progress}px)`
  const n = works.length
  works.forEach((work, i) => work.style.setProperty('--d', Math.min(1, Math.max(0, progress * n * 1.08 - i))))
  const current = Math.min(n - 1, Math.floor(progress * n * 1.08))
  acts.forEach((act, i) => {
    const done = progress * n * 1.08 - i >= 1
    act.classList.toggle('is-done', done)
    act.classList.toggle('is-current', i === current && !done)
  })
}

const update = () => {
  bar.style.setProperty('--p', scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))
  let current = 0
  sheets.forEach((section, i) => { if (section.getBoundingClientRect().top < innerHeight * 0.5) current = i })
  ;[...rail.children].forEach((link, i) => { link.classList.toggle('is-current', i === current); link.classList.toggle('is-done', i < current) })
  updateStory()
}
addEventListener('scroll', update, { passive: true })
addEventListener('resize', () => { syncPin(); update() })
syncPin()
update()

// ── Тема заявки из кнопки «Стать дилером»
$$('[data-topic="dealer"]').forEach(button => button.addEventListener('click', () => { $('#f-topic').value = 'Стать дилером' }))

// ── Форма
const form = $('#form'), message = $('#form-msg')
const setError = (id, text) => { $('#' + id).textContent = text; return Boolean(text) }
form.addEventListener('submit', async event => {
  event.preventDefault()
  const data = Object.fromEntries(new FormData(form))
  const digits = String(data.phone || '').replace(/\D/g, '')
  const failed = [
    setError('e-name', data.name?.trim() ? '' : 'Укажите имя'),
    setError('e-phone', digits.length >= 10 ? '' : 'Введите номер полностью'),
    setError('e-consent', $('#f-consent').checked ? '' : 'Нужно согласие на обработку данных')
  ].some(Boolean)
  $('#f-name').parentElement.classList.toggle('is-error', Boolean($('#e-name').textContent))
  $('#f-phone').parentElement.classList.toggle('is-error', Boolean($('#e-phone').textContent))
  message.classList.remove('is-error')
  if (failed) { message.textContent = ''; return }

  const lines = [`Имя: ${data.name}`, `Телефон: ${data.phone}`, `Компания: ${data.company || '—'}`, `Что нужно: ${data.topic}`, `Комментарий: ${data.note || '—'}`]
  if (!LEAD_ENDPOINT) {
    location.href = `mailto:${LEAD_EMAIL}?subject=${encodeURIComponent('Заявка с лендинга ПТО')}&body=${encodeURIComponent(lines.join('\n'))}`
    message.textContent = 'Открыли письмо в вашей почте — отправьте его, и мы ответим.'
    return
  }
  try {
    const response = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!response.ok) throw new Error(String(response.status))
    form.reset()
    message.textContent = 'Заявка отправлена. Ответим в рабочее время.'
  } catch {
    message.classList.add('is-error')
    message.textContent = `Не удалось отправить. Позвоните: +7 977 753-70-70 или напишите на ${LEAD_EMAIL}.`
  }
})

// ── Изометрический объект на первом экране: этапы стройки появляются по очереди, к каждому «выпрыгивает» свой акт
const iso = $('#iso')
if (iso) {
  const NS = 'http://www.w3.org/2000/svg'
  const U = 22, C = Math.cos(Math.PI / 6), S = 0.5
  const P = (x, y, z) => [(x - y) * C * U, (x + y) * S * U - z * U]
  const el = (tag, attrs, parent) => { const node = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v)); parent.append(node); return node }
  const poly = (points, cls, parent) => el('polygon', { points: points.map(p => p.join(',')).join(' '), class: cls }, parent)
  // Видны верх и две передние грани (к зрителю по +x и +y)
  const box = (x, y, z, w, d, h, parent) => {
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'f-l', parent)
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], 'f-r', parent)
    poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'f-top', parent)
  }
  const stages = [
    { cls: 'ground', draw: g => box(0, 0, 0, 10, 8, 0, g) },
    { cls: 'found', act: ['АОСР-1', 'Фундамент'], at: [1, 7, 0.4], off: [-118, -30], draw: g => box(1, 1, 0, 8, 6, 0.8, g) },
    { cls: 'frame', act: ['АОСР-2', 'Каркас'], at: [1, 1, 5.2], off: [-118, -70], draw: g => {
      ;[[1, 1], [8.6, 1], [1, 4], [8.6, 4]].forEach(([x, y]) => box(x, y, 0.8, 0.4, 0.4, 4, g))
      box(1, 1, 4.8, 8, 0.4, 0.4, g); box(1, 1, 4.8, 0.4, 6, 0.4, g)
    } },
    { cls: 'tray', act: ['АОСР-3', 'Лотки'], at: [8.4, 2.4, 4.1], off: [26, -96], draw: g => {
      box(1.6, 2.2, 4.2, 6.8, 0.5, 0.2, g); box(1.6, 5, 4.2, 6.8, 0.5, 0.2, g); box(7.6, 5.6, 0.8, 0.3, 0.3, 3.4, g)
    } },
    { cls: 'panel', act: ['АОСР-4', 'Щитовая'], at: [8.5, 7, 1.6], off: [34, -24], draw: g => box(6.9, 6.2, 0.8, 1.6, 0.8, 2.4, g) },
    { cls: 'front', draw: g => {
      ;[[1, 6.6], [8.6, 6.6]].forEach(([x, y]) => box(x, y, 0.8, 0.4, 0.4, 4, g))
      box(8.6, 1, 4.8, 0.4, 6, 0.4, g); box(1, 6.6, 4.8, 8, 0.4, 0.4, g)
    } }
  ]
  const groups = stages.map(stage => { const g = el('g', { class: 'iso-stage ' + stage.cls }, iso); stage.draw(g); return g })
  // Лист акта: карточка с номером, строками и маленькой печатью
  const sheets = stages.filter(stage => stage.act).map(stage => {
    const [px, py] = P(...stage.at)
    const [dx, dy] = stage.off
    // Позиция — атрибутом на внешней группе, анимация — CSS на внутренней (CSS transform перебил бы атрибут)
    const place = el('g', { transform: `translate(${px + dx}, ${py + dy})` }, iso)
    const g = el('g', { class: 'iso-sheet' }, place)
    el('rect', { width: 92, height: 74, rx: 3 }, g)
    el('text', { x: 8, y: 18, class: 'hd' }, g).textContent = stage.act[0]
    el('text', { x: 8, y: 34, class: 'sub' }, g).textContent = stage.act[1]
    el('rect', { x: 8, y: 44, width: 48, height: 3, class: 'bar' }, g)
    el('rect', { x: 8, y: 52, width: 36, height: 3, class: 'bar' }, g)
    el('circle', { cx: 74, cy: 56, r: 11 }, g)
    el('text', { x: 66, y: 60, class: 'ok' }, g).textContent = '✓'
    return { g, stage }
  })
  const box2 = iso.getBBox()
  iso.setAttribute('viewBox', `${box2.x - 8} ${box2.y - 8} ${box2.width + 16} ${box2.height + 16}`)
  const show = () => {
    groups.forEach((g, i) => setTimeout(() => g.classList.add('is-on'), reduced ? 0 : 300 + i * 420))
    sheets.forEach(({ g, stage }) => setTimeout(() => g.classList.add('is-on'), reduced ? 0 : 300 + stages.indexOf(stage) * 420 + 260))
  }
  show()
}

// ── Папка комплекта: листы слетаются в стопку, появляется этикетка, ставится печать
const folder = $('#folder')
if (folder) {
  const folderStamp = $('#folder-stamp')
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return
    observer.disconnect()
    folder.classList.add('is-assembled')
    setTimeout(() => { folderStamp.classList.remove('is-pending'); folderStamp.classList.add('is-stamped') }, reduced ? 0 : 1300)
  }, { threshold: 0.5 }).observe(folder)
}

// ── Лист «Как собирается акт»: при появлении шаги подсвечиваются по очереди, строки акта заполняются, ставится печать
const stepsBlock = $('#steps'), actFrame = $('#tb'), actStamp = $('#st')
if (stepsBlock && actFrame && actStamp) {
  const items = $$('#steps li')
  const play = () => {
    items.forEach((item, i) => setTimeout(() => item.classList.add('is-on'), reduced ? 0 : i * 280))
    actFrame.classList.add('is-filled')
    setTimeout(() => { actStamp.classList.remove('is-pending'); actStamp.classList.add('is-stamped') }, reduced ? 0 : items.length * 280 + 200)
  }
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return
    observer.disconnect()
    play()
  }, { threshold: 0.4 }).observe(actFrame)
}
