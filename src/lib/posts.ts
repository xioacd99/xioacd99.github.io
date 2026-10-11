import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';
export const postSlug = (post: CollectionEntry<'blog'>) => post.id.replace(/^(en|zh)\//, '');
export async function getPosts(locale: Locale = 'en') {
  return (await getCollection('blog', ({ data }) => data.lang === locale && !data.draft && data.date.getTime() <= Date.now()))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
