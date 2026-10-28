import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(root, 'presets', 'preset.nanoka.md'), 'utf8')
  .replace(/^---[\s\S]*?---\n\n?/, '').trimEnd();
const block = source.split('\n').map((line) => `      ${line}`).join('\n');
const output = `# P0 fallback: 不依赖 agent-presets 服务，直接使用 dsh-qqbot 的 prompt 配置。\n- id: im-qqbot\n  config:\n    appId: !!js process.env.QQBOT_APPID\n    appSecret: !!js process.env.QQBOT_SECRET\n    provider: deepseek-official\n    model: deepseek-chat\n    requireMention: true\n    textChunkLimit: 4500\n    directPrompt: |\n${block}\n    groupPrompt: |\n${block}\n`;
fs.writeFileSync(path.join(root, 'cordis.nanoka-direct-prompt.patch.yml'), output, 'utf8');
console.log('Generated cordis.nanoka-direct-prompt.patch.yml');
