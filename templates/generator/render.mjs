export function renderPlatformTemplate(template, platform) {
  if (!['mobile', 'web'].includes(platform)) throw new Error(`Unknown platform: ${platform}`);

  const output = [];
  const stack = [];
  const directive = /^\{\{([#/])(mobile|web)\}\}$/;

  for (const line of template.split('\n')) {
    const match = line.match(directive);
    if (match?.[1] === '#') {
      stack.push(match[2]);
      continue;
    }
    if (match?.[1] === '/') {
      const opened = stack.pop();
      if (opened !== match[2]) throw new Error(`Unbalanced template block: expected ${opened ?? 'none'}, got ${match[2]}`);
      continue;
    }
    if (stack.every((name) => name === platform)) output.push(line);
  }

  if (stack.length) throw new Error(`Unclosed template block: ${stack.at(-1)}`);
  const rendered = output.join('\n');
  if (/\{\{[#/](?:mobile|web)\}\}/.test(rendered)) throw new Error('Unresolved platform directive');
  return rendered;
}

export function addClaudeExplicitInvocation(skill) {
  const closing = skill.indexOf('\n---', 4);
  if (!skill.startsWith('---\n') || closing === -1) throw new Error('Expected YAML frontmatter');
  if (skill.slice(0, closing).includes('disable-model-invocation:')) return skill;
  return `${skill.slice(0, closing)}\ndisable-model-invocation: true${skill.slice(closing)}`;
}
