import assert from 'node:assert/strict';
import { DshSessionAdapter } from './dsh-session-adapter.mjs';

const calls = [];
const adapter = new DshSessionAdapter({
  promptTimeoutMs: 20,
  chunkLimit: 8,
  sendPrompt: async (request) => {
    calls.push(request);
    return 'abcdefghijkl';
  },
});
const ok = await adapter.prompt({ sessionKey: 'c2c:1', text: 'hello', role: { id: 'nanoka' } });
assert.equal(ok.ok, true);
assert.deepEqual(ok.chunks, ['abcdefgh', 'ijkl']);
assert.equal(calls[0].preset, 'nanoka');
assert.ok(calls[0].signal instanceof AbortSignal);

const timed = new DshSessionAdapter({
  promptTimeoutMs: 10,
  sendPrompt: ({ signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }),
});
const timeout = await timed.prompt({ sessionKey: 'c2c:2', text: 'slow' });
assert.equal(timeout.ok, false);
assert.equal(timeout.reason, 'timeout');

const controller = new AbortController();
const cancelled = new DshSessionAdapter({
  promptTimeoutMs: 1000,
  sendPrompt: ({ signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }),
});
const pending = cancelled.prompt({ sessionKey: 'c2c:3', text: 'cancel' }, { signal: controller.signal });
controller.abort(new Error('caller cancelled'));
assert.equal((await pending).reason, 'cancelled');

console.log('PASS DSH session adapter timeout and cancellation');
