import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const base = process.env.PUBLIC_BASE_PATH || '/';
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://example.com',
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
