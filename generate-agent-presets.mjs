import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, 'presets');
const ids = ['nanoka', 'hazuki', 'tooru', 'tsun', 'whale'];

for (const id of ids) {
  const md = fs.readFileSync(path.join(source, `preset.${id}.md`), 'utf8');
  const body = md.replace(/^---[\s\S]*?---\n\n?/, '').trimEnd();
  const indented = body.split('\n').map((line) => `      ${line}`).join('\n');
  const outDir = path.join(source, id);
  fs.mkdirSync(outDir, { recursive: true });
  const yaml = `# Generated from preset.${id}.md; keep the Markdown source as the editable copy.\n- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n    prefix: |\n${indented}\n    complete: false\n    includeRuntimeContext: true\n`;
  fs.writeFileSync(path.join(outDir, 'agent.cordis.yml'), yaml, 'utf8');
}

console.log(`Generated ${ids.length} agent.cordis.yml preset compositions.`);
