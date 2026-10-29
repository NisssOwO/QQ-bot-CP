import assert from 'node:assert/strict';
import { QuietHours } from './quiet-hours.mjs';
import { OfficialMessagePipeline } from './official-message-pipeline.mjs';

const quietHours = new QuietHours({ config: { enabled: false }, stateDir: '.' });
const pipeline = new OfficialMessagePipeline({ quietHours });
const event = { group_id: 'g', message_id: 'm', msg_seq: 1 };
assert.deepEqual(pipeline.acceptInbound(event), { accepted: true });
assert.deepEqual(pipeline.acceptInbound(event), { accepted: false, reason: 'duplicate' });

const session = { messages: Array.from({ length: 8 }, (_, i) => ({ role: 'user', content: String(i) })), summary: 'old' };
const recovered = pipeline.recoverModelFailure(session, { error: { code: 'data_inspection_failed' } });
assert.equal(recovered.action, 'retry-once');
assert.equal(recovered.session.auditRetried, true);
assert.equal(recovered.session.messages.length, 6);

const second = pipeline.recoverModelFailure(recovered.session, { code: 'data_inspection_failed' });
assert.equal(second.action, 'new-session');
assert.equal(second.previousSession, recovered.session);
assert.deepEqual(second.session.messages, []);
assert.equal(second.session.auditBlocked, true);

console.log('PASS official message pipeline behavior');

