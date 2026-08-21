# uustupid

> UUID-shaped, never a UUID.

Random strings that keep the familiar UUID layout while being **guaranteed not to be valid
RFC 9562 UUIDs**.

```
47124209-7d1e-0dc0-6921-2c0dcd6c6f16
6c23cee4-9fc4-001c-64b8-ab8a0b3f63ee
```

All 32 hex digits come from Web Crypto. The two reserved nibbles are then moved out of the RFC’s
reach and kept there, so no future revision of the spec can make a value valid.

This repository is a pnpm workspace.

| Package | Location | What it is |
| --- | --- | --- |
| [`uustupid`](./pkg) | `pkg/` | The npm package |
| Website | `pages/` | The Astro site, built and deployed by Cloudflare Workers Builds |

## Development

Node.js >= 22 and pnpm.

```sh
pnpm install
pnpm --filter uustupid build   # the site consumes pkg/dist, so build it first
pnpm run dev                   # start the site's dev server
```

Dependency versions live in the `catalog:` block of `pnpm-workspace.yaml`, not in the individual
`package.json` files.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full set of scripts and conventions.

## License

[WTFPL](./LICENSE)
