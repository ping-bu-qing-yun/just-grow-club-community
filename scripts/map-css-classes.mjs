// One-off: map global.css class selectors -> files that use them (tsx/ts).
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = process.cwd();
const css = readFileSync('src/styles/global.css', 'utf8');
const classRe = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;
const cssClasses = new Set();
let m;
while ((m = classRe.exec(css))) cssClasses.add(m[1]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(p, out);
    } else if (extname(name) === '.tsx' || extname(name) === '.ts') {
      out.push(p);
    }
  }
  return out;
}
const files = walk('src');
const usage = new Map(); // class -> Set<file>
for (const cls of cssClasses) usage.set(cls, new Set());

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = f.replace(/\\/g, '/').replace(/^src\//, '');
  for (const cls of cssClasses) {
    if (text.includes(cls)) usage.get(cls).add(rel);
  }
}

const lines = ['# global.css 类名 → 使用方映射（Phase 5 拆分对照表）', ''];
const unused = [];
for (const [cls, set] of [...usage.entries()].sort()) {
  if (set.size === 0) { unused.push(cls); continue; }
  lines.push(`- \`.${cls}\` → ${[...set].sort().join(', ')}`);
}
lines.push('', '## 未被任何 tsx/ts 引用（候选死样式 / 伪元素基类）', '');
for (const cls of unused) lines.push(`- \`.${cls}\``);
writeFileSync('docs/qa/class-map.md', lines.join('\n'));
console.log(`classes=${cssClasses.size} used=${cssClasses.size - unused.length} unused=${unused.length}`);
