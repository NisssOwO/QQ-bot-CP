import assert from 'node:assert/strict';
import { chunkResponse, chunkMarkdown } from './response-chunker.mjs';

assert.deepEqual(chunkResponse(''), []);
assert.deepEqual(chunkResponse('a\n\nb\n\nc', { limit: 3 }), ['a', 'b', 'c']);
const long = 'a'.repeat(20);
assert.equal(chunkResponse(long, { limit: 8 }).every((x) => x.length <= 8), true);
const md = chunkMarkdown('```js\n' + 'x'.repeat(220) + '\n```', { limit: 100 });
assert.equal(md.every((x) => x.length <= 108), true); // 围栏会增加少量字符
assert.equal(md.join('').includes('```'), true);

console.log('PASS response chunking');
