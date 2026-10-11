import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Called only by the Pages workflow; Sites keeps its own explicit build origin.
export function githubPagesConfig(repository) {
  if (typeof repository !== 'string' || !/^[a-z0-9][a-z0-9-]*\/[a-z0-9_.-]+$/i.test(repository)) {
    throw new Error('Expected GITHUB_REPOSITORY in owner/repository format');
  }
  const [owner, name] = repository.split('/');
  const isUserSite = name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  return {
    PUBLIC_SITE_URL: `https://${owner.toLowerCase()}.github.io`,
    PUBLIC_BASE_PATH: isUserSite ? '/' : `/${name}`,
    PUBLIC_REPOSITORY_URL: `https://github.com/${repository}`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.env.GITHUB_ENV) throw new Error('GITHUB_ENV is required in the Pages workflow');
  const config = githubPagesConfig(process.env.GITHUB_REPOSITORY);
  await appendFile(process.env.GITHUB_ENV, Object.entries(config).map(([key, value]) => `${key}=${value}\n`).join(''));
  console.log(`Pages build: ${config.PUBLIC_SITE_URL}${config.PUBLIC_BASE_PATH}`);
}
