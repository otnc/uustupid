const BYTE_TO_HEX: readonly string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, '0'),
)

export const VERSION_INDEX = 14
export const VARIANT_INDEX = 19

export const UUSTUPID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * The version nibbles RFC 9562 does not assign: 0, which belongs to the Nil
 * UUID, and 9 through f, which are simply unused. Eight values, exactly three
 * bits, so one can be picked without drawing any extra randomness.
 */
export const FREE_VERSIONS = [0x0, 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf]

/** The RFC 9562 variant is `10xx`, so bit 2 of that nibble is always clear. */
export const RFC_VARIANT_BIT = 0x4

/** Bit 3 separates the two spaces `10xx` is not in: `0xxx` (NCS) and `11xx`. */
export const RESERVED_VARIANT_BIT = 0x8

export const isFreeVersion = (nibble: number): boolean => nibble === 0x0 || nibble >= 0x9

/**
 * Whether a version and variant pairing is one uustupid can produce.
 *
 * The variant always has bit 2 set, which `10xx` can never have. On top of
 * that, versions 9 through f — the ones a future RFC could still hand out —
 * only ever pair with the `0xxx` variant space. See {@link stampNibbles}.
 */
export const isFreePairing = (version: number, variant: number): boolean =>
  (variant & RFC_VARIANT_BIT) !== 0 && (version === 0x0 || (variant & RESERVED_VARIANT_BIT) === 0)

export function randomBytes(target: Uint8Array): void {
  const webcrypto = globalThis.crypto
  if (typeof webcrypto?.getRandomValues !== 'function') {
    throw new Error(
      'uustupid requires a Web Crypto implementation (globalThis.crypto.getRandomValues).',
    )
  }
  webcrypto.getRandomValues(target)
}

/**
 * Move the two reserved nibbles out of the RFC's reach, so that no revision of
 * the spec could turn the result into a UUID.
 *
 * The version nibble becomes one of the eight the RFC leaves unassigned, and
 * the variant nibble gets bit 2 set — `10xx` can never have it. That alone is
 * enough today, but the two leftovers are not equally safe forever:
 *
 * - version `0` is spoken for by the Nil UUID, so it can never be handed to a
 *   version. Any out-of-range variant is fine alongside it.
 * - versions `9`-`f` are unassigned, not unassignable. If one is ever given a
 *   meaning, only the variant would still be holding the line — so for those,
 *   bit 3 is cleared too, which pins the variant inside `0xxx`, the space NCS
 *   backward compatibility already spent. `11xx` is not used here because RFC
 *   9562 marks it "reserved for future definition".
 *
 * Both special UUIDs fall out of this for free: Nil needs a zero byte where the
 * variant bit now sits, and Max needs `f` in a variant nibble that can only be
 * `4`-`7` whenever the version is `f`.
 */
export function stampNibbles(bytes: Uint8Array): void {
  const version = FREE_VERSIONS[(bytes[6] >> 4) & 0x7]
  bytes[6] = (version << 4) | (bytes[6] & 0x0f)
  bytes[8] |= RFC_VARIANT_BIT << 4
  if (version !== 0x0) bytes[8] &= ~(RESERVED_VARIANT_BIT << 4)
}

export function format(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) out += '-'
    out += BYTE_TO_HEX[bytes[i]]
  }
  return out
}
