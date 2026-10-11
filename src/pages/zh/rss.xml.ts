import rss from '@astrojs/rss';
import { getPosts, postSlug } from '../../lib/posts';
import { site } from '../../lib/site';
import { localizedPath, ui } from '../../lib/i18n';
import type { APIContext } from 'astro';
export async function GET(context: APIContext) {
  const posts = await getPosts('zh');
  return rss({ title: site.title, description: ui.zh.description, site: context.site!, items: posts.map((post) => ({ title: post.data.title, pubDate: post.data.date, description: post.data.description, link: localizedPath(`articles/${postSlug(post)}/`, 'zh') })), customData: '<language>zh-cn</language>' });
}
