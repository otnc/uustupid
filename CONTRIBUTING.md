# Contributing

Thanks for your interest in improving uustupid!
This guide gets you set up and explains how the project is put together.
If anything here is unclear, opening an issue to ask is welcome.

## Getting set up

You'll need Node.js >= 22 and [pnpm](https://pnpm.io).
This repository is a pnpm workspace:

```
uustupid/
├── pkg/     the npm package "uustupid"
└── pages/   the Astro website, which consumes pkg through the workspace
```

```sh
pnpm install
```

`pages` imports the real `uustupid` package, so **build `pkg` before building or
running the site**:

```sh
pnpm --filter uustupid build
pnpm dev
```

## Scripts

Run from the repository root:

| Command | What it does |
| --- | --- |
| `pnpm run build` | Build `pkg`, then the site |
| `pnpm run dev` | Start the Astro dev server |
| `pnpm run test` | Run every workspace's tests (vitest) |
| `pnpm run typecheck` | Type-check every workspace |
| `pnpm run format` | Format the code, writing the fixes (Prettier) |
| `pnpm run format:check` | Check formatting without writing (Prettier) |
| `pnpm run lint` | Lint the code without writing fixes (ESLint) |
| `pnpm run lint:fix` | Lint the code, writing the fixes (ESLint) |
| `pnpm run check` | Format and lint, writing the fixes (Prettier then ESLint) |
| `pnpm run ci` | The same checks without writing — what CI runs |

Spell out `pnpm run`: **`pnpm ci` is pnpm's own clean-install command**, not this script, and it
wipes `node_modules` instead of linting.

Per-workspace commands use `--filter`, e.g. `pnpm --filter uustupid test:watch`
or `pnpm --filter pages build`.

Before opening a pull request, make sure the full set passes:

```sh
pnpm run ci && pnpm run typecheck && pnpm run test && pnpm run build
```

## Conventions

- **Prettier formats, ESLint lints** — both configured once at the root
  (`.prettierrc.json`, `eslint.config.mjs`) and applied to both workspaces.
  Single quotes, no semicolons, trailing commas, 100-column width.
  Running `pnpm run check` before you commit handles all of it.
- **`.astro` files are in scope for both**, via `prettier-plugin-astro` and `eslint-plugin-astro`.
  `astro check` still owns the type-level diagnostics.
- **Markdown is not formatted.** Prose is hand-wrapped, so `*.md` and `LICENSE` sit in
  `.prettierignore` and in ESLint's `ignores`.
- **Tests live next to the code** as `*.test.ts` and run with vitest.
- **Comments and docs are in English** and kept brief. The website itself is bilingual (ja/en).
- **Type-only imports use `import type`** (`verbatimModuleSyntax` is on).

## The one rule that matters

`uustupid()` must **never** return a valid RFC 9562 UUID. Every value:

1. matches `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/`,
2. has a version nibble outside `1`-`8` and the variant bit (`0x4` of that nibble) set, which is
   what keeps it out of the RFC's reach, and is neither the Nil nor the Max UUID, and
3. is untouched randomness everywhere else — all 16 hex values show up in each of the other 30
   digits over a run.

Rules 1 and 2 are what make it not a UUID; rule 3 is what stops the values from looking
manufactured. They are pinned by `pkg/src/index.test.ts` and `pkg/src/near-uuid.test.ts`, and
`pkg/src/libraries.test.ts` runs the same claim past five published validators, so a library
changing its mind fails CI.
`pages/src/scripts/rfc9562.test.ts` checks again with a validator that shares no code with the
package.

If you change the generator, those tests are the contract — don't relax them to make a change
pass. Changing any of the three is a **major** version bump.

## Pull requests

Keep each change focused and add tests for any new behaviour.

## Releasing (maintainers)

Releasing is one manual step.
From the Actions tab, run the `release` workflow (`workflow_dispatch`) and give it a `version`
input — either a bump keyword (`patch` / `minor` / `major` / `prerelease`) or an explicit version
like `0.1.0`.
The workflow runs the checks and build, bumps `pkg/package.json`, publishes to npm with provenance
via **trusted publishing** (OIDC — no `NPM_TOKEN` needed), pushes the version commit and tag, and
creates a GitHub Release with generated notes.

Trusted publishing must be configured once on npmjs.com:
package **Settings → Publishing access → Trusted publishers → GitHub**, pointing at this
repository's `release.yml` workflow.

The website deploys itself. Cloudflare Workers Builds watches this repository and runs the build
on every push to `main`, so there is no deploy workflow here and no Cloudflare token in the
repository's secrets. `pages/wrangler.jsonc` is the only deployment config; the build command is
set once in the Cloudflare dashboard:

```sh
pnpm install --frozen-lockfile && pnpm --filter uustupid build && pnpm --filter pages build
```

To deploy by hand from a checkout: `pnpm --filter pages exec wrangler deploy`.

## License

By contributing, you agree that your contributions are licensed under the
[WTFPL](./LICENSE).
