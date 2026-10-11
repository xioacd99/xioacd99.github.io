import { path } from './site';
export type Locale = 'en' | 'zh';
export const localizedPath = (route = '', locale: Locale = 'en') => path(`${locale === 'zh' ? 'zh/' : ''}${route.replace(/^\//, '')}`);
export const ui = {
  en: {
    writing:'Writing', topics:'Topics', about:'About', search:'Search articles', home:'Home',
    demo:'Demo article', allArticles:'All articles', allTopics:'All topics', read:'read',
    backArticles:'← All articles', rss:'Subscribe via RSS', footer:'A place to make sense of things, one note at a time.',
    dark:'Switch to dark mode', light:'Switch to light mode', skip:'Skip to content',
    description:'Field notes on AI, software engineering, and the craft of building useful things.',
  },
  zh: {
    writing:'文章', topics:'主题', about:'关于', search:'搜索文章', home:'首页',
    demo:'示例文章', allArticles:'全部文章', allTopics:'全部主题', read:'阅读',
    backArticles:'← 全部文章', rss:'通过 RSS 订阅', footer:'用文字记录思考，让知识持续生长。',
    dark:'切换深色模式', light:'切换浅色模式', skip:'跳转到内容',
    description:'关于 AI、软件工程与构建过程的技术笔记。把复杂的问题想清楚，把有用的东西做出来。',
  },
};
export function alternatePath(pathname: string, locale: Locale) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const route = pathname.slice(base.length).replace(/^\//, '').replace(/^zh(?:\/|$)/, '');
  return localizedPath(/^404(?:\.html|\/)?$/.test(route) ? '' : route, locale === 'en' ? 'zh' : 'en');
}
