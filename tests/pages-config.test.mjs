import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { githubPagesConfig } from '../scripts/github-pages-config.mjs';

test('user-site repositories build at the GitHub Pages root', () => {
  assert.deepEqual(githubPagesConfig('xioacd99/xioacd99.github.io'), {
    PUBLIC_SITE_URL: 'https://xioacd99.github.io',
    PUBLIC_BASE_PATH: '/',
    PUBLIC_REPOSITORY_URL: 'https://github.com/xioacd99/xioacd99.github.io',
  });
  assert.equal(githubPagesConfig('Example/Example.github.io').PUBLIC_BASE_PATH, '/');
});

test('ordinary project repositories retain their project base path', () => {
  assert.equal(githubPagesConfig('example/notes').PUBLIC_BASE_PATH, '/notes');
  assert.equal(githubPagesConfig('example/another.github.io').PUBLIC_BASE_PATH, '/another.github.io');
});

test('Pages configuration rejects malformed or injected repository values', () => {
  for (const repository of [undefined, '', 'owner', 'owner/repo/extra', '../repo', 'owner/repo\nPUBLIC_SITE_URL=bad', 'owner/repo?path=other']) {
    assert.throws(() => githubPagesConfig(repository));
  }
});

test('Pages CLI exports only deployment URL variables for later workflow steps', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pages-config-'));
  try {
    const envFile = join(directory, 'env');
    execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/github-pages-config.mjs', import.meta.url))], { env: { ...process.env, GITHUB_REPOSITORY: 'xioacd99/xioacd99.github.io', GITHUB_ENV: envFile }, stdio: 'pipe' });
    assert.equal(await readFile(envFile, 'utf8'), 'PUBLIC_SITE_URL=https://xioacd99.github.io\nPUBLIC_BASE_PATH=/\nPUBLIC_REPOSITORY_URL=https://github.com/xioacd99/xioacd99.github.io\n');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('Pages URL setup runs before verification without changing Sites configuration', async () => {
  const workflow = parse(await readFile('.github/workflows/pages.yml', 'utf8'));
  const steps = workflow.jobs.build.steps;
  const configure = steps.findIndex((step) => step.run === 'node scripts/github-pages-config.mjs');
  const verify = steps.findIndex((step) => step.run === 'npm run verify');
  assert.ok(configure >= 0 && configure < verify);
  assert.equal(steps[verify].env, undefined);
  const config = await readFile('astro.config.mjs', 'utf8');
  assert.ok(config.includes("process.env.PUBLIC_SITE_URL || 'https://example.com'"));
  assert.ok(config.includes("process.env.PUBLIC_BASE_PATH || '/'"));
  assert.ok(!config.includes('xioacd99.github.io'));
});
