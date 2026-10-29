import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SessionRoleStore } from './session-role-store.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiny-colors-role-'));
const file = path.join(dir, 'roles.json');
const first = new SessionRoleStore({ file, defaultRole: 'nanoka' });
assert.equal(first.get('private:u1'), 'nanoka');
first.set('private:u1', 'hazuki');
first.set('group:g1', 'tooru');

const second = new SessionRoleStore({ file, defaultRole: 'tsun' });
assert.equal(second.get('private:u1'), 'hazuki');
assert.equal(second.get('group:g1'), 'tooru');
assert.equal(second.get('private:u2'), 'nanoka');
assert.equal(second.remove('group:g1'), true);
assert.equal(second.get('group:g1'), 'nanoka');

console.log('PASS session role persistence and isolation');
