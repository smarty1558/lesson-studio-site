import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const freePluginSource = readFileSync(new URL('./free-plugin-transition-options.html', import.meta.url), 'utf8');
const viteConfigSource = readFileSync(new URL('./vite.config.js', import.meta.url), 'utf8');

test('main site links to the free plugin interactive page from desktop and mobile navigation', () => {
    assert.match(indexSource, /<source src="\.\/omus-hero\.mp4" type="video\/mp4">/);
    assert.match(indexSource, /<a href="\.\/free-plugin-transition-options\.html" data-free-plugin-launch>무료 플러그인<\/a>/);
    assert.match(indexSource, /<div class="mobile-cta"[\s\S]*<a href="\.\/free-plugin-transition-options\.html" data-free-plugin-launch>무료 플러그인<\/a>/);
    assert.match(styleSource, /\.mobile-cta\s*\{[^}]*grid-template-columns:\s*0\.8fr 1\.35fr 1\.2fr 1fr\s*;/s);
    assert.match(styleSource, /@media \(max-width: 420px\)[\s\S]*\.mobile-cta\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/);
});

test('main page promotes free plugins between classes and teachers', () => {
    assert.match(indexSource, /<section id="courses"[\s\S]*<section id="free-plugins" class="free-plugin-spotlight"[\s\S]*<section id="teachers"/);
    assert.match(indexSource, /무료 플러그인으로 먼저 소리를 만들어보세요/);
    assert.match(indexSource, /<a href="\.\/free-plugin-transition-options\.html" class="free-plugin-spotlight-cta" data-free-plugin-launch>무료 플러그인 보기<\/a>/);
    assert.match(styleSource, /\.free-plugin-spotlight\s*\{/);
    assert.match(styleSource, /\.free-plugin-spotlight-cta\s*\{/);
});

test('free plugin navigation opens an in-page portal instead of leaving the home page', () => {
    assert.match(indexSource, /<div class="free-plugin-portal" data-free-plugin-portal hidden/);
    assert.match(indexSource, /<iframe title="무료 플러그인 인터랙티브 프리뷰" data-free-plugin-frame><\/iframe>/);
    assert.match(mainSource, /querySelectorAll\('\[data-free-plugin-launch\]'\)/);
    assert.match(mainSource, /event\.preventDefault\(\)/);
    assert.match(mainSource, /free-plugin-transition-options\.html\?autostart=1&embed=1/);
    assert.match(mainSource, /is-free-plugin-launching/);
    assert.match(mainSource, /data\.type === 'free-plugin-go-home'/);
    assert.match(mainSource, /freePluginPortal\.hidden = true/);
    assert.doesNotMatch(mainSource, /is-frame-ready/);
    assert.match(styleSource, /\.free-plugin-portal\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*2600;/s);
    assert.match(styleSource, /\.site-shell\.is-free-plugin-launching\s*\{[^}]*opacity:\s*0\s*;[^}]*translateX\(-22vw\)/s);
    assert.doesNotMatch(styleSource, /\.free-plugin-portal iframe\s*\{[^}]*opacity:\s*0\s*;/s);
    assert.doesNotMatch(styleSource, /\.free-plugin-portal\.is-frame-ready iframe/);
});

test('home cursor receives pointer updates from the embedded free plugin preview', () => {
    assert.match(mainSource, /window\.addEventListener\('message'/);
    assert.match(mainSource, /data\.type === 'free-plugin-cursor'/);
    assert.match(mainSource, /mouseX = Number\(data\.x\) \|\| mouseX/);
    assert.match(mainSource, /cursorPill\.classList\.toggle\('is-visible', Boolean\(data\.active\)\)/);
    assert.match(mainSource, /data\.type === 'free-plugin-cursor-press'/);
});

test('home page always handles the embedded free plugin back button', () => {
    assert.match(mainSource, /window\.addEventListener\('message', \(event\) => \{[\s\S]*data\.type !== 'free-plugin-go-home'[\s\S]*window\.location\.href = '\.\/index\.html';[\s\S]*\}\);/);
});

test('free plugin page is branded as part of the studio site', () => {
    assert.match(freePluginSource, /<title>무료 플러그인 \| OMUS<\/title>/);
    assert.match(freePluginSource, /<div class="brand">OMUS \| OTAKU MUSIC LESSON STUDIO<\/div>/);
    assert.match(freePluginSource, /<a class="site-back" href="\.\/index\.html" target="_top" data-home-back>홈페이지로 돌아가기<\/a>/);
    assert.match(freePluginSource, /<a class="stage-back" href="\.\/index\.html" target="_top" data-home-back>홈페이지로 돌아가기<\/a>/);
    assert.match(freePluginSource, /\.stage\.is-complete \.stage-back\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;/s);
    assert.match(freePluginSource, /const homeBackLinks = \[\.\.\.document\.querySelectorAll\('\[data-home-back\]'\)\]/);
    assert.match(freePluginSource, /homeBackLinks\.forEach/);
    assert.match(freePluginSource, /window\.parent\.postMessage\(\{ type: 'free-plugin-go-home' \}/);
    assert.match(freePluginSource, /const params = new URLSearchParams\(window\.location\.search\)/);
    assert.match(freePluginSource, /params\.has\('autostart'\)/);
    assert.match(freePluginSource, /requestAnimationFrame\(startTransition\)/);
});

test('vite build includes the free plugin page as a deployable route', () => {
    assert.match(viteConfigSource, /input:\s*\{/);
    assert.match(viteConfigSource, /main:\s*resolve\(rootDir,\s*'index\.html'\)/);
    assert.match(viteConfigSource, /freePlugins:\s*resolve\(rootDir,\s*'free-plugin-transition-options\.html'\)/);
});
