import { afterEach, describe, expect, it, vi } from 'vitest'
import { isUustupid, UUSTUPID_REGEX, uustupid } from './index'

const NIL = '00000000-0000-0000-0000-000000000000'
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

const HEX = [...'0123456789abcdef']

/** The version nibbles RFC 9562 leaves unassigned. */
const FREE_VERSIONS = ['0', '9', 'a', 'b', 'c', 'd', 'e', 'f']

/** The variant space that stays free even if versions 9-f are ever assigned. */
const SAFE_VARIANTS = ['4', '5', '6', '7']

/** `10xx` always has bit 2 clear, so every nibble that has it set is free. */
const FREE_VARIANTS = ['4', '5', '6', '7', 'c', 'd', 'e', 'f']

const SAMPLE = 20_000

/** An RFC 9562 validator written here, so the assertions do not lean on the package. */
function isRfcUuid(value: string): boolean {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) return false
  if (value === NIL || value === MAX) return true
  const version = Number.parseInt(value.charAt(14), 16)
  const variant = Number.parseInt(value.charAt(19), 16)
  return version >= 1 && version <= 8 && variant >= 8 && variant <= 0xb
}

type GetRandomValues = typeof globalThis.crypto.getRandomValues

/** Deterministic Web Crypto: each entry fills the array it is handed. */
function stubCrypto(fills: readonly (readonly number[])[]): { calls: () => number } {
  let call = 0
  const impl = (target: Uint8Array): Uint8Array => {
    const fill = fills[Math.min(call, fills.length - 1)]
    call += 1
    for (let i = 0; i < target.length; i++) target[i] = fill[i % fill.length]
    return target
  }
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
    impl as unknown as GetRandomValues,
  )
  return { calls: () => call }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('uustupid', () => {
  it('has the 8-4-4-4-12 lowercase hex shape', () => {
    for (let i = 0; i < 1_000; i++) {
      const id = uustupid()
      expect(id).toHaveLength(36)
      expect(id).toMatch(UUSTUPID_REGEX)
    }
  })

  it('is never a valid RFC 9562 UUID', () => {
    for (let i = 0; i < SAMPLE; i++) {
      expect(isRfcUuid(uustupid())).toBe(false)
    }
  })

  it('uses every version nibble the RFC leaves unassigned', () => {
    const seen = new Set<string>()
    for (let i = 0; i < SAMPLE; i++) seen.add(uustupid().charAt(14))
    expect([...seen].sort()).toEqual(FREE_VERSIONS)
  })

  it('pairs the assignable versions with the variant space that can never move', () => {
    for (let i = 0; i < SAMPLE; i++) {
      const id = uustupid()
      if (id.charAt(14) === '0') expect(FREE_VARIANTS).toContain(id.charAt(19))
      else expect(SAFE_VARIANTS).toContain(id.charAt(19))
    }
  })

  it('keeps the variant bit set, using all eight nibbles that implies', () => {
    const seen = new Set<string>()
    for (let i = 0; i < SAMPLE; i++) seen.add(uustupid().charAt(19))
    expect([...seen].sort()).toEqual(FREE_VARIANTS)
  })

  it('leaves the other 30 digits completely random', () => {
    const seen = Array.from({ length: 32 }, () => new Set<string>())
    for (let i = 0; i < SAMPLE; i++) {
      const plain = uustupid().replace(/-/g, '')
      for (let position = 0; position < 32; position++) seen[position].add(plain.charAt(position))
    }
    for (let position = 0; position < 32; position++) {
      if (position === 12 || position === 16) continue // the two reserved nibbles
      expect([...seen[position]].sort()).toEqual(HEX)
    }
  })

  it('never emits the Nil or Max UUID', () => {
    for (let i = 0; i < SAMPLE; i++) {
      const id = uustupid()
      expect(id).not.toBe(NIL)
      expect(id).not.toBe(MAX)
    }
  })

  it('does not repeat itself', { timeout: 30_000 }, () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100_000; i++) seen.add(uustupid())
    expect(seen.size).toBe(100_000)
  })

  it('draws exactly once, whatever comes back — there is no loop', () => {
    for (const fill of [[0x00], [0xff], [0x44], [0x8a], [0x4a], [0xa1]]) {
      const stub = stubCrypto([fill])
      const id = uustupid()
      expect(stub.calls()).toBe(1)
      expect(isRfcUuid(id)).toBe(false)
      expect(isUustupid(id)).toBe(true)
      vi.restoreAllMocks()
    }
  })

  it('turns a draw that would have been a UUID into one that is not', () => {
    // 0x8a everywhere: version nibble 8, variant nibble 8 -> both are inside
    // the RFC ranges before the masks, and outside after.
    stubCrypto([[0x8a]])
    const id = uustupid()
    expect(FREE_VERSIONS).toContain(id.charAt(14))
    expect(FREE_VARIANTS).toContain(id.charAt(19))
    expect(isRfcUuid(id)).toBe(false)
  })

  it('cannot produce the Nil UUID even from an all-zero draw', () => {
    const stub = stubCrypto([[0x00]])
    expect(uustupid()).toBe('00000000-0000-0000-4000-000000000000')
    expect(stub.calls()).toBe(1)
  })

  it('cannot produce the Max UUID even from an all-ones draw', () => {
    const stub = stubCrypto([[0xff]])
    expect(uustupid()).toBe('ffffffff-ffff-ffff-7fff-ffffffffffff')
    expect(stub.calls()).toBe(1)
  })

  it('throws a clear error when Web Crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined)
    expect(() => uustupid()).toThrow(/Web Crypto/)
  })

  it('never falls back to Math.random', () => {
    const random = vi.spyOn(Math, 'random')
    for (let i = 0; i < 1_000; i++) uustupid()
    expect(random).not.toHaveBeenCalled()
  })
})

describe('isUustupid', () => {
  it('accepts what uustupid produces', () => {
    for (let i = 0; i < 2_000; i++) {
      expect(isUustupid(uustupid())).toBe(true)
    }
  })

  it('rejects real RFC 9562 UUIDs', () => {
    for (let i = 0; i < 2_000; i++) {
      expect(isUustupid(crypto.randomUUID())).toBe(false)
    }
  })

  it('rejects the Nil and Max UUID', () => {
    expect(isUustupid(NIL)).toBe(false)
    expect(isUustupid(MAX)).toBe(false)
  })

  it('accepts exactly the 36 nibble pairs the generator can reach', () => {
    let accepted = 0
    for (const version of HEX) {
      for (const variant of HEX) {
        const id = `0c182b28-4d0c-${version}36a-${variant}d5d-eef2e3957a0c`
        const reachable =
          FREE_VERSIONS.includes(version) &&
          (version === '0' ? FREE_VARIANTS : SAFE_VARIANTS).includes(variant)
        expect(isUustupid(id)).toBe(reachable)
        if (reachable) {
          accepted++
          expect(isRfcUuid(id)).toBe(false)
        }
      }
    }
    expect(accepted).toBe(36)
  })

  it('rejects anything that is not in the exact shape', () => {
    const id = uustupid()
    expect(isUustupid(id.toUpperCase())).toBe(false)
    expect(isUustupid(`{${id}}`)).toBe(false)
    expect(isUustupid(`urn:uuid:${id}`)).toBe(false)
    expect(isUustupid(id.replace(/-/g, ''))).toBe(false)
    expect(isUustupid(` ${id}`)).toBe(false)
    expect(isUustupid('')).toBe(false)
    expect(isUustupid('not-a-uustupid')).toBe(false)
  })

  it('rejects non-strings without throwing', () => {
    expect(isUustupid(null)).toBe(false)
    expect(isUustupid(undefined)).toBe(false)
    expect(isUustupid(42)).toBe(false)
    expect(isUustupid({})).toBe(false)
    expect(isUustupid([uustupid()])).toBe(false)
  })

  it('narrows nothing but accepts unknown input', () => {
    const value: unknown = uustupid()
    expect(isUustupid(value)).toBe(true)
  })
})
