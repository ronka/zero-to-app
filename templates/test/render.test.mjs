import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { addClaudeExplicitInvocation, renderPlatformTemplate } from '../generator/render.mjs';

test('renders shared and platform-specific lines', () => {
  const source = ['shared', '{{#mobile}}', 'native', '{{/mobile}}', '{{#web}}', 'browser', '{{/web}}', 'end'].join('\n');
  assert.equal(renderPlatformTemplate(source, 'mobile'), 'shared\nnative\nend');
  assert.equal(renderPlatformTemplate(source, 'web'), 'shared\nbrowser\nend');
});

test('rejects malformed platform blocks', () => {
  assert.throws(() => renderPlatformTemplate('{{#mobile}}\nvalue\n{{/web}}', 'mobile'), /Unbalanced/);
  assert.throws(() => renderPlatformTemplate('{{#mobile}}\nvalue', 'mobile'), /Unclosed/);
});

test('adds Claude explicit invocation to skill frontmatter once', () => {
  const skill = '---\nname: setup\ndescription: Set up.\n---\n\n# Setup\n';
  const expected = '---\nname: setup\ndescription: Set up.\ndisable-model-invocation: true\n---\n\n# Setup\n';
  assert.equal(addClaudeExplicitInvocation(skill), expected);
  assert.equal(addClaudeExplicitInvocation(expected), expected);
});

test('setup offers and configures the Resend MCP server for both platforms', () => {
  const setupTemplate = readFileSync(new URL('../sources/skills/setup/SKILL.md.tmpl', import.meta.url), 'utf8');
  const initializerTemplate = readFileSync(new URL('../sources/scripts/init-project.mjs.tmpl', import.meta.url), 'utf8');

  for (const platform of ['mobile', 'web']) {
    const setup = renderPlatformTemplate(setupTemplate, platform);
    const initializer = renderPlatformTemplate(initializerTemplate, platform);

    assert.match(setup, /Resend MCP offered and decision applied/);
    assert.match(setup, /Resend provides email for flows such as payment confirmations, receipts, sign-in links, and other transactional messages/);
    assert.match(setup, /"email": "none"/);
    assert.match(initializer, /config\.email === "resend"/);
    assert.match(initializer, /https:\/\/mcp\.resend\.com\/mcp/);
  }
});

test('setup preserves the template layout instead of writing a minimal shell', () => {
  const setupTemplate = readFileSync(new URL('../sources/skills/setup/SKILL.md.tmpl', import.meta.url), 'utf8');
  const initializerTemplate = readFileSync(new URL('../sources/scripts/init-project.mjs.tmpl', import.meta.url), 'utf8');

  for (const platform of ['mobile', 'web']) {
    const setup = renderPlatformTemplate(setupTemplate, platform);
    const initializer = renderPlatformTemplate(initializerTemplate, platform);

    assert.match(setup, /## Preserve the template layout/);
    assert.doesNotMatch(initializer, /writeAppShell|writeSiteShell/);
  }

  const webInitializer = renderPlatformTemplate(initializerTemplate, 'web');
  assert.doesNotMatch(webInitializer, /app\/page\.tsx/);
  assert.doesNotMatch(webInitializer, /rmSync\(resolve\(root, "app\/landing-content\.ts"\)/);
});
