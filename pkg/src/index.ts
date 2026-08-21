import {
  format,
  isFreePairing,
  isFreeVersion,
  randomBytes,
  stampNibbles,
  UUSTUPID_REGEX,
  VARIANT_INDEX,
  VERSION_INDEX,
} from './internal/core'

export { UUSTUPID_REGEX } from './internal/core'

/**
 * Generate a UUID-shaped string that is not a valid RFC 9562 UUID.
 *
 * Every one of the 32 hex digits comes from Web Crypto. Two nibbles are then
 * moved out of the ranges the RFC reserves — the version to one of the eight it
 * leaves unassigned, the variant to a bit pattern `10xx` cannot reach — with no
 * branches to speak of and no retries. The remaining bits stay uniform.
 *
 * **This is not a UUID.** Never use it where a real UUID is expected — an RFC
 * 9562 validator is supposed to reject these values.
 *
 * @throws {Error} when `globalThis.crypto.getRandomValues` is unavailable.
 */
export function uustupid(): string {
  const bytes = new Uint8Array(16)
  randomBytes(bytes)
  stampNibbles(bytes)
  return format(bytes)
}

/**
 * Report whether a value is one of the strings {@link uustupid} can return.
 *
 * A set-membership test, not proof of origin — anything built the same way
 * passes. The guarantee runs the other way: nothing that passes is a valid
 * RFC 9562 UUID, and every {@link uustupid} output passes.
 */
export function isUustupid(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (!UUSTUPID_REGEX.test(value)) return false

  const version = Number.parseInt(value[VERSION_INDEX], 16)
  const variant = Number.parseInt(value[VARIANT_INDEX], 16)
  return isFreeVersion(version) && isFreePairing(version, variant)
}
