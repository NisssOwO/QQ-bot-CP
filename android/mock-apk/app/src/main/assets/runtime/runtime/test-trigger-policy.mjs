import assert from 'node:assert/strict';
import { decideTrigger, prepareModelText } from './trigger-policy.mjs';

assert.deepEqual(decideTrigger({ kind: 'private', content: '你好' }), { action: 'respond', reason: 'private-message' });
assert.deepEqual(decideTrigger({ kind: 'group', content: '你好', mentioned: false }), { action: 'ignore', reason: 'mention-required' });
assert.deepEqual(decideTrigger({ kind: 'group', content: '@bot 你好', mentioned: true }), { action: 'respond', reason: 'mentioned' });
assert.deepEqual(decideTrigger({ kind: 'group', content: '你好', mentioned: false }, { requireMention: false }), { action: 'respond', reason: 'group-open' });
assert.deepEqual(decideTrigger({ kind: 'private', content: '/角色 hazuki' }), { action: 'command', content: '/角色 hazuki' });
assert.equal(prepareModelText({ content: '/roles' }), null);
assert.equal(prepareModelText({ content: '  你好  ' }), '你好');

console.log('PASS official trigger policy');
