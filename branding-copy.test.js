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

test('student works section avoids heavy animated blur layers while scrolling', () => {
    const portfolioBefore = styleSource.slice(
        styleSource.indexOf('.portfolio-strip::before {'),
        styleSource.indexOf('.portfolio-strip::after {')
    );
    const portfolioAfter = styleSource.slice(
        styleSource.indexOf('.portfolio-strip::after {'),
        styleSource.indexOf('.portfolio-layout {')
    );

    assert.doesNotMatch(portfolioBefore, /filter:\s*blur/);
    assert.doesNotMatch(portfolioBefore, /animation:/);
    assert.doesNotMatch(portfolioAfter, /animation:/);
    assert.doesNotMatch(styleSource, /@keyframes studentWorksFlow|@keyframes studentWorksShimmer/);
});

test('classes copy and ordering match the requested course lineup', () => {
    assert.match(indexSource, /오타쿠 감각으로 수업을 고르세요/);
    assert.match(indexSource, /J-POP, 게임, 애니메이션, 보컬로이드, 버튜버 감성/);
    assert.match(indexSource, /data-course="jpop"[\s\S]*data-course="game"[\s\S]*data-course="anime"[\s\S]*data-course="sound"/);
    assert.match(styleSource, /\.courses \.section-header\s*\{[^}]*width:\s*min\(1040px,\s*100%\)\s*;/s);
    assert.match(styleSource, /\.courses \.section-header h2,\s*\.courses \.section-header p\s*\{[^}]*white-space:\s*nowrap\s*;/s);
    assert.match(indexSource, /<h3>J-POP · 보카로<\/h3>/);
    assert.match(mainSource, /jpop:\s*'J-POP · 보카로'/);
    assert.match(indexSource, /<h3>게임 BGM<\/h3>/);
    assert.match(indexSource, /<h3>애니메이션 · 영화 OST<\/h3>/);
});

test('class cards align descriptions, tags, and portfolio buttons consistently', () => {
    assert.match(styleSource, /\.course-card h3\s*\{[^}]*min-height:\s*64px\s*;/s);
    assert.match(styleSource, /\.course-card p\s*\{[^}]*min-height:\s*112px\s*;/s);
    assert.match(styleSource, /\.course-tags\s*\{[^}]*margin:\s*0 0 30px\s*;/s);
    assert.match(styleSource, /\.course-tags\s*\{[^}]*min-height:\s*74px\s*;/s);
    assert.match(styleSource, /\.btn-portfolio\s*\{[^}]*margin-top:\s*auto\s*;/s);
});
