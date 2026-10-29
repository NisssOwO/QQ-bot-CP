import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, 'presets');
const expected = ['nanoka', 'hazuki', 'tooru', 'tsun', 'whale'];
const errors = [];

for (const id of expected) {
  const md = path.join(dir, `preset.${id}.md`);
  if (!fs.existsSync(md)) {
    errors.push(`${id}: 缺少 Markdown preset`);
    continue;
  }
  const text = fs.readFileSync(md, 'utf8');
  if (!text.startsWith('---\n') || !text.includes('\n---\n')) errors.push(`${id}: 缺少 front matter`);
  const source = text.match(/\nsource_role:\s*(.+)\n/)?.[1]?.trim();
  if (!source) errors.push(`${id}: 缺少 source_role`);
  const composition = path.join(dir, id, 'agent.cordis.yml');
  if (!fs.existsSync(composition)) errors.push(`${id}: 缺少 agent.cordis.yml`);
  else {
    const yaml = fs.readFileSync(composition, 'utf8');
    if (!yaml.includes("name: '@deepseek-ai/dsh-persona'")) errors.push(`${id}: 未挂载 dsh-persona`);
    if (!yaml.includes('    prefix: |')) errors.push(`${id}: 未使用新版 persona.prefix`);
    if (yaml.includes('    text:')) errors.push(`${id}: 错误使用旧版 persona.text`);
  }
  if (id !== 'nanoka') {
    const json = path.join(dir, `preset.${id}.json`);
    if (!fs.existsSync(json)) errors.push(`${id}: 缺少 JSON 元数据`);
    else {
      try {
        const meta = JSON.parse(fs.readFileSync(json, 'utf8'));
        for (const key of ['id', 'displayName', 'aliases', 'worldName', 'voiceEnabled']) {
          if (!(key in meta)) errors.push(`${id}: JSON 缺少 ${key}`);
        }
        if (meta.voiceEnabled !== false) errors.push(`${id}: P1 必须关闭语音`);
      } catch (error) {
        errors.push(`${id}: JSON 无法解析 (${error.message})`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.map((x) => `FAIL ${x}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS ${expected.length} 个角色 preset：front matter、来源字段和元数据检查通过`);
}
