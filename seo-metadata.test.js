import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const freePluginSource = readFileSync(new URL('./free-plugin-transition-options.html', import.meta.url), 'utf8');
const robotsSource = readFileSync(new URL('./public/robots.txt', import.meta.url), 'utf8');
const sitemapSource = readFileSync(new URL('./public/sitemap.xml', import.meta.url), 'utf8');
const headersSource = readFileSync(new URL('./public/_headers', import.meta.url), 'utf8');

test('main page exposes production seo metadata', () => {
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

test('free plugin page exposes its own seo metadata', () => {
    assert.match(freePluginSource, /<title>무료 음악 플러그인 추천 \| OMUS 오타쿠 뮤직 스튜디오<\/title>/);
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
