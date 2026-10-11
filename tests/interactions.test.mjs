import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const root = (process.env.PUBLIC_BASE_PATH || '').replace(/\/$/, '') + '/';
const sourceScript = async (file) => {
  const source = await readFile(file, 'utf8');
  const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, `Missing client script in ${file}`);
  return ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
};
test('fresh storage keeps English; saved Chinese restores only the home page', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]).find((value) => value.includes("getItem('language')"));
  assert.ok(script);
  for (const [language, pathname, shouldRedirect] of [[null, root, false], ['en', root, false], ['zh', root, true], ['zh', `${root}articles/a-note/`, false]]) {
    const redirects = [];
    vm.runInNewContext(script, { localStorage: { getItem: (key) => key === 'language' ? language : null }, window: { location: { pathname, replace: (url) => redirects.push(url) } }, document: { documentElement: { dataset: {} } }, matchMedia: () => ({ matches: false }) });
    assert.deepEqual(redirects, shouldRedirect ? [`${root}zh/`] : []);
  }
});
test('language choice persists, preserves search query, and theme toggles repeatedly', async () => {
  const events = {}, values = {}, attrs = {};
  const theme = { addEventListener: (_, fn) => { events.theme = fn; }, setAttribute: (key, value) => { attrs[key] = value; } };
  const language = { dataset: { locale: 'zh' }, addEventListener: (_, fn) => { events.language = fn; }, search: '' };
  const document = { documentElement: { lang: 'en', dataset: { theme: 'light' } }, querySelector: (selector) => selector === '#theme-toggle' ? theme : selector === '#language-toggle' ? language : null, addEventListener: () => {} };
  vm.runInNewContext(await sourceScript('src/components/Header.astro'), { document, localStorage: { setItem: (key, value) => { values[key] = value; } }, location: { search: '?q=streaming' } });
  events.language({ currentTarget: language });
  assert.equal(values.language, 'zh'); assert.equal(language.search, '?q=streaming');
  events.theme(); assert.equal(document.documentElement.dataset.theme, 'dark'); assert.equal(values.theme, 'dark'); assert.equal(attrs['aria-label'], 'Switch to light mode');
  events.theme(); assert.equal(document.documentElement.dataset.theme, 'light'); assert.equal(values.theme, 'light');
});
test('search handles matching, empty, and reset states in both languages', async () => {
  const script = await sourceScript('src/views/Search.astro');
  for (const lang of ['en', 'zh-CN']) {
    const events = {};
    const results = ['AI engineering agents', 'Web development markdown', 'Developer tools streaming'].map((text) => ({ dataset: { search: text.toLowerCase() }, hidden: false }));
    const input = { value: '', addEventListener: (_, fn) => { events.input = fn; } };
    const form = { addEventListener: (_, fn) => { events.submit = fn; } };
    const status = { textContent: '' }; const empty = { hidden: true };
    const document = { documentElement: { lang }, querySelector: (selector) => ({ '#search-input': input, '.search-form': form, '#search-status': status, '#empty-state': empty })[selector], querySelectorAll: () => results };
    vm.runInNewContext(script, { document, URL, URLSearchParams, location: { search: '' }, window: { location: { href: 'https://example.com/search/' } }, history: { replaceState: () => {} } });
    assert.equal(results.filter((result) => !result.hidden).length, 3);
    input.value = 'STREAMING'; events.input(); assert.equal(results.filter((result) => !result.hidden).length, 1); assert.equal(empty.hidden, true);
    input.value = 'no such term'; events.input(); assert.equal(results.filter((result) => !result.hidden).length, 0); assert.equal(empty.hidden, false);
    assert.equal(status.textContent, lang === 'en' ? '0 matching articles' : '找到 0 篇相关文章');
    input.value = ''; events.input(); assert.equal(results.filter((result) => !result.hidden).length, 3); assert.equal(empty.hidden, true);
  }
});

test('search initializes, submits, and resets safely with no article records', async () => {
  const script = await sourceScript('src/views/Search.astro');
  for (const lang of ['en', 'zh-CN']) {
    const events = {};
    const input = { value: '', addEventListener: (_, fn) => { events.input = fn; } };
    const form = { addEventListener: (_, fn) => { events.submit = fn; } };
    const status = { textContent: '' }, empty = { hidden: true };
    const document = { documentElement: { lang }, querySelector: (selector) => ({ '#search-input': input, '.search-form': form, '#search-status': status, '#empty-state': empty })[selector], querySelectorAll: () => [] };
    vm.runInNewContext(script, { document, URL, URLSearchParams, location: { search: '' }, window: { location: { href: 'https://example.com/search/' } }, history: { replaceState: () => {} } });
    assert.equal(empty.hidden, false); assert.equal(status.textContent, lang === 'en' ? 'All 0 articles' : '全部 0 篇文章');
    input.value = 'a query'; events.submit({ preventDefault() {} });
    assert.equal(empty.hidden, false); assert.equal(status.textContent, lang === 'en' ? '0 matching articles' : '找到 0 篇相关文章');
    input.value = ''; events.input(); assert.equal(empty.hidden, false);
  }
});
