import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const freePluginSource = readFileSync(new URL('./free-plugin-transition-options.html', import.meta.url), 'utf8');
const robotsSource = readFileSync(new URL('./public/robots.txt', import.meta.url), 'utf8');
const sitemapSource = readFileSync(new URL('./public/sitemap.xml', import.meta.url), 'utf8');
const headersSource = readFileSync(new URL('./public/_headers', import.meta.url), 'utf8');

test('main page exposes production seo metadata', () => {
    assert.match(indexSource, /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32\.png">/);
    assert.match(indexSource, /<link rel="icon" type="image\/png" sizes="192x192" href="\/favicon-192\.png">/);
    assert.match(indexSource, /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png">/);
    assert.match(indexSource, /<link rel="canonical" href="https:\/\/otakumusicstudio\.com\/">/);
    assert.match(indexSource, /<meta name="robots" content="index, follow">/);
    assert.match(indexSource, /<meta property="og:site_name" content="OMUS 오타쿠 뮤직 스튜디오">/);
    assert.match(indexSource, /<meta property="og:url" content="https:\/\/otakumusicstudio\.com\/">/);
    assert.match(indexSource, /<meta property="og:image" content="https:\/\/otakumusicstudio\.com\/portfolio-default-cover\.png">/);
    assert.match(indexSource, /<meta name="twitter:card" content="summary_large_image">/);
    assert.match(indexSource, /"@type": "WebSite"/);
    assert.match(indexSource, /"@type": "EducationalOrganization"/);
    assert.match(indexSource, /오타쿠뮤직스튜디오/);
});

test('main page body includes target lesson search phrases', () => {
    assert.match(indexSource, /서브컬처 작곡 레슨/);
    assert.match(indexSource, /게임음악 작곡 레슨/);
    assert.match(indexSource, /J-POP 작곡 레슨/);
    assert.match(indexSource, /제이팝 작곡/);
    assert.match(indexSource, /애니송 작곡/);
    assert.match(indexSource, /미디 레슨/);
});

test('homepage includes seo faq content and structured data', () => {
    assert.match(indexSource, /<section id="faq" class="faq-section" aria-labelledby="faq-title">/);
    assert.match(indexSource, /<h2 id="faq-title">자주 묻는 질문<\/h2>/);
    assert.match(indexSource, /JPOP 레슨은 어떤 수업인가요\?/);
    assert.match(indexSource, /서브컬처 작곡 레슨은 일반 작곡 레슨과 뭐가 다른가요\?/);
    assert.match(indexSource, /게임음악 작곡 레슨에서는 무엇을 배우나요\?/);
    assert.match(indexSource, /미디 레슨을 처음 시작해도 괜찮나요\?/);
    assert.match(indexSource, /"@type": "FAQPage"/);
    assert.match(indexSource, /"@type": "Question"/);
    assert.match(indexSource, /"@type": "Answer"/);
});

test('homepage includes location section with naver map link', () => {
    assert.match(indexSource, /<section id="location" class="location-section" aria-labelledby="location-title">/);
    assert.match(indexSource, /<h2 id="location-title">찾아오시는 길<\/h2>/);
    assert.match(indexSource, /수원역 7, 8번 출구에서 도보 약 10분 거리입니다/);
    assert.match(indexSource, /src="\/location-suwon-station-route\.png"/);
    assert.match(indexSource, /href="https:\/\/naver\.me\/GuCakPWt"/);
    assert.match(indexSource, /네이버 지도에서 길찾기/);
});

test('free plugin page exposes its own seo metadata', () => {
    assert.match(freePluginSource, /<title>무료 음악 플러그인 추천 \| OMUS 오타쿠 뮤직 스튜디오<\/title>/);
    assert.match(freePluginSource, /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32\.png">/);
    assert.match(freePluginSource, /<link rel="icon" type="image\/png" sizes="192x192" href="\/favicon-192\.png">/);
    assert.match(freePluginSource, /<link rel="canonical" href="https:\/\/otakumusicstudio\.com\/free-plugin-transition-options\.html">/);
    assert.match(freePluginSource, /<meta property="og:url" content="https:\/\/otakumusicstudio\.com\/free-plugin-transition-options\.html">/);
    assert.match(freePluginSource, /"@type": "WebPage"/);
});

test('robots and sitemap point search engines to the production domain', () => {
    assert.match(robotsSource, /User-agent: \*/);
    assert.match(robotsSource, /Allow: \//);
    assert.match(robotsSource, /Sitemap: https:\/\/otakumusicstudio\.com\/sitemap\.xml/);
    assert.match(sitemapSource, /<loc>https:\/\/otakumusicstudio\.com\/<\/loc>/);
    assert.match(sitemapSource, /<loc>https:\/\/otakumusicstudio\.com\/free-plugin-transition-options\.html<\/loc>/);
});

test('html responses are served as utf-8 on cloudflare pages', () => {
    assert.match(headersSource, /\/\s*\n\s*Content-Type: text\/html; charset=utf-8/);
    assert.match(headersSource, /\/\*\.html\s*\n\s*Content-Type: text\/html; charset=utf-8/);
});

test('favicon image assets are available for browsers and search results', () => {
    assert.ok(statSync(new URL('./public/favicon.png', import.meta.url)).size > 0);
    assert.ok(statSync(new URL('./public/favicon-32.png', import.meta.url)).size > 0);
    assert.ok(statSync(new URL('./public/favicon-192.png', import.meta.url)).size > 0);
    assert.ok(statSync(new URL('./public/apple-touch-icon.png', import.meta.url)).size > 0);
});
