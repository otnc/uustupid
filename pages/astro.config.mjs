// @ts-check
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

export default defineConfig({
  // TODO: swap for the real domain once it is decided (.private/DESIGN.md §12 Q1).
  site: 'https://uustupid.pages.dev',
  output: 'static',
  integrations: [sitemap()],
})
