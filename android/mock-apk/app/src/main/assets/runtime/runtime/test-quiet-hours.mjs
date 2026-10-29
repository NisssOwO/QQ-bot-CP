import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { QuietHours, parseHm } from './quiet-hours.mjs';

assert.equal(parseHm('09:30'), 570);
assert.equal(parseHm('25:00'), null);

const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiny-colors-quiet-'));
const quiet = new QuietHours({
  stateDir,
  config: {
    enabled: true,
    holidays: 'none',
    workday: { weekdays: [1, 2, 3, 4, 5], windows: [['09:00', '12:00']] },
    offday: { windows: [] },
  },
});

// 2026-10-27 10:00 Asia/Shanghai（周二，工作日）
const workdayQuiet = Date.UTC(2026, 9, 27, 2, 0, 0);
assert.equal(quiet.state(workdayQuiet).state, 'quiet');
assert.equal(quiet.allowsInbound({ isOwner: false, mentioned: true, now: workdayQuiet }), false);
assert.equal(quiet.allowsInbound({ isOwner: true, mentioned: true, now: workdayQuiet }), true);

// 2026-10-31 10:00 Asia/Shanghai（周六，offday 全天正常）
const offdayNormal = Date.UTC(2026, 9, 31, 2, 0, 0);
assert.equal(quiet.state(offdayNormal).state, 'normal');
assert.equal(quiet.allowsInbound({ isOwner: false, mentioned: false, now: offdayNormal }), true);

console.log('PASS quiet-hours migrated behavior');
