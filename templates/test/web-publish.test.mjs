import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { checkProject } from '../sources/web/skills/web-publish/scripts/check.mjs';
import { transferEnvironment } from '../sources/web/skills/web-publish/scripts/env.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'web publish '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '.vercel'));
  mkdirSync(join(root, 'node_modules/next'), { recursive: true });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { build: 'next build', lint: 'eslint' } }));
  writeFileSync(join(root, 'node_modules/next/package.json'), '{}');
  writeFileSync(join(root, '.vercel/project.json'), JSON.stringify({ projectId: 'prj_test', orgId: 'team_test' }));
  return root;
}

function snapshot(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true }).filter(f => f.isFile())
    .map(f => [join(f.parentPath, f.name).slice(root.length), readFileSync(join(f.parentPath, f.name), 'utf8')]).sort();
}

test('web readiness is read-only and CLI handles paths with spaces', t => {
  const project = fixture(t);
  const before = snapshot(project);
  assert.equal(checkProject(project).status, 'ready');
  const run = spawnSync(process.execPath, [new URL('../sources/web/skills/web-publish/scripts/check.mjs', import.meta.url).pathname, '--project', project], { encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.equal(JSON.parse(run.stdout).status, 'ready');
  assert.deepEqual(snapshot(project), before);
});

test('missing dependencies, scripts, and linkage require action; malformed metadata fails without echoing it', t => {
  const project = fixture(t);
  rmSync(join(project, 'node_modules'), { recursive: true });
  rmSync(join(project, '.vercel/project.json'));
  writeFileSync(join(project, 'package.json'), '{}');
  const result = checkProject(project);
  assert.equal(result.status, 'needs-action');
  assert.deepEqual(result.checks.filter(c => c.status === 'needs-action').map(c => c.id), ['build', 'lint', 'dependencies', 'link']);
  writeFileSync(join(project, '.vercel/project.json'), 'PRIVATE_BAD_JSON');
  assert.equal(checkProject(project).status, 'failed');
  writeFileSync(join(project, 'package.json'), 'PRIVATE_BAD_JSON');
  assert.doesNotMatch(JSON.stringify(checkProject(project)), /PRIVATE_BAD_JSON/);
});

function envOptions(project, extra = {}) {
  return { project, file: '.env.transfer', names: 'DATABASE_URL', environment: 'production', 'project-id': 'prj_test', 'org-id': 'team_test', ...extra };
}

test('environment dry run selects names and never contacts Vercel or reveals values', t => {
  const project = fixture(t);
  writeFileSync(join(project, '.env.transfer'), 'DATABASE_URL="private-test-value"\nUNRELATED=leave-me-alone\n');
  const before = snapshot(project);
  const result = transferEnvironment(envOptions(project), () => assert.fail('dry run called provider'));
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.names, ['DATABASE_URL']);
  assert.doesNotMatch(JSON.stringify(result), /private-test-value|leave-me-alone/);
  assert.deepEqual(snapshot(project), before);
});

test('transfer sends exact multiline values via stdin and scopes every call', t => {
  const project = fixture(t);
  writeFileSync(join(project, '.env.transfer'), 'DATABASE_URL="line-one\nline-two"\nNEXT_PUBLIC_SITE_URL=https://example.test\nUNRELATED=unused\n');
  const calls = [];
  const result = transferEnvironment(envOptions(project, { apply: true, names: 'DATABASE_URL,NEXT_PUBLIC_SITE_URL', 'public-names': 'NEXT_PUBLIC_SITE_URL' }), (...args) => {
    calls.push(args); return { status: 0 };
  });
  assert.equal(result.mode, 'applied');
  assert.equal(calls.length, 2);
  assert.equal(calls[0][2].input, 'line-one\nline-two');
  assert.equal(calls[0][2].cwd, project);
  assert.deepEqual(calls[0][1], ['env', 'add', 'DATABASE_URL', 'production', '--project', 'prj_test', '--scope', 'team_test', '--yes', '--non-interactive', '--sensitive']);
  assert.ok(calls[1][1].includes('--no-sensitive'));
  assert.doesNotMatch(JSON.stringify(result), /line-one|line-two/);
});

test('invalid target, missing value, and unclassified public value stop all transfers', t => {
  const project = fixture(t);
  writeFileSync(join(project, '.env.transfer'), 'DATABASE_URL=value\nNEXT_PUBLIC_TOKEN=value\n');
  for (const extra of [
    { 'project-id': 'prj_other' }, { 'org-id': 'team_other' }, { names: 'DATABASE_URL,MISSING' },
    { environment: 'staging' }, { names: 'NEXT_PUBLIC_TOKEN' }, { names: 'DATABASE_URL;touch marker' },
    { names: 'DATABASE_URL,DATABASE_URL' },
  ]) {
    const result = transferEnvironment(envOptions(project, { ...extra, apply: true }), () => assert.fail('invalid transfer reached provider'));
    assert.equal(result.status, 'failed');
  }
});

test('dotenv interpolation requires literal values, and replacements are explicit', t => {
  const project = fixture(t);
  writeFileSync(join(project, '.env.transfer'), 'DATABASE_URL="$PASSWORD"');
  assert.equal(transferEnvironment(envOptions(project)).status, 'failed');
  const result = transferEnvironment(envOptions(project, { apply: true, replace: true, 'literal-dollar': true }), (_cmd, args, config) => {
    assert.equal(config.input, '$PASSWORD');
    assert.ok(args.includes('--force'));
    return { status: 0 };
  });
  assert.equal(result.status, 'ready');
});

test('partial failure stops, records completed names, and suppresses provider secrets', t => {
  const project = fixture(t);
  writeFileSync(join(project, '.env.transfer'), 'A=first-secret\nB=second-secret\nC=third-secret');
  let count = 0;
  const result = transferEnvironment(envOptions(project, { apply: true, names: 'A,B,C' }), () => {
    count += 1;
    return count === 1 ? { status: 0 } : { status: 1, stderr: 'second-secret private-provider-log' };
  });
  assert.equal(count, 2);
  assert.deepEqual(result.completed, ['A']);
  assert.deepEqual(result.pending, ['B', 'C']);
  assert.equal(result.status, 'failed');
  assert.doesNotMatch(JSON.stringify(result), /secret|private-provider-log/);
});

test('timeout is unconfirmed and can be resumed; CLI entrypoint emits no secret', t => {
  const project = fixture(t);
  writeFileSync(join(project, '.env.transfer'), 'DATABASE_URL=private-cli-value');
  const result = transferEnvironment(envOptions(project, { apply: true }), () => ({ status: null, error: new Error('private-cli-value') }));
  assert.equal(result.status, 'failed');
  assert.match(result.nextAction, /timeout may have succeeded/);
  const cli = spawnSync(process.execPath, [new URL('../sources/web/skills/web-publish/scripts/env.mjs', import.meta.url).pathname,
    '--project', project, '--file', '.env.transfer', '--names', 'DATABASE_URL', '--environment', 'preview', '--project-id', 'prj_test', '--org-id', 'team_test'], { encoding: 'utf8' });
  assert.equal(cli.status, 0);
  assert.doesNotMatch(cli.stdout + cli.stderr, /private-cli-value/);
});
