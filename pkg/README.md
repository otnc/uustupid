# uustupid

> UUID-shaped random strings, guaranteed never to be valid RFC 9562 UUIDs.

[![npm](https://img.shields.io/npm/v/uustupid)](https://www.npmjs.com/package/uustupid)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/otnc/uustupid/ci.yml?branch=main)](https://github.com/otnc/uustupid/actions)
[![GitHub](https://img.shields.io/github/license/otnc/uustupid)](https://github.com/otnc/uustupid/blob/main/LICENSE)
[![Node](https://img.shields.io/node/v/uustupid)](https://www.npmjs.com/package/uustupid)

```
35c8928b-2e6f-0eb0-446b-b2dd0fec9d0c
2d3dd9e3-3048-9058-5637-710af513cf2e
eca716c3-8986-d969-7a8d-6a43435c8879
```

All 32 hex digits come from Web Crypto. The two reserved nibbles are then moved out of the RFC’s
reach and kept there — no retries, nothing else touched.

> [!WARNING]
> **This is not a UUID.** Never use it where an RFC 9562 identifier is expected — a UUID column,
> an API that validates UUIDs, or interop with real UUIDs. Use it for jokes, mocks, fixtures, and
> placeholder data that just needs to *look* like a UUID. Not for security decisions either.

## Install

```sh
npm install uustupid
```

## Usage

```ts
import { uustupid, isUustupid } from 'uustupid'

uustupid() // => '35c8928b-2e6f-0eb0-446b-b2dd0fec9d0c'
uustupid() // => '2d3dd9e3-3048-9058-5637-710af513cf2e'

isUustupid(uustupid())          // => true
isUustupid(crypto.randomUUID()) // => false — real UUIDs never pass
```

CommonJS works too:

```js
const { uustupid } = require('uustupid')
```

## How it works

RFC 9562 gives meaning to exactly two of the 36 characters, and both have to be in range for a
string to be a UUID. Both are moved out of range — and then a little further, so that no future
revision of the spec could turn a value into a UUID after the fact:

```
  version   variant     why it can never become valid
  -------   -------     -----------------------------
     0       x1xx       0 belongs to the Nil UUID, so no version can take it
   9 - f     01xx       9-f are unassigned, so the variant holds the line:
                        01xx is NCS legacy, already spent, never reassignable
```

- **Version** — one of the eight nibbles the RFC leaves unassigned (`0`, and `9` through `f`).
  Eight values is exactly three bits, so one is chosen with three of the bits that nibble was
  already carrying: no extra randomness, no modulo, still uniform.
- **Variant** — bit 2 is set, which the RFC pattern `10xx` can never have. The nibble's other
  bits, and the six data bits below it, are left exactly as drawn.
- **The pairing** — `9`-`f` are unassigned, not unassignable. If the RFC ever gives one of them a
  meaning, the variant would be the only thing still holding the line, so those versions get bit 3
  cleared as well. That pins the variant inside `0xxx`, the space NCS backward compatibility
  already spent. `11xx` is deliberately not used there, because RFC 9562 marks it "reserved for
  future definition". Version `0` needs none of that, so it keeps the wider choice.

No rejection loop and nothing redrawn. Both special UUIDs fall out for free: the Nil UUID needs a
zero byte where the variant bit now sits, and the Max UUID needs an `f` variant, which only
version `0` can pair with — and version `0` is not `f`.

Roughly **125 bits** of the draw survive, still more than a real UUIDv4's 122.

## What validators say

Every published validator that reads the fields RFC 9562 reserves rejects these values. This is
a test in the package, so a library changing its mind fails CI:

| Validator | `uustupid()` | `crypto.randomUUID()` |
| --- | --- | --- |
| `uuid.validate()` | rejected | accepted |
| `validator.isUUID()` | rejected | accepted |
| `is-uuid.anyNonNil()` | rejected | accepted |
| `zod.uuid()` | rejected | accepted |
| `yup.string().uuid()` | rejected | accepted |

A checker that only matches the `8-4-4-4-12` shape will of course accept these — it never looks
at the version or variant. **A validator accepting the value does not make it a UUID.**

## Requirements

- Node.js >= 22

Anywhere else with Web Crypto works as well: browsers, Cloudflare Workers, Deno, Bun. No
dependencies, one entry point, under 3 kB.

## API

### `uustupid(): string`

A fresh 36-character value. Throws if `globalThis.crypto.getRandomValues` is unavailable — there
is no `Math.random` fallback.

### `isUustupid(value: unknown): boolean`

`true` when `value` is a string this package could have returned: the shape (**lowercase only**),
an unassigned version nibble, and a variant the RFC cannot reach.

It is a set-membership test, not proof of origin. The guarantee runs the other way: nothing that
passes is a valid RFC 9562 UUID, and `uustupid()` output always passes.

### `UUSTUPID_REGEX: RegExp`

`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/`

Shape only. Real UUIDs match it too — use `isUustupid` for the full check.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](https://github.com/otnc/uustupid/blob/main/CONTRIBUTING.md) for details.

## License

Distributed under the [WTFPL](./LICENSE).
