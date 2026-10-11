import { parseDocument } from 'yaml';

// Cover generation only accepts YAML data, never executable frontmatter engines.
export function readFrontmatter(source, filename = 'Markdown file') {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  const end = lines.findIndex((line, index) => index > 0 && /^---[ \t]*$/.test(line));
  if (!/^---[ \t]*$/.test(lines[0]) || end < 0) {
    throw new Error(`${filename}: expected YAML frontmatter between --- delimiters`);
  }
  const document = parseDocument(lines.slice(1, end).join('\n'), { schema: 'core', version: '1.2' });
  const problem = document.errors[0] || document.warnings[0];
  if (problem) throw new Error(`${filename}: ${problem.message}`);
  const data = document.toJS({ maxAliasCount: 50 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${filename}: frontmatter must be a YAML mapping`);
  }
  return data;
}
