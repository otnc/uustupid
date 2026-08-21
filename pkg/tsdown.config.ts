import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  // Runtime-agnostic: the only dependency is Web Crypto, which Node >= 22,
  // browsers, Workers, Deno and Bun all provide on globalThis.
  platform: 'neutral',
  target: 'es2022',
})
