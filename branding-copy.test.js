import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const contactApiSource = readFileSync(new URL('./functions/api/contact.js', import.meta.url), 'utf8');
const visibleBrandingSource = [indexSource, mainSource, contactApiSource].join('\n');

test('public branding uses the J-Pop game music lesson studio name and subtitle', () => {
    assert.match(indexSource, /오타쿠 뮤직 스튜디오/);
    assert.match(indexSource, /J-Pop · 서브컬쳐 · 애니송 · 제이팝 · 게임음악 작곡\/미디 1:1 레슨 \| 성인 대상/);
    assert.doesNotMatch(visibleBrandingSource, /제이팝 게임음악 레슨 스튜디오/);
    assert.doesNotMatch(visibleBrandingSource, /OSUM/);
    assert.doesNotMatch(visibleBrandingSource, /실용음악학원|아카데미|학원/);
});

test('hero and student works copy keep the requested line breaks', () => {
    assert.match(indexSource, /게임 BGM, 애니송, J-Pop 감성, Sound Design까지\.<br>\s*좋아하는 세계관을 직접 음악으로 만들게 하는 1:1 레슨 스튜디오입니다\.<br>\s*온라인 또는 오프라인, 원하는 방향으로 레슨 방식을 선택할 수 있습니다\./);
    assert.match(indexSource, /수업의 끝은<br><span>취향이 박힌 결과물입니다<\/span>/);
    assert.match(styleSource, /\.student-works-title span\s*\{[^}]*white-space:\s*nowrap\s*;/s);
});
