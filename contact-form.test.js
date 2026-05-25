import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

test('consulting form collects reply email and inquiry detail', () => {
    assert.match(indexSource, /name="email"/);
    assert.match(indexSource, /type="email"/);
    assert.match(indexSource, /name="message"/);
    assert.match(indexSource, /<textarea[\s\S]*name="message"/);
});

test('consulting form submits contact payload to the contact API', () => {
    assert.match(mainSource, /fetch\('\/api\/contact'/);
    assert.match(mainSource, /formData\.get\('email'\)/);
    assert.match(mainSource, /formData\.get\('message'\)/);
});
