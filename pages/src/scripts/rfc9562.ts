/**
 * An RFC 9562 validator written from the RFC alone, sharing no code with the
 * `uustupid` package — the site's claim is only worth something if the checker
 * is independent of the thing it checks.
 */

const SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const NIL = '00000000-0000-0000-0000-000000000000'
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

export function isRfc9562Uuid(value: string): boolean {
  const uuid = value.toLowerCase()
  if (!SHAPE.test(uuid)) return false

  // Nil (§5.9) and Max (§5.10) are valid without following the rules below.
  if (uuid === NIL || uuid === MAX) return true

  const version = Number.parseInt(uuid.charAt(14), 16)
  if (version < 1 || version > 8) return false

  const variant = Number.parseInt(uuid.charAt(19), 16)
  return variant >= 0x8 && variant <= 0xb
}
