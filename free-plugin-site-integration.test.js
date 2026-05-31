import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const freePluginSource = readFileSync(new URL('./free-plugin-transition-options.html', import.meta.url), 'utf8');
const viteConfigSource = readFileSync(new URL('./vite.config.js', import.meta.url), 'utf8');

test('main site links to the free plugin interactive page from desktop and mobile navigation', () => {
    assert.match(indexSource, /<a href="\.\/free-plugin-transition-options\.html" data-free-plugin-launch>무료 플러그인<\/a>/);
    assert.match(indexSource, /<div class="mobile-cta"[\s\S]*<a href="\.\/free-plugin-transition-options\.html" data-free-plugin-launch>무료 플러그인<\/a>/);
    assert.match(styleSource, /\.mobile-cta\s*\{[^}]*grid-template-columns:\s*0\.8fr 1\.35fr 1\.2fr 1fr\s*;/s);
    assert.match(styleSource, /@media \(max-width: 420px\)[\s\S]*\.mobile-cta\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/);
});

test('free plugin navigation opens an in-page portal instead of leaving the home page', () => {
    assert.match(indexSource, /<div class="free-plugin-portal" data-free-plugin-portal hidden/);
    assert.match(indexSource, /<iframe title="무료 플러그인 인터랙티브 프리뷰" data-free-plugin-frame><\/iframe>/);
    assert.match(mainSource, /querySelectorAll\('\[data-free-plugin-launch\]'\)/);
    assert.match(mainSource, /event\.preventDefault\(\)/);
    assert.match(mainSource, /free-plugin-transition-options\.html\?autostart=1&embed=1/);
    assert.match(mainSource, /is-free-plugin-launching/);
    assert.match(mainSource, /is-frame-ready/);
    assert.match(mainSource, /window\.setTimeout\(\(\) => \{\s*freePluginPortal\.classList\.add\('is-frame-ready'\)/s);
    assert.match(styleSource, /\.free-plugin-portal\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*2600;/s);
    assert.match(styleSource, /\.site-shell\.is-free-plugin-launching\s*\{[^}]*opacity:\s*0\s*;[^}]*translateX\(-22vw\)/s);
    assert.match(styleSource, /\.free-plugin-portal iframe\s*\{[^}]*opacity:\s*0\s*;/s);
    assert.match(styleSource, /\.free-plugin-portal\.is-frame-ready iframe\s*\{[^}]*opacity:\s*1\s*;/s);
});

test('home cursor receives pointer updates from the embedded free plugin preview', () => {
    assert.match(mainSource, /window\.addEventListener\('message'/);
    assert.match(mainSource, /data\.type === 'free-plugin-cursor'/);
    assert.match(mainSource, /mouseX = Number\(data\.x\) \|\| mouseX/);
    assert.match(mainSource, /cursorPill\.classList\.toggle\('is-visible', Boolean\(data\.active\)\)/);
    assert.match(mainSource, /data\.type === 'free-plugin-cursor-press'/);
});

test('free plugin page is branded as part of the studio site', () => {
    assert.match(freePluginSource, /<title>무료 플러그인 \| 오타쿠 뮤직 스튜디오<\/title>/);
    assert.match(freePluginSource, /<div class="brand">오타쿠 뮤직 스튜디오<\/div>/);
    assert.match(freePluginSource, /<a class="site-back" href="\.\/index\.html">사이트 홈<\/a>/);
    assert.match(freePluginSource, /new URLSearchParams\(window\.location\.search\)\.has\('autostart'\)/);
    assert.match(freePluginSource, /requestAnimationFrame\(startTransition\)/);
});

test('vite build includes the free plugin page as a deployable route', () => {
    assert.match(viteConfigSource, /input:\s*\{/);
    assert.match(viteConfigSource, /main:\s*resolve\(rootDir,\s*'index\.html'\)/);
    assert.match(viteConfigSource, /freePlugins:\s*resolve\(rootDir,\s*'free-plugin-transition-options\.html'\)/);
});
