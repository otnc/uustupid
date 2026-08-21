import * as realUuid from 'uuid'
import { describe, expect, it } from 'vitest'
import { isUustupid, uustupid } from './index'

const VERSION_INDEX = 14
const VARIANT_INDEX = 19

const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const STRICT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LOOSE_RE = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i

const NIL = '00000000-0000-0000-0000-000000000000'
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

const versionNibble = (id: string): number => Number.parseInt(id.charAt(VERSION_INDEX), 16)
const variantNibble = (id: string): number => Number.parseInt(id.charAt(VARIANT_INDEX), 16)

function isRfcUuid(value: string): boolean {
  if (!SHAPE.test(value)) return false
  if (value === NIL || value === MAX) return true
  return (
    versionNibble(value) >= 1 &&
    versionNibble(value) <= 8 &&
    variantNibble(value) >= 0x8 &&
    variantNibble(value) <= 0xb
  )
}

/** Put both reserved nibbles back where the RFC wants them. */
function repair(id: string): string {
  const chars = [...id]
  chars[VERSION_INDEX] = '4'
  chars[VARIANT_INDEX] = ((variantNibble(id) & 0x3) | 0x8).toString(16)
  return chars.join('')
}

const differingIndexes = (a: string, b: string): number[] =>
  [...a].flatMap((char, index) => (char === b[index] ? [] : [index]))

const toBytes = (id: string): Buffer => Buffer.from(id.replace(/-/g, ''), 'hex')

describe('every value looks the part', () => {
  it('passes the shape checks most code actually uses', () => {
    for (let i = 0; i < 2_000; i++) {
      const id = uustupid()
      expect(LOOSE_RE.test(id)).toBe(true)
      expect(id).toHaveLength(36)
      expect(id.split('-').map((group) => group.length)).toEqual([8, 4, 4, 4, 12])
      expect(id).toBe(id.toLowerCase())
    }
  })

  it('and fails the strict one, every single time', () => {
    for (let i = 0; i < 2_000; i++) {
      expect(STRICT_RE.test(uustupid())).toBe(false)
    }
    for (let i = 0; i < 200; i++) {
      expect(STRICT_RE.test(crypto.randomUUID())).toBe(true)
    }
  })
})

describe('every value is two characters from a real UUID', () => {
  it('becomes a valid UUID once both reserved nibbles are put back', () => {
    for (let i = 0; i < 2_000; i++) {
      const id = uustupid()
      const repaired = repair(id)
      expect(isRfcUuid(repaired)).toBe(true)
      expect(realUuid.version(repaired)).toBe(4)
    }
  })

  it('differs from that UUID at index 14 and index 19, and nowhere else', () => {
    for (let i = 0; i < 2_000; i++) {
      const id = uustupid()
      expect(differingIndexes(id, repair(id))).toEqual([VERSION_INDEX, VARIANT_INDEX])
    }
  })

  it('keeps the six data bits the variant nibble shares with the rest of byte 8', () => {
    for (let i = 0; i < 500; i++) {
      const id = uustupid()
      expect(toBytes(id)[8] & 0x3f).toBe(toBytes(repair(id))[8] & 0x3f)
    }
  })

  it('is one bit away from the RFC variant, whichever nibble it drew', () => {
    for (let i = 0; i < 500; i++) {
      const variant = variantNibble(uustupid())
      // Clearing bit 2 lands on 0-3 or 8-b; only the second half is the RFC's,
      // which is why the version nibble has to move as well.
      expect(variant & 0x4).toBe(0x4)
    }
  })
})

describe('the reachable set', () => {
  it('covers all 36 nibble pairs and nothing outside them', () => {
    const pairs = new Set<string>()
    for (let i = 0; i < 30_000; i++) {
      const id = uustupid()
      pairs.add(id.charAt(VERSION_INDEX) + id.charAt(VARIANT_INDEX))
      expect(isUustupid(id)).toBe(true)
    }
    expect(pairs.size).toBe(36)
    for (const pair of pairs) {
      const id = `0c182b28-4d0c-${pair[0]}36a-${pair[1]}d5d-eef2e3957a0c`
      expect(isRfcUuid(id)).toBe(false)
    }
  })

  it('never overlaps the UUID set, by construction', () => {
    for (const version of [...'0123456789abcdef']) {
      for (const variant of [...'0123456789abcdef']) {
        const id = `0c182b28-4d0c-${version}36a-${variant}d5d-eef2e3957a0c`
        if (isUustupid(id)) expect(isRfcUuid(id)).toBe(false)
      }
    }
  })
})

/**
 * The checks above lean on a validator written in this file. `libraries.test.ts`
 * runs the same claim past five published validators instead.
 */
describe('the uuid package agrees', () => {
  it('rejects every value outright', () => {
    for (let i = 0; i < 2_000; i++) {
      const id = uustupid()
      expect(realUuid.validate(id)).toBe(false)
      expect(() => realUuid.version(id)).toThrow()
    }
  })

  it('accepts every value once repaired, and round-trips it', () => {
    for (let i = 0; i < 2_000; i++) {
      const repaired = repair(uustupid())
      expect(realUuid.validate(repaired)).toBe(true)
      expect(realUuid.stringify(realUuid.parse(repaired))).toBe(repaired)
    }
  })

  it('never mistakes a real UUID for one of ours', () => {
    for (let i = 0; i < 2_000; i++) {
      const uuid = realUuid.v4()
      expect(realUuid.validate(uuid)).toBe(true)
      expect(isUustupid(uuid)).toBe(false)
    }
  })
})
