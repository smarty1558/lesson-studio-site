import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

test('consulting form collects reply email and inquiry detail', () => {
    assert.match(indexSource, /<input[^>]*name="name"[^>]*required/);
    assert.match(indexSource, /<input[^>]*name="phone"[^>]*required/);
    assert.match(indexSource, /<input[^>]*type="email"[^>]*name="email"[^>]*required/);
    assert.match(indexSource, /class="form-row course-mode-row"/);
    assert.match(indexSource, /<select[^>]*name="course"[^>]*required/);
    assert.match(indexSource, /<option value="">수업을 선택해주세요<\/option>/);
    assert.match(indexSource, /<select[^>]*name="lessonMode"[^>]*required/);
    assert.match(indexSource, /<option value="">방식을 선택해주세요<\/option>/);
    assert.match(indexSource, /<option value="online">온라인<\/option>/);
    assert.match(indexSource, /<option value="offline">오프라인<\/option>/);
    assert.match(indexSource, /<textarea[\s\S]*name="message"[\s\S]*required/);
});

test('consulting form submits contact payload to the contact API', () => {
    assert.match(mainSource, /fetch\('\/api\/contact'/);
    assert.match(mainSource, /formData\.get\('email'\)/);
    assert.match(mainSource, /formData\.get\('lessonMode'\)/);
    assert.match(mainSource, /formData\.get\('message'\)/);
});
