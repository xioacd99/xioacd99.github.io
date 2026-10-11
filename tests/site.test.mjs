import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
const html = (file) => readFile(join('dist', file), 'utf8');
const origin = process.env.PUBLIC_SITE_URL || 'https://example.com';
const base = (process.env.PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const entries = JSON.parse(await html('content-manifest.json'));
const articles = [...new Set(entries.map((entry) => entry.id))];
const prefix = (lang) => lang === 'zh' ? 'zh/' : '';
test('all expected English and Chinese routes are generated', async () => {
  for (const lang of ['en', 'zh']) {
    for (const page of ['index.html', 'articles/index.html', 'tags/index.html', 'search/index.html', 'about/index.html']) await access(join('dist', prefix(lang), page));
  }
  await access('dist/404.html');
  for (const entry of entries) await access(join('dist', prefix(entry.lang), `articles/${entry.id}/index.html`));
});
test('article translations stay paired', () => {
  const ids = (lang) => entries.filter((entry) => entry.lang === lang).map((entry) => entry.id).sort();
  assert.deepEqual(ids('en'), ids('zh'), 'Publish both language versions together with matching filenames.');
});
test('each article has localized canonical, hreflang, metadata, and same-page language switch', async () => {
  for (const entry of entries) {
    const route = `${prefix(entry.lang)}articles/${entry.id}/`;
    const other = `${prefix(entry.lang === 'en' ? 'zh' : 'en')}articles/${entry.id}/`;
    const source = await html(`${route}index.html`);
    assert.ok(source.includes(`href="${origin}${base}/${route}"`));
    assert.ok(source.includes(`href="${origin}${base}/${other}"`));
    assert.ok(source.includes(`id="language-toggle" href="${base}/${other}"`));
    assert.ok(source.includes(`<html lang="${entry.lang === 'en' ? 'en' : 'zh-CN'}"`));
    assert.ok(source.includes('name="twitter:card" content="summary_large_image"'));
    assert.ok(source.includes(`${origin}${base}/og/${entry.id}.png`));
    assert.ok(source.includes('application/ld+json'));
    assert.ok(source.includes('twitter.com/intent/tweet'));
    if (entry.demo) {
      assert.ok(source.includes(entry.lang === 'en' ? 'Demo article' : '示例文章'));
      assert.ok(!source.includes('"author":{"@type":"Person"'), 'Demo content must not claim real authorship');
    }
  }
});
test('English is the default, with an explicit remembered-language choice', async () => {
  const source = await html('index.html');
  assert.ok(source.includes('<html lang="en"'));
  assert.ok(source.includes('Explore the writing'));
  assert.ok(source.includes('Switch to Chinese'));
  assert.ok(source.includes("localStorage.getItem('language')"));
  const zh = await html('zh/index.html');
  assert.ok(zh.includes('<html lang="zh-CN"'));
  assert.ok(zh.includes('开始阅读'));
  assert.ok(zh.includes('Switch to English'));
});
test('RSS feeds and sitemap cover the right languages', async () => {
  const sitemap = await html('sitemap-0.xml');
  for (const lang of ['en', 'zh']) {
    const feed = await html(`${prefix(lang)}rss.xml`);
    assert.ok(feed.includes(`<language>${lang === 'en' ? 'en' : 'zh-cn'}</language>`));
    for (const entry of entries.filter((entry) => entry.lang === lang)) {
      const route = `${base}/${prefix(lang)}articles/${entry.id}/`;
      assert.ok(feed.includes(route)); assert.ok(sitemap.includes(route));
    }
  }
});
test('social cards are local valid PNG files', async () => {
  for (const id of ['default', ...articles]) { const data = await readFile(`dist/og/${id}.png`); assert.equal(data.toString('hex', 0, 8), '89504e470d0a1a0a'); assert.equal(data.readUInt32BE(16), 1200); assert.equal(data.readUInt32BE(20), 630); }
});
test('search includes articles from the selected language and a static fallback', async () => {
  for (const lang of ['en', 'zh']) {
    const source = await html(`${prefix(lang)}search/index.html`);
    assert.equal((source.match(/class="search-result"/g) || []).length, entries.filter((entry) => entry.lang === lang).length);
    assert.ok(source.includes('role="status"')); assert.ok(source.includes('<noscript>'));
  }
});
test('every site link supports the configured base path and resolves to a built file', async () => {
  async function scan(dir) { const files = await readdir(dir, { withFileTypes: true }); for (const file of files) { const loc = join(dir, file.name); if (file.isDirectory()) await scan(loc); else if (file.name.endsWith('.html')) { const source = await readFile(loc, 'utf8'); for (const match of source.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) { const url = match[1]; assert.ok(url.startsWith(`${base}/`), `Incorrect base in ${loc}: ${url}`); const relative = url.slice(base.length).replace(/^\//, ''); if (!relative || relative.endsWith('/')) await access(join('dist', relative, 'index.html')); else await access(join('dist', relative)); } } } }
  await scan('dist');
});
test('public deployment is explicit and gated', async () => {
  const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
  assert.ok(workflow.includes('workflow_dispatch:'));
  assert.ok(workflow.includes("vars.ENABLE_PUBLIC_PAGES == 'true'"));
  assert.ok(!/^\s+push:/m.test(workflow));
});

test('empty locales have useful home, archive, topic, and search states with valid empty feeds', async () => {
  for (const lang of ['en', 'zh']) {
    if (entries.some((entry) => entry.lang === lang)) continue;
    for (const page of ['index.html', 'articles/index.html']) {
      const source = await html(`${prefix(lang)}${page}`);
      assert.ok(source.includes('data-empty-content="articles"'), `Missing empty state: ${lang}/${page}`);
      assert.ok(source.includes(lang === 'en' ? 'A fresh page.' : '从第一篇笔记开始。'));
      assert.ok(!source.includes('class="post-card'), `Unexpected card in empty ${lang}/${page}`);
    }
    assert.ok((await html(`${prefix(lang)}tags/index.html`)).includes('data-empty-content="topics"'));
    const search = await html(`${prefix(lang)}search/index.html`);
    assert.ok(search.includes(lang === 'en' ? 'No articles yet.' : '暂时还没有文章。'));
    assert.ok(!/id="empty-state"[^>]*\shidden/.test(search), 'Zero-content empty state should work before JavaScript loads');
    const feed = await html(`${prefix(lang)}rss.xml`);
    assert.ok(feed.includes('<rss ')); assert.ok(feed.includes('<channel>')); assert.ok(!feed.includes('<item>'));
    const archiveFiles = await readdir(join('dist', prefix(lang), 'articles'));
    assert.deepEqual(archiveFiles, ['index.html']);
    const topicFiles = await readdir(join('dist', prefix(lang), 'tags'));
    assert.deepEqual(topicFiles, ['index.html']);
  }
});

test('generated social covers match current articles without stale files', async () => {
  const files = (await readdir('dist/og', { recursive: true })).filter((file) => file.endsWith('.png')).sort();
  assert.deepEqual(files, ['default.png', ...articles.map((id) => `${id}.png`)].sort());
});

test('language switches stay paired on all top-level pages when the archive is empty', async () => {
  for (const lang of ['en', 'zh']) {
    for (const route of ['', 'articles/', 'tags/', 'search/', 'about/']) {
      const source = await html(`${prefix(lang)}${route}index.html`);
      const other = `${base}/${prefix(lang === 'en' ? 'zh' : 'en')}${route}`;
      assert.ok(source.includes(`id="language-toggle" href="${other}"`), `Missing counterpart: ${lang}/${route}`);
    }
  }
});
