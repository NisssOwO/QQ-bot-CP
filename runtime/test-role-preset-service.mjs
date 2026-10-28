import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { RolePresetService } from '../plugins/role-presets/index.js';

const service = Object.create(RolePresetService.prototype);
service.config = {
  default: 'shiny-colors.nanoka',
  roots: [{ path: fileURLToPath(new URL('../presets/', import.meta.url)), trust: 'user' }],
};
service.entries = new Map();
service.loaded = false;
const list = await service.list();
assert.equal(list.length, 5);
assert.ok(list.some((entry) => entry.id === 'shiny-colors.nanoka'));
assert.equal((await service.resolve('日花')).id, 'shiny-colors.nanoka');
assert.equal((await service.resolve('shiny-colors.hazuki')).id, 'shiny-colors.hazuki');
await assert.rejects(() => service.resolve('unknown-role'), /unknown role preset/);
console.log('PASS role preset service discovery and alias resolution');
