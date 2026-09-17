import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { configureProject, defaultEasConfig } from '../sources/mobile/skills/expo-publish/scripts/configure.mjs';
import { checkProject } from '../sources/mobile/skills/expo-publish/scripts/check.mjs';

const projectId = '11111111-2222-4333-8444-555555555555';
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'mobile publish '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['node_modules/expo/bin', 'scripts', 'src/components']) mkdirSync(join(root, path), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture', scripts: { lint: 'existing lint' }, private: true }));
  writeFileSync(join(root, 'node_modules/expo/bin/cli'), '');
  writeFileSync(join(root, 'app.json'), JSON.stringify({ expo: { version: '1.2.3', ios: { bundleIdentifier: 'com.example.app' }, android: { package: 'com.example.app' }, runtimeVersion: { policy: 'appVersion' }, extra: { eas: { projectId } }, updates: { url: `https://u.expo.dev/${projectId}` } } }));
  writeFileSync(join(root, 'src/components/version-debug-row.tsx'), 'const UPDATE_VERSION = 3;');
  for (const file of ['bump-app-version.js', 'increment-update-version.js', 'commit-file.js']) copyFileSync(new URL(`../sources/mobile/scripts/versioning/${file}`, import.meta.url), join(root, 'scripts', file));
  return root;
}
const read = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
function snapshot(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true }).filter(f => f.isFile()).map(f => [join(f.parentPath, f.name).slice(root.length), readFileSync(join(f.parentPath, f.name), 'utf8')]).sort();
}

test('configuration is read-only until applied and idempotent afterward', t => {
  const project = fixture(t);
  const before = snapshot(project);
  assert.equal(configureProject(project).status, 'needs-action');
  assert.deepEqual(snapshot(project), before);
  assert.equal(configureProject(project, true).status, 'ready');
  assert.equal(read(project, 'package.json').scripts.lint, 'existing lint');
  const after = snapshot(project);
  assert.deepEqual(configureProject(project, true).changes, []);
  assert.deepEqual(snapshot(project), after);
  assert.equal(read(project, 'app.json').expo.version, '1.2.3');
  assert.equal(checkProject(project, { update: true }).status, 'ready');
  assert.deepEqual(snapshot(project), after);
});

test('compatible custom fields are preserved, while conflicting values block all writes', t => {
  const project = fixture(t);
  writeFileSync(join(project, 'eas.json'), JSON.stringify({ build: { production: { resourceClass: 'large', env: { BUILD_ONLY: 'private-sentinel' } } }, customField: 'retained' }));
  assert.equal(configureProject(project, true).status, 'ready');
  assert.equal(read(project, 'eas.json').build.production.env.BUILD_ONLY, 'private-sentinel');
  const eas = read(project, 'eas.json');
  eas.build.production.environment = 'custom-private-environment';
  writeFileSync(join(project, 'eas.json'), JSON.stringify(eas));
  const before = snapshot(project);
  const result = configureProject(project, true);
  assert.equal(result.status, 'needs-action');
  assert.ok(result.conflicts.includes('eas.build.production.environment'));
  assert.doesNotMatch(JSON.stringify(result), /private-sentinel|custom-private-environment/);
  assert.deepEqual(snapshot(project), before);
});

test('inherited profiles and platform overrides need review before defaults are added', t => {
  const project = fixture(t);
  for (const profile of [{ extends: 'base' }, { android: { autoIncrement: false } }, { developmentClient: true },
    { ios: { simulator: true } }, { ios: 'invalid' }, { android: null },
    { android: { buildType: 'apk' } }, { android: { gradleCommand: ':app:assembleRelease' } }]) {
    writeFileSync(join(project, 'eas.json'), JSON.stringify({ build: { production: profile } }));
    const before = snapshot(project);
    assert.equal(configureProject(project, true).status, 'needs-action');
    assert.deepEqual(snapshot(project), before);
  }
});

test('malformed configuration and scripts are reported without echoing source values', t => {
  const project = fixture(t);
  writeFileSync(join(project, 'eas.json'), 'private-bad-json');
  assert.equal(configureProject(project, true).status, 'failed');
  assert.equal(checkProject(project).status, 'failed');
  assert.doesNotMatch(JSON.stringify(checkProject(project)), /private-bad-json/);
  writeFileSync(join(project, 'eas.json'), '{}');
  writeFileSync(join(project, 'package.json'), JSON.stringify({ scripts: { 'release:prepare': 'custom-secret-command' } }));
  const before = snapshot(project);
  const result = configureProject(project, true);
  assert.ok(result.conflicts.includes('package.scripts.release:prepare'));
  assert.doesNotMatch(JSON.stringify(result), /custom-secret-command/);
  assert.deepEqual(snapshot(project), before);
});

test('readiness distinguishes selected-platform requirements and OTA requirements', t => {
  const project = fixture(t);
  configureProject(project, true);
  const app = read(project, 'app.json');
  delete app.expo.ios;
  delete app.expo.updates;
  writeFileSync(join(project, 'app.json'), JSON.stringify(app));
  assert.equal(checkProject(project, { platform: 'android' }).status, 'ready');
  assert.equal(checkProject(project, { platform: 'all' }).status, 'needs-action');
  const ota = checkProject(project, { platform: 'android', update: true });
  assert.ok(ota.checks.some(c => c.id === 'updates' && c.status === 'needs-action'));
  delete app.expo.extra;
  writeFileSync(join(project, 'app.json'), JSON.stringify(app));
  assert.ok(checkProject(project).checks.some(c => c.id === 'link' && c.status === 'needs-action'));
});

test('dynamic Expo config is resolved through argument arrays with output kept private', t => {
  const project = fixture(t);
  configureProject(project, true);
  writeFileSync(join(project, 'app.config.js'), 'module.exports = {};');
  const config = read(project, 'app.json').expo;
  config.extra.PRIVATE = 'never-emit-this';
  const result = checkProject(project, {}, (command, args, options) => {
    assert.equal(command, process.execPath);
    assert.deepEqual(args, [join(project, 'node_modules/expo/bin/cli'), 'config', '--json']);
    assert.equal(options.cwd, project);
    return { status: 0, stdout: JSON.stringify(config) };
  });
  assert.equal(result.status, 'ready');
  assert.doesNotMatch(JSON.stringify(result), /never-emit-this/);
  const failed = checkProject(project, {}, () => ({ status: 1, stderr: 'never-emit-this' }));
  assert.equal(failed.status, 'failed');
  assert.doesNotMatch(JSON.stringify(failed), /never-emit-this/);
  assert.equal(checkProject(project, {}, () => ({ status: 0, stdout: 'null' })).status, 'failed');
});

test('missing dependencies for dynamic config report action instead of executing a remote CLI', t => {
  const project = fixture(t);
  writeFileSync(join(project, 'app.config.ts'), 'export default {};');
  rmSync(join(project, 'node_modules'), { recursive: true });
  assert.equal(checkProject(project, {}, () => assert.fail('must not call provider')).status, 'needs-action');
});

test('CLI requires an explicit configuration mode and preserves paths containing spaces', t => {
  const project = fixture(t);
  const cli = new URL('../sources/mobile/skills/expo-publish/scripts/configure.mjs', import.meta.url).pathname;
  assert.equal(spawnSync(process.execPath, [cli, '--project', project]).status, 1);
  assert.equal(spawnSync(process.execPath, [cli, '--project', project, '--check']).status, 2);
  assert.equal(spawnSync(process.execPath, [cli, '--project', project, '--apply']).status, 0);
});

test('real release scripts bump once, retry builds without another bump, and submit the explicit build', t => {
  const project = fixture(t);
  configureProject(project, true);
  // Real version helpers operate only in this disposable repository.
  for (const args of [['init'], ['config', 'user.email', 'test@example.invalid'], ['config', 'user.name', 'Test'], ['add', '.'], ['commit', '-m', 'Fixture']]) {
    const git = spawnSync('git', args, { cwd: project, encoding: 'utf8' });
    assert.equal(git.status, 0, git.stderr);
  }
  const bin = join(project, 'fake-bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'npx'), `#!/usr/bin/env node\nconst fs = require('node:fs');\nfs.appendFileSync(process.env.CALL_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');\nprocess.exit(process.env.FAIL_BUILD === '1' ? 1 : 0);\n`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, CALL_LOG: join(project, 'calls.jsonl') };
  const npm = (args, extra = {}) => spawnSync('npm', ['run', ...args], { cwd: project, env: { ...env, ...extra }, encoding: 'utf8' });
  assert.equal(npm(['release:prepare']).status, 0);
  assert.equal(read(project, 'app.json').expo.version, '1.2.4');
  assert.notEqual(npm(['build:release:all'], { FAIL_BUILD: '1' }).status, 0);
  assert.equal(npm(['build:release:all']).status, 0);
  assert.equal(read(project, 'app.json').expo.version, '1.2.4');
  assert.equal(npm(['submit:production:ios', '--', '--id', 'verified-build-id']).status, 0);
  const calls = readFileSync(join(project, 'calls.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(calls[0], calls[1]);
  assert.ok(calls[0].includes('all'));
  assert.deepEqual(calls[2].slice(-2), ['--id', 'verified-build-id']);
  assert.ok(!calls.flat().includes('--latest'));
  assert.equal(defaultEasConfig.build.production.autoIncrement, true);
  assert.equal(npm(['update:prepare']).status, 0);
  const counter = readFileSync(join(project, 'src/components/version-debug-row.tsx'), 'utf8');
  const args = ['update:publish', '--', '--channel', 'preview', '--environment', 'preview', '--message', 'Test update'];
  assert.notEqual(npm(args, { FAIL_BUILD: '1' }).status, 0);
  assert.equal(npm(args).status, 0);
  assert.equal(readFileSync(join(project, 'src/components/version-debug-row.tsx'), 'utf8'), counter);
  assert.match(counter, /UPDATE_VERSION = 4/);
});
