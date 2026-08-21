import { uustupid } from 'uustupid'
import { LANG_STORAGE_KEY } from '../consts'
import { isRfc9562Uuid } from './rfc9562'

type Lang = 'ja' | 'en'

interface Strings {
  title: string
  copied: string
  valid: string
  invalid: string
  hint: string
  inRange: string
  outOfRange: string
}

const VERSION_INDEX = 14
const VARIANT_INDEX = 19

const $ = <T extends HTMLElement>(selector: string): T | null => document.querySelector<T>(selector)

const table: Record<Lang, Strings> = JSON.parse($('#strings')?.textContent ?? '{}')

let lang: Lang = document.documentElement.dataset.lang === 'ja' ? 'ja' : 'en'

const t = (): Strings => table[lang]

/* Values the script owns, so a language switch can re-render them. */
const shown = { hero: '', fake: '', real: '' }

const still = window.matchMedia('(prefers-reduced-motion: reduce)')

/* Typing ------------------------------------------------------------------- */

const typing = new WeakMap<HTMLElement, number>()

/**
 * Print text one character at a time, the way a terminal would.
 *
 * The element starts out hidden by CSS so the server-rendered value never
 * flashes; revealing it here means an empty slot is only ever on screen for the
 * frame before the first character lands.
 */
function type(target: HTMLElement, text: string, done?: () => void): void {
  window.clearTimeout(typing.get(target))
  target.removeAttribute('data-typed')

  if (still.matches) {
    target.textContent = text
    done?.()
    return
  }

  let cut = 0
  target.textContent = ''
  const step = (): void => {
    cut += 1
    target.textContent = text.slice(0, cut)
    if (cut < text.length) typing.set(target, window.setTimeout(step, 16))
    else {
      typing.delete(target)
      done?.()
    }
  }
  step()
}

/* Toast -------------------------------------------------------------------- */

const toast = $('[data-toast]')
let toastTimer: number | undefined

async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    return
  }
  if (!toast) return
  toast.textContent = t().copied
  toast.classList.add('on')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove('on'), 1400)
}

/* Rendering ---------------------------------------------------------------- */

const inRange = (nibble: string, low: number, high: number): boolean => {
  const value = Number.parseInt(nibble, 16)
  return value >= low && value <= high
}

/** Colour the two nibbles once the id has finished typing itself out. */
function highlightAnatomy(id: string): void {
  const host = $('[data-anatomy]')
  if (!host) return

  const segments: Array<[text: string, kind: string | null]> = [
    [id.slice(0, VERSION_INDEX), null],
    [id.charAt(VERSION_INDEX), 'version'],
    [id.slice(VERSION_INDEX + 1, VARIANT_INDEX), null],
    [id.charAt(VARIANT_INDEX), 'variant'],
    [id.slice(VARIANT_INDEX + 1), null],
  ]

  host.textContent = ''
  for (const [text, kind] of segments) {
    const span = document.createElement('span')
    span.textContent = text
    if (kind) span.className = `nib nib--${kind}`
    host.append(span)
  }
}

function renderNibbles(id: string): void {
  const fields = [
    { key: 'version', nibble: id.charAt(VERSION_INDEX), inside: inRange(id.charAt(14), 0x1, 0x8) },
    { key: 'variant', nibble: id.charAt(VARIANT_INDEX), inside: inRange(id.charAt(19), 0x8, 0xb) },
  ]

  for (const field of fields) {
    const cell = $(`[data-nibble="${field.key}"]`)
    if (cell) cell.textContent = field.nibble

    const range = $(`[data-range="${field.key}"]`)
    if (!range) continue
    range.textContent = field.inside ? t().inRange : t().outOfRange
    range.className = field.inside ? 'range range--in' : 'range range--out'
  }
}

function renderVerify(): void {
  for (const key of ['fake', 'real'] as const) {
    const result = $(`[data-verify-result="${key}"]`)
    if (!result) continue
    const isUuid = isRfc9562Uuid(shown[key])
    result.textContent = isUuid ? t().valid : t().invalid
    result.className = isUuid ? 'verdict verdict--pass' : 'verdict verdict--fail'
  }
}

function showId(id: string): void {
  shown.hero = id
  shown.fake = id
  shown.real = crypto.randomUUID()

  const hero = $('[data-hero-id]')
  // One announcement with the finished value, rather than 36 of them: the
  // typing target itself is not a live region.
  if (hero) {
    type(hero, id, () => {
      const announce = $('[data-announce]')
      if (announce) announce.textContent = id
    })
  }

  const anatomy = $('[data-anatomy]')
  if (anatomy) type(anatomy, id, () => highlightAnatomy(id))
  renderNibbles(id)

  const fake = $('[data-verify-value="fake"]')
  if (fake) type(fake, shown.fake)
  const real = $('[data-verify-value="real"]')
  if (real) type(real, shown.real)
  renderVerify()
}

/* Bulk --------------------------------------------------------------------- */

const list = $<HTMLOListElement>('[data-list]')
let spooling = 0

/** Spool the list out a few rows per frame, like output scrolling past. */
function fillList(): void {
  if (!list) return
  const input = $<HTMLInputElement>('[data-count]')
  const requested = Number(input?.value ?? 16)
  const count = Math.min(200, Math.max(1, Number.isFinite(requested) ? requested : 16))
  if (input) input.value = String(count)

  const values = Array.from({ length: count }, () => uustupid())
  const hint = t().hint
  list.textContent = ''
  cancelAnimationFrame(spooling)

  const append = (value: string): void => {
    const item = document.createElement('li')
    item.textContent = value
    item.title = hint
    list.append(item)
  }

  if (still.matches) {
    for (const value of values) append(value)
    return
  }

  let index = 0
  const step = (): void => {
    for (let n = 0; n < 4 && index < values.length; n++, index++) append(values[index])
    if (index < values.length) spooling = requestAnimationFrame(step)
  }
  step()
}

/* Language ----------------------------------------------------------------- */

function applyLang(next: Lang): void {
  lang = next
  document.documentElement.dataset.lang = next
  document.documentElement.lang = next
  document.title = t().title
  for (const button of document.querySelectorAll<HTMLElement>('[data-set-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.setLang === next))
  }
  for (const item of list?.querySelectorAll('li') ?? []) item.title = t().hint
  if (shown.hero) renderNibbles(shown.hero)
  renderVerify()
}

/* Wiring ------------------------------------------------------------------- */

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement

  const copyable = target.closest<HTMLElement>('[data-copyable], .ids li')
  if (copyable?.textContent) void copy(copyable.textContent)

  const setLang = target.closest<HTMLElement>('[data-set-lang]')
  if (setLang) {
    const next: Lang = setLang.dataset.setLang === 'ja' ? 'ja' : 'en'
    applyLang(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // Storage is unavailable in some privacy modes.
    }
    return
  }

  const pm = target.closest<HTMLElement>('[data-pm]')
  if (pm) {
    for (const other of document.querySelectorAll<HTMLElement>('[data-pm]')) {
      other.setAttribute('aria-pressed', String(other === pm))
    }
    for (const block of document.querySelectorAll<HTMLElement>('[data-command]')) {
      block.hidden = block.dataset.command !== pm.dataset.pm
    }
    return
  }

  const trigger = target.closest<HTMLElement>('[data-action]')
  if (!trigger) return

  switch (trigger.dataset.action) {
    case 'regenerate':
      showId(uustupid())
      break
    case 'copy-hero':
      if (shown.hero) void copy(shown.hero)
      break
    case 'generate':
      fillList()
      break
    case 'copy-all': {
      const values = [...(list?.querySelectorAll('li') ?? [])].map((item) => item.textContent)
      if (values.length) void copy(values.join('\n'))
      break
    }
  }
})

applyLang(lang)
showId(uustupid())
fillList()
