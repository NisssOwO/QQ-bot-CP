import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RoleRegistry } from './role-registry.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const registry = new RoleRegistry({ presetDir: path.join(root, '..', 'presets'), defaultRole: 'nanoka' });
assert.equal(registry.list().length, 5);
assert.equal(registry.get('にちか').id, 'nanoka');
assert.equal(registry.get('七草はづき').id, 'hazuki');
assert.equal(registry.resolve('不存在').id, 'nanoka');
assert.equal(registry.resolve().id, 'nanoka');
console.log('PASS role registry and alias routing');
