import isUuid from 'is-uuid'
import * as realUuid from 'uuid'
import validator from 'validator'
import { describe, expect, it } from 'vitest'
import * as yup from 'yup'
import { z } from 'zod'
import { uustupid } from './index'

const SAMPLE = 500

const ours = (): string[] => Array.from({ length: SAMPLE }, () => uustupid())
const real = (): string[] => Array.from({ length: SAMPLE }, () => crypto.randomUUID())

type Check = (value: string) => boolean

/** Published validators that read the fields RFC 9562 reserves. */
const validators: Record<string, Check> = {
  'uuid.validate': (value) => realUuid.validate(value),
  'validator.isUUID': (value) => validator.isUUID(value),
  'validator.isUUID(4)': (value) => validator.isUUID(value, 4),
  'is-uuid.anyNonNil': (value) => isUuid.anyNonNil(value),
  'zod.uuid': (value) => z.uuid().safeParse(value).success,
  'yup.string().uuid()': (value) => yup.string().uuid().isValidSync(value),
}

describe.each(Object.entries(validators))('%s', (_name, check) => {
  it('accepts every real UUID', () => {
    for (const uuid of real()) expect(check(uuid)).toBe(true)
  })

  it('rejects every uustupid', () => {
    for (const id of ours()) expect(check(id)).toBe(false)
  })

  it('rejects malformed input', () => {
    for (const broken of ['', 'nope', uustupid().slice(0, 35), uustupid().replace(/-/g, '')]) {
      expect(check(broken)).toBe(false)
    }
  })
})

describe('all of them at once', () => {
  it('agree that no uustupid is a UUID', () => {
    for (const id of ours()) {
      expect(Object.values(validators).every((check) => !check(id))).toBe(true)
    }
  })

  it('agree that every real UUID is one', () => {
    for (const uuid of real()) {
      expect(Object.values(validators).every((check) => check(uuid))).toBe(true)
    }
  })
})
