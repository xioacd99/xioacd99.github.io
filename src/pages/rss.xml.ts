import rss from '@astrojs/rss';
import { getPosts, postSlug } from '../lib/posts';
import { site } from '../lib/site';
import { localizedPath, ui } from '../lib/i18n';
import type { APIContext } from 'astro';
export async function GET(context: APIContext) {
  const posts = await getPosts('en');
  return rss({ title: site.title, description: ui.en.description, site: context.site!, items: posts.map((post) => ({ title: post.data.title, pubDate: post.data.date, description: post.data.description, link: localizedPath(`articles/${postSlug(post)}/`, 'en') })), customData: '<language>en</language>' });
}
