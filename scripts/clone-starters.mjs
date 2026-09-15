#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const templates = resolve(import.meta.dirname, '..', 'templates');
const starters = {
  'starter-web': 'https://github.com/hightechguide/starter-web.git',
  'starter-mobile': 'https://github.com/hightechguide/starter-mobile.git',
};

for (const [name, url] of Object.entries(starters)) {
  const target = resolve(templates, name);
  if (existsSync(target)) {
    console.log(`${name}: already present`);
    continue;
  }
  execFileSync('git', ['clone', url, target], { stdio: 'inherit' });
}
