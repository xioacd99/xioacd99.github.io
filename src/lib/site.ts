export const site = {
  title: "Raymond's Field Notes",
  description: '关于 AI、软件工程与构建过程的技术笔记。把复杂的问题想清楚，把有用的东西做出来。',
  repository: import.meta.env.PUBLIC_REPOSITORY_URL || 'https://github.com/xioacd99/xioacd99.github.io',
};
export const path = (route = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;
export const tagSlug = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
export const dateLabel = (date: Date, locale: 'en' | 'zh' = 'en') => new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-CN', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }).format(date);
