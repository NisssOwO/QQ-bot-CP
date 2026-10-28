import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceModules = process.env.SHINY_RUNTIME_SOURCE
  ? path.resolve(process.env.SHINY_RUNTIME_SOURCE)
  : path.join(root, 'node_modules');
const target = path.join(root, 'android', 'mock-apk', 'app', 'src', 'main', 'assets', 'runtime');
const requireFromRoot = createRequire(path.join(root, 'package.json'));
const roots = [
  '@deepseek-ai/dsh',
  '@tencent-connect/dsh-qqbot',
  '@earendil-works/pi-ai',
  '@opentelemetry/api-logs',
  '@opentelemetry/core',
  '@opentelemetry/resources',
  '@joplin/turndown-plugin-gfm',
  '@mixmark-io/domino',
  'execa',
];
const seen = new Set();
const missing = [];

function packageDir(name) {
  const direct = path.join(sourceModules, name);
  if (fs.existsSync(path.join(direct, 'package.json'))) return fs.realpathSync(direct);
  const entry = requireFromRoot.resolve(name);
  let current = path.dirname(entry);
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'package.json'))) return current;
    current = path.dirname(current);
  }
  throw new Error(`package directory not found: ${name}`);
}

function copyPackage(name) {
  if (seen.has(name)) return;
  const source = packageDir(name);
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
  seen.add(name);
  const destination = path.join(target, 'node_modules', name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, dereference: true });
  for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies })) {
    try { copyPackage(dependency); } catch (error) {
      missing.push(`${dependency}: ${error.message}`);
    }
  }
}

for (const name of roots) copyPackage(name);
console.log(`Prepared ${seen.size} runtime packages under ${target}`);
if (missing.length) {
  fs.writeFileSync(path.join(target, 'runtime-missing-dependencies.txt'), missing.join('\n') + '\n');
  console.warn(`Missing ${missing.length} packages; see runtime-missing-dependencies.txt`);
}
