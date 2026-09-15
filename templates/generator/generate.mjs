#!/usr/bin/env node

import { existsSync, lstatSync, mkdirSync, readlinkSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

import { addClaudeExplicitInvocation, renderPlatformTemplate } from './render.mjs';

const root = resolve(import.meta.dirname, '..');
const sources = resolve(root, 'sources');
const check = process.argv.includes('--check');
const platforms = {
  mobile: resolve(root, 'starter-mobile'),
  web: resolve(root, 'starter-web'),
};
const providers = ['.agents', '.claude'];
const expected = new Map();
const expectedSymlinks = new Map();
const managedDirectories = [];

for (const [platform, targetRoot] of Object.entries(platforms)) {
  for (const provider of providers) {
    const skillsRoot = resolve(targetRoot, provider, 'skills');
    addSkillSet(resolve(sources, 'shared/skills'), skillsRoot);
    addSkillSet(resolve(sources, platform, 'skills'), skillsRoot, {
      skip: platform === 'mobile' && provider === '.claude' ? ['rtl-layout'] : [],
    });

    const setup = renderSource('skills/setup/SKILL.md.tmpl', platform);
    managedDirectories.push(resolve(skillsRoot, 'setup'));
    addFile(
      resolve(skillsRoot, 'setup/SKILL.md'),
      provider === '.claude' ? addClaudeExplicitInvocation(setup) : setup,
    );
    addFile(
      resolve(skillsRoot, 'setup/agents/openai.yaml'),
      renderSource('skills/setup/agents/openai.yaml.tmpl', platform),
    );
  }

  addFile(resolve(targetRoot, 'CLAUDE.md'), readSource('shared/CLAUDE.md'));
  addFile(resolve(targetRoot, 'scripts/init-project.mjs'), renderSource('scripts/init-project.mjs.tmpl', platform));
}

expectedSymlinks.set(
  resolve(platforms.mobile, '.claude/skills/rtl-layout'),
  '../../.agents/skills/rtl-layout',
);

const versionScripts = ['bump-app-version.js', 'increment-update-version.js', 'commit-file.js'];
for (const script of versionScripts) {
  const content = readSource(`mobile/scripts/versioning/${script}`);
  addFile(resolve(platforms.mobile, 'scripts', script), content);
  for (const provider of providers) {
    addFile(resolve(platforms.mobile, provider, 'skills/app-version-update/scripts', script), content);
    if (script === 'commit-file.js') {
      addFile(resolve(platforms.mobile, provider, 'skills/expo-publish/scripts', script), content);
    }
  }
}

if (check) {
  const drift = findDrift();
  if (drift.length) {
    console.error('Generated files are out of date:');
    for (const item of drift) console.error(`- ${item}`);
    console.error('\nRun npm run generate to update them.');
    process.exit(1);
  }
  console.log(`Generated artifacts are current (${expected.size + expectedSymlinks.size} total).`);
} else {
  for (const directory of managedDirectories) rmSync(directory, { recursive: true, force: true });
  for (const [path, content] of expected) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  for (const [path, target] of expectedSymlinks) {
    rmSync(path, { recursive: true, force: true });
    mkdirSync(dirname(path), { recursive: true });
    symlinkSync(target, path);
  }
  console.log(`Generated ${expected.size + expectedSymlinks.size} artifacts across the mobile and web starters.`);
}

function renderSource(path, platform) {
  return renderPlatformTemplate(readSource(path), platform);
}

function readSource(path) {
  return readFileSync(resolve(sources, path), 'utf8');
}

function addTree(sourceRoot, targetRoot) {
  if (!existsSync(sourceRoot)) return;
  for (const path of walk(sourceRoot)) {
    addFile(resolve(targetRoot, relative(sourceRoot, path)), readFileSync(path));
  }
}

function addSkillSet(sourceRoot, targetRoot, { skip = [] } = {}) {
  if (!existsSync(sourceRoot)) return;
  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || skip.includes(entry.name)) continue;
    const target = resolve(targetRoot, entry.name);
    managedDirectories.push(target);
    addTree(resolve(sourceRoot, entry.name), target);
  }
}

function addFile(path, content) {
  expected.set(path, content);
}

function findDrift() {
  const drift = [];
  for (const [path, content] of expected) {
    if (!existsSync(path)) drift.push(`missing ${relative(root, path)}`);
    else if (!readFileSync(path).equals(Buffer.from(content))) drift.push(`changed ${relative(root, path)}`);
  }
  for (const [path, target] of expectedSymlinks) {
    if (!existsSync(path)) drift.push(`missing ${relative(root, path)}`);
    else if (!lstatSync(path).isSymbolicLink()) drift.push(`changed ${relative(root, path)} (expected symlink)`);
    else if (readlinkSync(path) !== target) drift.push(`changed ${relative(root, path)} (wrong symlink target)`);
  }
  for (const directory of managedDirectories) {
    if (!existsSync(directory)) continue;
    for (const path of walk(directory)) {
      if (!expected.has(path)) drift.push(`unexpected ${relative(root, path)}`);
    }
  }
  return drift.sort();
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}
