import assert from 'node:assert/strict';
import { normalizeOfficialEvent } from './official-event-normalizer.mjs';

const privateMessage = normalizeOfficialEvent({
  t: 'C2C_MESSAGE_CREATE',
  d: { id: 'm1', seq: 3, content: '你好', author: { user_openid: 'u1' } },
});
assert.deepEqual(privateMessage, {
  kind: 'private', scope: 'private:u1', peerId: 'u1', userId: 'u1', messageId: 'm1', seq: 3,
  content: '你好', mentioned: false, rawType: 'C2C_MESSAGE_CREATE',
  raw: { id: 'm1', seq: 3, content: '你好', author: { user_openid: 'u1' } },
});

const groupMessage = normalizeOfficialEvent({
  t: 'GROUP_AT_MESSAGE_CREATE',
  d: { id: 'm2', msg_seq: 4, group_openid: 'g1', content: '  回复我 ', author: { user_openid: 'u2' }, mentions: [{ id: 'bot' }] },
});
assert.equal(groupMessage.kind, 'group');
assert.equal(groupMessage.scope, 'group:g1');
assert.equal(groupMessage.userId, 'u2');
assert.equal(groupMessage.mentioned, true);
assert.equal(normalizeOfficialEvent({ t: 'READY', d: {} }), null);

console.log('PASS official event normalization');
