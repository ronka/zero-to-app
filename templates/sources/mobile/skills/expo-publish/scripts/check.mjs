#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { inspectConfiguration, isObject } from './configure.mjs';

export function checkProject(project, { platform = 'all', update = false } = {}, run = spawnSync) {
  const checks = [];
  const add = (id, status, summary, nextAction = null) => checks.push({ id, status, summary, nextAction });
  const needs = (id, valid, summary, nextAction) => add(id, valid ? 'ready' : 'needs-action', summary, valid ? null : nextAction);
  if (!['ios', 'android', 'all'].includes(platform)) return { status: 'failed', checks: [{ id: 'platform', status: 'failed', summary: 'Invalid platform.', nextAction: 'Choose ios, android or all.' }] };
  try {
    const configuration = inspectConfiguration(project);
    needs('profiles', configuration.changes.length === 0 && configuration.conflicts.length === 0, 'Release script/profile alignment.', 'Run configure.mjs --check and resolve missing/conflicting paths.');
  } catch {
    add('profiles', 'failed', 'Package or EAS configuration is unreadable/invalid.', 'Repair package.json/eas.json before configuring release profiles.');
  }
  const expoCli = resolve(project, 'node_modules/expo/bin/cli');
  needs('dependencies', existsSync(expoCli), 'Local Expo CLI availability.', 'Install dependencies from the project lockfile.');
  let config;
  try {
    const dynamic = ['app.config.js', 'app.config.ts', 'app.config.mjs', 'app.config.cjs'].some(file => existsSync(resolve(project, file)));
    if (dynamic) {
      if (!existsSync(expoCli)) {
        needs('app-config', false, 'Dynamic Expo config requires installed dependencies.', 'Install dependencies and rerun the checker.');
      } else {
        const result = run(process.execPath, [expoCli, 'config', '--json'], { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, maxBuffer: 5 * 1024 * 1024 });
        if (result.error || result.status !== 0) throw new Error();
        config = JSON.parse(result.stdout);
      }
    } else {
      config = JSON.parse(readFileSync(resolve(project, 'app.json'), 'utf8')).expo;
      if (!isObject(config)) throw new Error();
    }
    if (config !== undefined && !isObject(config)) throw new Error();
  } catch {
    add('app-config', 'failed', 'Could not resolve Expo configuration.', 'Resolve app config errors using Expo locally; avoid printing resolved secrets.');
  }
  if (config) {
    add('app-config', 'ready', 'Expo configuration is readable.');
    const projectId = config.extra?.eas?.projectId;
    const linked = typeof projectId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    needs('link', linked, 'EAS project identifier.', 'Link the intended initialized app with EAS init.');
    for (const target of platform === 'all' ? ['ios', 'android'] : [platform]) {
      const id = target === 'ios' ? config.ios?.bundleIdentifier : config.android?.package;
      const valid = typeof id === 'string' && (target === 'ios' ? /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/ : /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/).test(id);
      needs(`${target}-identity`, valid, `${target} native identifier.`, 'Complete app identity setup before building.');
    }
    needs('version', typeof config.version === 'string' && /^\d+\.\d+\.\d+$/.test(config.version), 'Marketing version format.', 'Set an app version compatible with the root version helper.');
    needs('runtime', config.runtimeVersion?.policy === 'appVersion', 'Starter runtime policy.', 'Review changes to the starter appVersion runtime policy.');
    if (update) {
      needs('updates', linked && config.updates?.url === `https://u.expo.dev/${projectId}`, 'OTA URL matches the linked EAS project.', 'Run EAS update:configure for the intended project.');
    }
  }
  for (const file of ['scripts/bump-app-version.js', 'scripts/increment-update-version.js', 'scripts/commit-file.js']) {
    needs(file, existsSync(resolve(project, file)), 'Root version helper availability.', 'Restore the starter root version helpers; do not copy the legacy publishing variants.');
  }
  let counter = false;
  try { counter = /\bconst UPDATE_VERSION\s*=\s*\d+/.test(readFileSync(resolve(project, 'src/components/version-debug-row.tsx'), 'utf8')); } catch { /* reported below */ }
  needs('counter', counter, 'Starter OTA counter availability.', 'Preserve UPDATE_VERSION in src/components/version-debug-row.tsx.');
  return { status: checks.some(c => c.status === 'failed') ? 'failed' : checks.some(c => c.status === 'needs-action') ? 'needs-action' : 'ready', checks };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { project: { type: 'string' }, platform: { type: 'string', default: 'all' }, update: { type: 'boolean' } } });
    if (!values.project) throw new Error();
    const result = checkProject(resolve(values.project), values);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = { ready: 0, 'needs-action': 2, failed: 1 }[result.status];
  } catch {
    console.log(JSON.stringify({ status: 'failed', checks: [], nextAction: 'Use --project <app-directory> [--platform ios|android|all] [--update].' }));
    process.exitCode = 1;
  }
}
