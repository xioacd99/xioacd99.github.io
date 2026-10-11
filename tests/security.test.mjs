import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { readFrontmatter } from '../scripts/frontmatter.mjs';

test('cover frontmatter accepts YAML metadata, BOM, and Windows line endings', () => {
  const source = '\uFEFF---\r\nlang: en\r\ntitle: "Safe title"\r\ndate: "2026-10-10"\r\ndraft: false\r\ntags: [AI, Web]\r\ncoverTitle: |\r\n  Think clearly\r\n---\r\n# Content';
  assert.deepEqual(readFrontmatter(source), { lang: 'en', title: 'Safe title', date: '2026-10-10', draft: false, tags: ['AI', 'Web'], coverTitle: 'Think clearly\n' });
});

test('cover frontmatter rejects executable, malformed, duplicate, and expanding YAML input', () => {
  for (const source of [
    '---js\n({ title: "unsafe" })\n---\n',
    '---\ntitle: !!js/function "function () {}"\n---\n',
    '---\ntitle: one\ntitle: two\n---\n',
    '---\n[not, a, mapping]\n---\n',
    '---\ntitle: missing closing delimiter',
    '---\na: &a [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nb: &b [*a, *a, *a, *a, *a, *a, *a, *a, *a, *a]\nc: [*b, *b, *b, *b, *b, *b, *b, *b, *b, *b]\n---\n',
  ]) assert.throws(() => readFrontmatter(source, 'test.md'));
});

test('cover generation handles YAML articles and excludes drafts and future dates', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'field-notes-covers-'));
  try {
    const content = join(dir, 'src/content/blog');
    for (const lang of ['en', 'zh']) {
      await mkdir(join(content, lang), { recursive: true });
      await writeFile(join(content, lang, 'safe-note.md'), '---\ntitle: "A note"\ndate: "2020-01-01"\ncoverTitle: "Safe <text> & words"\ndraft: false\n---\nBody');
    }
    await writeFile(join(content, 'en/draft.md'), '---\ndraft: true\ndate: "2020-01-01"\n---\n');
    await writeFile(join(content, 'en/future.md'), '---\ndate: "2999-01-01"\n---\n');
    execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/generate-covers.mjs', import.meta.url))], { cwd: dir, stdio: 'pipe' });
    assert.deepEqual((await readdir(join(dir, 'public/og'))).sort(), ['default.png', 'safe-note.png']);
    const png = await readFile(join(dir, 'public/og/safe-note.png'));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('all external CI actions are pinned to full commits and builds have no write permissions', async () => {
  for (const filename of await readdir('.github/workflows')) {
    const workflow = parse(await readFile(`.github/workflows/${filename}`, 'utf8'));
    assert.deepEqual(workflow.permissions, { contents: 'read' });
    assert.ok(!workflow.on.pull_request_target, 'Do not run untrusted PRs with a privileged trigger');
    for (const [name, job] of Object.entries(workflow.jobs)) {
      assert.ok(job['timeout-minutes'] > 0 && job['timeout-minutes'] <= 15);
      if (name === 'deploy') assert.deepEqual(job.permissions, { pages: 'write', 'id-token': 'write' });
      else assert.ok(!job.permissions, 'Build jobs inherit read-only contents access');
      for (const step of job.steps) {
        if (!step.uses) continue;
        assert.match(step.uses, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
        if (step.uses.startsWith('actions/checkout@')) assert.equal(step.with['persist-credentials'], false);
      }
      if (name !== 'deploy') {
        assert.ok(job.steps.some((step) => step.run === 'npm ci --ignore-scripts'));
        assert.ok(job.steps.some((step) => step.run === 'npm audit --audit-level=moderate'));
      }
    }
  }
});

test('locked packages use integrity-checked official registry sources', async () => {
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name) continue;
    assert.ok(entry.resolved?.startsWith('https://registry.npmjs.org/'), `Unexpected package source: ${name}`);
    assert.ok(entry.integrity?.startsWith('sha512-'), `Missing package integrity: ${name}`);
  }
  for (const oldPackage of ['gray-matter', 'js-yaml', 'argparse', 'sprintf-js']) {
    assert.ok(!lock.packages[`node_modules/${oldPackage}`], `Old frontmatter dependency returned: ${oldPackage}`);
  }
});
