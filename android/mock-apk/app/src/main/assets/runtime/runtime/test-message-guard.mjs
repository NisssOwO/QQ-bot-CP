import assert from 'node:assert/strict';
import { MessageDeduplicator, compactAfterAudit, isAuditRejection, auditRecoveryPlan } from './message-guard.mjs';

let now = 1000;
const dedup = new MessageDeduplicator({ ttlMs: 100, now: () => now });
const event = { group_id: 'g1', message_id: 'm1', msg_seq: 1 };
assert.equal(dedup.accept(event), true);
assert.equal(dedup.accept(event), false);
now = 1201;
assert.equal(dedup.accept(event), true);

assert.equal(isAuditRejection({ error: { code: 'data_inspection_failed' } }), true);
assert.equal(isAuditRejection(new Error('Input text data may contain inappropriate content')), true);
assert.equal(isAuditRejection(new Error('timeout')), false);

const session = { messages: [{ role: 'tool', content: 'old' }, ...Array.from({ length: 8 }, (_, i) => ({ role: 'user', content: String(i) }))], summary: 'old summary' };
const compacted = compactAfterAudit(session);
assert.equal(compacted.messages.length, 6);
assert.equal(compacted.messages[0].role, 'user');
assert.equal(compacted.summary, '');
assert.deepEqual(auditRecoveryPlan({}), { action: 'compact-and-retry', retry: true });
assert.deepEqual(auditRecoveryPlan({ auditRetried: true }), { action: 'new-session', retry: false, resetContext: true });

console.log('PASS message dedup and audit recovery behavior');

