// Проверка «мимо токенов нельзя»: в components.css, gallery.html и страницах лендинга нет «сырых» цветов, px и радиусов.
// Токены хранятся только в tokens.css. Допустимы: 0, 1px/2px (линии, зафиксированы как --bw*), %, em, auto.
// Плюс проверка контраста пар «текст — фон» из шкалы (WCAG AA: 4.5 для текста).
const fs = require('node:fs')
const path = require('node:path')
const dir = __dirname
// design/ и сама страница лендинга (папка выше): site.css, index.html
const targets = [dir, path.join(dir, '..')].flatMap(folder => fs.readdirSync(folder).filter(name => /\.(css|html)$/.test(name) && name !== 'tokens.css').map(name => path.relative(dir, path.join(folder, name))))
// тематические страницы: <slug>/index.html на уровень ниже страницы
const site = path.join(dir, '..')
for (const sub of fs.readdirSync(site, { withFileTypes: true })) {
  const page = path.join(site, sub.name, 'index.html')
  if (sub.isDirectory() && !sub.name.startsWith('.') && fs.existsSync(page)) targets.push(path.relative(dir, page))
}
let failed = 0
const fail = (file, line, text) => { failed++; console.log(`${file}:${line}  ${text}`) }

for (const file of targets) {
  fs.readFileSync(path.join(dir, file), 'utf8').split('\n').forEach((text, index) => {
    const line = index + 1
    // подписи-пояснения в галерее («#bf1e2e») — текст, не стиль
    const code = text.replace(/<span>[^<]*<\/span>/g, '').replace(/\/\*.*?\*\//g, '')
      // theme-color в мета-теге не принимает var(): значение должно совпадать с --dark (проверяется вручную)
      .replace(/<meta name="theme-color"[^>]*>/g, '')
    if (/#[0-9a-fA-F]{3,8}\b/.test(code)) fail(file, line, 'сырой цвет: ' + code.trim())
    if (/\brgba?\(/.test(code)) fail(file, line, 'сырой rgb: ' + code.trim())
    // брейкпоинты @media в var() не выразить — их px разрешены
    for (const match of code.replace(/@media[^{]*/g, '').matchAll(/(-?\d+(?:\.\d+)?)px\b/g)) {
      if (!['1', '2'].includes(match[1])) fail(file, line, `сырой px ${match[0]}: ` + code.trim())
    }
    for (const match of code.matchAll(/border-radius:\s*([^;}"]+)/g)) {
      if (!/^(var\(--r-[a-z]+\)|0|50%)$/.test(match[1].trim())) fail(file, line, 'радиус не из токена: ' + match[0])
    }
  })
}

const tokens = fs.readFileSync(path.join(dir, 'tokens.css'), 'utf8')
const value = name => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1]
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
const pairs = [['text', 'bg'], ['text', 'paper'], ['ink', 'bg'], ['muted', 'bg'], ['muted', 'paper'], ['cta', 'bg'], ['on-dark', 'cta'], ['on-dark', 'cta-hover'],
  ['link', 'bg'], ['link', 'link-soft'], ['on-dark-muted', 'dark'], ['on-dark', 'dark'], ['ok', 'ok-soft'], ['warn', 'warn-soft'], ['bad', 'bad-soft']]
for (const [fg, bg] of pairs) {
  const ratio = contrast(value(fg), value(bg))
  console.log(`${ratio >= 4.5 ? 'ok  ' : 'FAIL'} ${fg} на ${bg}: ${ratio.toFixed(2)}`)
  if (ratio < 4.5) failed++
}
console.log(failed ? `\nНарушений: ${failed}` : '\nВсе значения из токенов, контраст в норме')
process.exit(failed ? 1 : 0)
