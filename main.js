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

// ── Закреплённая сцена «акт собирается»: прокрутка по сцене заполняет строки и ставит печать
const story = $('#s3'), steps = $$('#steps li'), cells = $$('#tb > *'), stamp = $('#st')
// Закрепляем сцену только на широком и достаточно высоком экране: на телефоне она выше окна, нижняя часть осталась бы недосягаемой
const canPin = () => !reduced && matchMedia('(min-width: 801px)').matches && innerHeight >= 700
const syncPin = () => {
  const pin = canPin()
  story.classList.toggle('is-pinned', pin)
  if (!pin) {
    steps.forEach(step => step.classList.add('is-on'))
    cells.forEach(cell => cell.classList.add('is-on'))
    stamp.classList.remove('is-pending'); stamp.classList.add('is-stamped')
  }
}
const updateStory = () => {
  if (!story.classList.contains('is-pinned')) return
  const rect = story.getBoundingClientRect()
  const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)))
  const active = Math.min(steps.length - 1, Math.floor(progress * steps.length))
  steps.forEach((step, i) => step.classList.toggle('is-on', i <= active))
  cells.forEach((cell, i) => cell.classList.toggle('is-on', Math.floor(i / 2) <= active))
  const stamped = progress >= 0.9
  stamp.classList.toggle('is-stamped', stamped)
  stamp.classList.toggle('is-pending', !stamped)
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
