import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RoleRegistry } from './role-registry.mjs';
import { SessionRoleStore } from './session-role-store.mjs';
import { executeRoleCommand, parseRoleCommand } from './role-command.mjs';

assert.deepEqual(parseRoleCommand('/role'), { action: 'show' });
assert.deepEqual(parseRoleCommand('/角色 七草日花'), { action: 'set', value: '七草日花' });
assert.deepEqual(parseRoleCommand('/roles'), { action: 'list' });
assert.equal(parseRoleCommand('role nanoka'), null);

const root = path.dirname(fileURLToPath(import.meta.url));
const registry = new RoleRegistry({ presetDir: path.join(root, '..', 'presets') });
const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'role-cmd-')), 'roles.json');
const store = new SessionRoleStore({ file });
assert.equal(executeRoleCommand({ text: '/role hazuki', scope: 'group:g1', isOwner: false, registry, store }).ok, false);
assert.equal(executeRoleCommand({ text: '/role hazuki', scope: 'group:g1', isOwner: true, registry, store }).role.id, 'hazuki');
assert.equal(executeRoleCommand({ text: '/preset tooru', scope: 'private:u1', isOwner: true, registry, store }).role.id, 'tooru');
assert.equal(executeRoleCommand({ text: '/preset', scope: 'private:u1', registry, store }).role.id, 'tooru');
assert.equal(executeRoleCommand({ text: '/role', scope: 'group:g1', registry, store }).role.id, 'hazuki');
assert.equal(executeRoleCommand({ text: '/角色重置', scope: 'group:g1', isOwner: true, registry, store }).role.id, 'nanoka');

console.log('PASS role command parsing and permission boundary');
