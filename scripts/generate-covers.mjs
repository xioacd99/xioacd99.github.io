import sharp from 'sharp';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { readFrontmatter } from './frontmatter.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.XDG_CACHE_HOME ||= join(tmpdir(), 'field-notes-cache');
await mkdir(process.env.XDG_CACHE_HOME, { recursive: true });
await rm('public/og', { recursive: true, force: true });
await mkdir('public/og', { recursive: true });
const themes = [
  ['default', 'Build things.', 'Understand deeply.', 'FIELD NOTES / RAYMOND'],
];
const publishedNames = new Set();
const known = new Set(themes.map(([name]) => name));
for (const file of await readdir('src/content/blog', { recursive: true })) {
  if (!file.endsWith('.md')) continue;
  const data = readFrontmatter(await readFile(join('src/content/blog', file), 'utf8'), file);
  if (data.draft || new Date(data.date).getTime() > Date.now()) continue;
  const name = file.replace(/\.md$/, '').replace(/^(en|zh)\//, '');
  publishedNames.add(name);
  if (known.has(name)) continue;
  const words = (data.coverTitle || "Raymond's Field Notes").split(/\s+/);
  const split = Math.ceil(words.length / 2);
  known.add(name);
  themes.push([name, words.slice(0, split).join(' '), words.slice(split).join(' '), 'FIELD NOTES / RAYMOND']);
}
const escape = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const covers = themes.filter(([name]) => name === 'default' || publishedNames.has(name));
for (const [name, rawLine1, rawLine2, rawLabel] of covers) {
  const [line1, line2, label] = [rawLine1, rawLine2, rawLabel].map(escape);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#ffffff" stroke-opacity=".055"/></pattern></defs><rect width="1200" height="630" fill="#193a36"/><rect width="1200" height="630" fill="url(#grid)"/><circle cx="1030" cy="240" r="280" fill="none" stroke="#a1baa0" stroke-width="1"/><circle cx="1030" cy="240" r="210" fill="none" stroke="#a1baa0" stroke-width="1"/><circle cx="1030" cy="240" r="140" fill="none" stroke="#a1baa0" stroke-width="1"/><circle cx="1000" cy="330" r="54" fill="#e67a4e"/><text x="80" y="100" font-family="sans-serif" font-size="22" letter-spacing="4" fill="#bccbc2">${label}</text><text x="80" y="285" font-family="Georgia,serif" font-size="82" fill="#f8f5eb">${line1}</text><text x="80" y="390" font-family="Georgia,serif" font-size="82" fill="#f8f5eb">${line2}</text><path d="M80 480h65" stroke="#e67a4e" stroke-width="5"/><text x="80" y="550" font-family="sans-serif" font-size="23" fill="#bccbc2">Raymond's Field Notes</text></svg>`;
  await mkdir(join('public/og', name, '..'), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(`public/og/${name}.png`);
}
console.log(`Generated ${covers.length} local 1200 × 630 social cards.`);
