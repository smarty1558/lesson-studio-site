import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const adminJs = readFileSync(new URL('./admin-d1.js', import.meta.url), 'utf8');

const getRuleBody = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
    return match?.[1] || '';
};

test('teacher modal keeps its stage layout when portfolio detail mode is active', () => {
    const teacherDetailRule = getRuleBody('.modal-content.teacher-mode.detail-mode');

    assert.match(teacherDetailRule, /display:\s*block\s*;/);
});

test('teacher page controls are large enough to read as next-page edges', () => {
    const teacherTabRule = getRuleBody('.teacher-tab');
    const closeRule = getRuleBody('.modal-close');

    assert.match(teacherTabRule, /width:\s*clamp\(52px,\s*5vw,\s*72px\)\s*;/);
    assert.match(teacherTabRule, /min-height:\s*calc\(100%\s*-\s*72px\)\s*;/);
    assert.match(teacherTabRule, /writing-mode:\s*vertical-rl\s*;/);
    assert.match(closeRule, /z-index:\s*30\s*;/);
});

test('teacher details use a dedicated modal separate from the portfolio modal', () => {
    assert.match(html, /id="portfolio-modal"/);
    assert.match(html, /id="teacher-modal"/);
    assert.match(html, /id="teacher-modal-body"/);
    assert.match(js, /const openTeacherModal = async/);
    assert.doesNotMatch(js, /openModal\(portfolioButton\.dataset\.teacher,\s*'teacher'\)/);
    assert.doesNotMatch(js, /openModal\(artistCard\.dataset\.teacher,\s*'teacher'\)/);
});

test('admin renders portfolio and teacher cms as separate tabs', () => {
    assert.match(adminJs, /let activeAdminTab = 'portfolio'/);
    assert.match(adminJs, /data-admin-tab="portfolio"/);
    assert.match(adminJs, /data-admin-tab="teachers"/);
    assert.match(adminJs, /\$\{renderTeacherProfilePanel\(\)\}/);
    assert.match(css, /\.admin-tab-portfolio \.admin-teacher-panel/);
    assert.match(css, /\.admin-tab-teachers \.admin-toolbar/);
});

test('portfolio filtering accepts teacher assignments from cms metadata', () => {
    assert.match(js, /normalizeKeyList\(item\.teacherKeys,\s*item\.metadata\?\.teacherKeys,\s*item\.teacherKey\)/);
    assert.match(js, /normalizeKeyList\(item\.courseKeys,\s*item\.targetKeys,\s*item\.metadata\?\.targetKeys,\s*item\.targetKey\)/);
});

test('teacher modal does not hang on slow cms APIs or string point data', () => {
    assert.match(js, /const fetchWithTimeout = async/);
    assert.match(js, /fetchWithTimeout\('\/api\/teachers'/);
    assert.match(js, /fetchWithTimeout\('\/api\/portfolio'/);
    assert.match(js, /points:\s*normalizePointList\(item\.points,\s*item\.metadata\?\.points\)/);
    assert.match(js, /toDisplayList\(enriched\.points\)\.map/);
});

test('site preloads teacher and portfolio data before hiding intro loader', () => {
    assert.match(js, /const preloadSiteData = \(\) =>/);
    assert.match(js, /preloadSiteData\(\)/);
    assert.match(js, /Promise\.all\(\[\s*pageLoadReady,\s*introMinimumReady,\s*preloadSiteData\(\)/);
    assert.match(js, /const siteDataCache = \{/);
    assert.match(js, /portfolioByTarget:\s*new Map\(\)/);
});

test('teacher works opens as a grid before entering detail mode', () => {
    assert.doesNotMatch(js, /teacher-works-detail is-open/);
    assert.match(js, /teacher-work-detail-active/);
    assert.match(js, /portfolio-back/);
    assert.match(css, /\.teacher-dedicated-portfolio\s*\{\s*display:\s*block\s*;/);
    assert.match(css, /\.teacher-dedicated-portfolio \.portfolio-gallery\s*\{[^}]*display:\s*grid\s*;/s);
    assert.match(css, /\.teacher-dedicated-content\.teacher-work-detail-mode \.teacher-dedicated-portfolio\s*\{[^}]*grid-template-columns:\s*minmax\(190px,\s*240px\) minmax\(0,\s*1fr\)\s*;/s);
});

test('dedicated teacher modal animates between variable detail and works sizes', () => {
    const contentRule = getRuleBody('.teacher-dedicated-content');

    assert.doesNotMatch(contentRule, /height:\s*min\(760px/);
    assert.match(contentRule, /transition:\s*[\s\S]*width 0\.44s/);
    assert.match(js, /teacher-view-switching/);
    assert.match(css, /\.teacher-dedicated-content\.teacher-view-switching #teacher-modal-body/);
    assert.match(css, /\.teacher-dedicated-content\.teacher-view-ready #teacher-modal-body/);
});
