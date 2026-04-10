import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const values = new Map();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    values.set(key, value);
    index += 1;
  }

  return {
    base: values.get('base') ?? '',
    changelogPath: values.get('file') ?? 'CHANGELOG.md',
    version: values.get('version') ?? '',
  };
};

const runGit = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const getCommitSubjects = (base) => {
  const range = base ? `${base}..HEAD` : 'HEAD';
  const output = runGit(['log', range, '--pretty=format:%s']);

  return output
    .split('\n')
    .map((subject) => subject.trim())
    .filter(Boolean)
    .filter((subject) => !/^v\d+\.\d+\.\d+(?:\s+\[skip ci\])?$/i.test(subject))
    .filter((subject) => !/^merge\b/i.test(subject));
};

const categorize = (subject) => {
  if (/^(add|support|introduce|create)\b/i.test(subject)) {
    return 'Added';
  }

  if (/^(fix|correct|resolve|repair|dedupe|prevent)\b/i.test(subject)) {
    return 'Fixed';
  }

  if (/^(docs?|document|readme|changelog)\b/i.test(subject)) {
    return 'Documentation';
  }

  return 'Changed';
};

const buildEntry = (version, subjects) => {
  const grouped = new Map();

  for (const subject of subjects) {
    const category = categorize(subject);
    const existingEntries = grouped.get(category) ?? [];
    existingEntries.push(subject);
    grouped.set(category, existingEntries);
  }

  if (grouped.size === 0) {
    grouped.set('Changed', [`Release ${version}`]);
  }

  const orderedCategories = ['Added', 'Changed', 'Fixed', 'Documentation'];
  const date = new Date().toISOString().slice(0, 10);
  const lines = [`## [${version}] - ${date}`, ''];

  for (const category of orderedCategories) {
    const entries = grouped.get(category);
    if (!entries?.length) {
      continue;
    }

    lines.push(`### ${category}`, '');
    for (const entry of entries) {
      lines.push(`- ${entry}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
};

const insertEntry = (existingContent, entry) => {
  const unreleasedHeading = '## Unreleased';

  if (existingContent.includes(unreleasedHeading)) {
    return existingContent.replace(
      unreleasedHeading,
      `${unreleasedHeading}\n\n${entry}`,
    );
  }

  return `${existingContent.trimEnd()}\n\n${entry}\n`;
};

const main = () => {
  const { base, changelogPath, version } = parseArgs();
  if (!version) {
    throw new Error('Missing required --version argument');
  }

  const existingContent = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8')
    : '# Changelog\n\n## Unreleased\n';

  if (existingContent.includes(`## [${version}] - `)) {
    console.log(`CHANGELOG already contains version ${version}`);
    return;
  }

  const subjects = [...new Set(getCommitSubjects(base))];
  const entry = buildEntry(version, subjects);
  const updatedContent = insertEntry(existingContent, entry);

  writeFileSync(changelogPath, `${updatedContent.trimEnd()}\n`);
  console.log(`Updated ${changelogPath} for version ${version}`);
};

main();
