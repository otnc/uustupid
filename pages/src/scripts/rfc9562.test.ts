import { uustupid } from 'uustupid'
import { describe, expect, it } from 'vitest'
import { isRfc9562Uuid } from './rfc9562'

describe('isRfc9562Uuid', () => {
  it('accepts real UUIDs of every version', () => {
    const uuids = [
      'c232ab00-9414-11ec-b3c8-9f6bdeced846', // v1, from RFC 9562 A.1
      '5df41881-3aed-3515-88a7-2f4a814cf09e', // v3
      '919108f7-52d1-4320-9bac-f847db4148a8', // v4
      '2ed6657d-e927-568b-95e1-2665a8aea6a2', // v5
      '1ec9414c-232a-6b00-b3c8-9f6bdeced846', // v6
      '017f22e2-79b0-7cc3-98c4-dc0c0c07398f', // v7
      '2489e9ad-2ee2-8e00-8ec9-32d5f69181c0', // v8
    ]
    for (const uuid of uuids) expect(isRfc9562Uuid(uuid)).toBe(true)
  })

  it('accepts a UUID in upper case', () => {
    expect(isRfc9562Uuid('919108F7-52D1-4320-9BAC-F847DB4148A8')).toBe(true)
  })

  it('accepts the Nil and Max UUID', () => {
    expect(isRfc9562Uuid('00000000-0000-0000-0000-000000000000')).toBe(true)
    expect(isRfc9562Uuid('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true)
  })

  it('accepts what the runtime itself generates', () => {
    for (let i = 0; i < 2_000; i++) {
      expect(isRfc9562Uuid(crypto.randomUUID())).toBe(true)
    }
  })

  it('rejects every uustupid', () => {
    for (let i = 0; i < 5_000; i++) {
      expect(isRfc9562Uuid(uustupid())).toBe(false)
    }
  })

  it('accepts a uustupid once its out-of-range nibbles are put back', () => {
    for (let i = 0; i < 1_000; i++) {
      const chars = [...uustupid()]
      const version = Number.parseInt(chars[14], 16)
      const variant = Number.parseInt(chars[19], 16)
      if (version < 1 || version > 8) chars[14] = '4'
      if (variant < 0x8 || variant > 0xb) chars[19] = ((variant & 0x3) | 0x8).toString(16)
      expect(isRfc9562Uuid(chars.join(''))).toBe(true)
    }
  })

  it('rejects malformed input', () => {
    expect(isRfc9562Uuid('')).toBe(false)
    expect(isRfc9562Uuid('919108f7-52d1-4320-9bac-f847db4148a')).toBe(false)
    expect(isRfc9562Uuid('919108f752d143209bacf847db4148a8')).toBe(false)
    expect(isRfc9562Uuid('{919108f7-52d1-4320-9bac-f847db4148a8}')).toBe(false)
    expect(isRfc9562Uuid('zzzzzzzz-52d1-4320-9bac-f847db4148a8')).toBe(false)
  })
})
