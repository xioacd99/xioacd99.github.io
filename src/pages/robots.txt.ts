import type { APIContext } from 'astro';
import { path } from '../lib/site';
export function GET({ site }: APIContext) {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(path('sitemap-index.xml'), site).href}\n`);
}
