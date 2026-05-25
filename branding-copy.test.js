import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const contactApiSource = readFileSync(new URL('./functions/api/contact.js', import.meta.url), 'utf8');
const visibleBrandingSource = [indexSource, mainSource, contactApiSource].join('\n');

test('public branding uses the J-Pop game music lesson studio name and subtitle', () => {
    assert.match(indexSource, /제이팝 게임음악 레슨 스튜디오/);
    assert.match(indexSource, /J-Pop · 서브컬쳐 · 애니송 작곡\/미디 1:1 레슨 \| 성인 대상/);
    assert.doesNotMatch(visibleBrandingSource, /OSUM/);
    assert.doesNotMatch(visibleBrandingSource, /실용음악학원|아카데미|학원/);
});
