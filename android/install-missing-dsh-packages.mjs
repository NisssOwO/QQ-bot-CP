import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./runtime-deps/', import.meta.url));
const missing = fileURLToPath(new URL('./mock-apk/app/src/main/assets/runtime/runtime-missing-dependencies.txt', import.meta.url));
const names = [...new Set(fs.readFileSync(missing, 'utf8').split(/\r?\n/).map(line => line.split(': Cannot find module')[0]).filter(name => name.startsWith('@deepseek-ai/')) )];
if (!names.length) { console.log('No missing DSH packages'); process.exit(0); }
console.log(`Installing ${names.length} candidate DSH packages`);
const failed = [];
for (const name of names) {
  await new Promise(resolve => {
    console.log(`Installing ${name}`);
    const child = spawn('npm.cmd', ['install', '--legacy-peer-deps', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', name], { cwd: root, stdio: 'inherit', shell: true });
    child.on('exit', code => { if (code !== 0) failed.push(name); resolve(); });
    child.on('error', () => { failed.push(name); resolve(); });
  });
}
fs.writeFileSync(new URL('./runtime-deps/missing-install-failures.txt', import.meta.url), failed.join('\n') + (failed.length ? '\n' : ''));
console.log(`Finished; failed ${failed.length} package(s).`);
