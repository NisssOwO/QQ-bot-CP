import assert from 'node:assert/strict';
import { OfficialMessagePipeline } from './official-message-pipeline.mjs';
import { QuietHours } from './quiet-hours.mjs';

const pipeline = new OfficialMessagePipeline({ quietHours: new QuietHours({ config: { enabled: false }, stateDir: '.' }) });
const result = pipeline.recoverModelFailure({ auditRetried: true, messages: [{ role: 'user', content: 'blocked history' }], summary: 'blocked summary' }, { error: { code: 'data_inspection_failed' } });
assert.equal(result.action, 'new-session');
assert.equal(result.previousSession.messages.length, 1);
assert.deepEqual(result.session.messages, []);
assert.equal(result.session.auditBlocked, true);
console.log('PASS audit failure new-session fallback');
