import { describe, expect, it } from 'vitest'
import { type EcosystemValidator, installedVersion, judge, validators } from './ecosystem'

// These tests cover the checker, not the libraries. What a library answers only changes what the
// page shows, so nothing here depends on it.

const ours = ['1', '2', '3', '4']
const real = ['a', 'b', 'c', 'd']
const isReal = (value: string) => real.includes(value)

const fake = (check: EcosystemValidator['check']): EcosystemValidator => ({
  pkg: 'zod',
  fn: 'fake()',
  check,
})

describe('judge', () => {
  it('finds no wrong answers when a validator gets every value right', async () => {
    const [verdict] = await judge(ours, real, [fake(isReal)])
    expect(verdict).toMatchObject({ oursWrong: 0, realWrong: 0, total: 4 })
  })

  it('counts every uustupid a validator calls a UUID', async () => {
    const [verdict] = await judge(ours, real, [fake(() => true)])
    expect(verdict).toMatchObject({ oursWrong: 4, realWrong: 0 })
  })

  it('counts a single wrong answer', async () => {
    const [verdict] = await judge(ours, real, [fake((value) => isReal(value) || value === '3')])
    expect(verdict).toMatchObject({ oursWrong: 1, realWrong: 0 })
  })

  it('counts real UUIDs a validator rejects', async () => {
    const [verdict] = await judge(ours, real, [fake((value) => value === 'a')])
    expect(verdict).toMatchObject({ oursWrong: 0, realWrong: 3 })
  })

  it('treats a validator that throws as rejecting the value', async () => {
    const [verdict] = await judge(ours, real, [
      fake(() => {
        throw new Error('broken')
      }),
    ])
    expect(verdict).toMatchObject({ oursWrong: 0, realWrong: 4 })
  })

  it('waits for asynchronous validators', async () => {
    const [verdict] = await judge(ours, real, [fake(async (value) => isReal(value))])
    expect(verdict).toMatchObject({ oursWrong: 0, realWrong: 0 })
  })

  it('carries the package, function, reason and installed version through', async () => {
    const [verdict] = await judge(ours, real, [{ ...fake(isReal), reason: 'guid' }])
    expect(verdict).toMatchObject({ pkg: 'zod', fn: 'fake()', reason: 'guid' })
    expect(verdict.version).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe('installedVersion', () => {
  it('reads an aliased dependency under its alias', () => {
    expect(installedVersion('effect-4')).toMatch(/^4\./)
  })

  it('does not throw for a package that is not installed', () => {
    expect(installedVersion('definitely-not-installed-package')).toBe('?')
  })
})

describe('validators', () => {
  it('lists every package and function once', () => {
    const keys = validators.map((validator) => `${validator.pkg} ${validator.fn}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('can read the version of every listed package', () => {
    for (const validator of validators) {
      expect(installedVersion(validator.dependency ?? validator.pkg)).not.toBe('?')
    }
  })
})
