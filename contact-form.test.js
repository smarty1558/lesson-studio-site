import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

test('consulting form collects reply email and inquiry detail', () => {
    assert.match(indexSource, /name="email"/);
    assert.match(indexSource, /type="email"/);
    assert.match(indexSource, /class="form-row course-mode-row"/);
    assert.match(indexSource, /name="lessonMode"/);
    assert.match(indexSource, /<option value="online">온라인<\/option>/);
    assert.match(indexSource, /<option value="offline">오프라인<\/option>/);
    assert.match(indexSource, /name="message"/);
    assert.match(indexSource, /<textarea[\s\S]*name="message"/);
});

test('consulting form submits contact payload to the contact API', () => {
    assert.match(mainSource, /fetch\('\/api\/contact'/);
    assert.match(mainSource, /formData\.get\('email'\)/);
    assert.match(mainSource, /formData\.get\('lessonMode'\)/);
    assert.match(mainSource, /formData\.get\('message'\)/);
});
