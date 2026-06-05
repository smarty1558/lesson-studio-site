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

test('teacher page controls live inside the active panel instead of edge tabs', () => {
    const actionRule = getRuleBody('.teacher-panel-action');
    const closeRule = getRuleBody('.modal-close');

    assert.doesNotMatch(js, /class="teacher-tab/);
    assert.match(js, /class="teacher-panel-action" data-dedicated-teacher-panel="works"/);
    assert.match(js, /class="teacher-panel-action teacher-panel-action-secondary" data-dedicated-teacher-panel="detail"/);
    assert.match(actionRule, /min-height:\s*46px\s*;/);
    assert.match(actionRule, /width:\s*fit-content\s*;/);
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

test('portfolio modals prewarm markup and media before click animations', () => {
    assert.match(js, /preparedPortfolioViews:\s*new Map\(\)/);
    assert.match(js, /const preparePortfolioView = async/);
    assert.match(js, /decodePortfolioImages/);
    assert.match(js, /requestIdleCallback/);
    assert.match(js, /preparePortfolioView\('teacher', key\)/);
    assert.match(js, /preparePortfolioView\('course', key\)/);
});

test('admin renders portfolio and teacher cms as separate tabs', () => {
    assert.match(adminJs, /let activeAdminTab = 'portfolio'/);
    assert.match(adminJs, /data-admin-tab="portfolio"/);
    assert.match(adminJs, /data-admin-tab="teachers"/);
    assert.match(adminJs, /\$\{renderTeacherProfilePanel\(\)\}/);
    assert.match(css, /\.admin-tab-portfolio \.admin-teacher-panel/);
    assert.match(css, /\.admin-tab-teachers \.admin-toolbar/);
});

test('teacher cms profiles hydrate main teacher cards', () => {
    assert.match(js, /const syncTeacherCardsFromProfiles = async/);
    assert.match(js, /\.artist-card\[data-teacher\]/);
    assert.match(js, /roleTarget\)\s*roleTarget\.textContent = profile\.role/);
    assert.match(js, /nameTarget\)\s*nameTarget\.textContent = profile\.name/);
    assert.match(js, /summaryTarget\)\s*summaryTarget\.textContent = profile\.summary/);
    assert.match(js, /\.then\(syncTeacherCardsFromProfiles\)/);
});

test('teacher cms exposes representative direction separately from class direction', () => {
    assert.match(adminJs, /name="direction"/);
    assert.match(adminJs, />대표 방향/);
    assert.match(adminJs, />Class Direction/);
    assert.match(js, /<dt>대표 방향<\/dt>\s*<dd>\$\{profile\.direction \|\| profile\.note\}<\/dd>/);
    assert.match(js, /<strong>Class Direction<\/strong>\s*<p>\$\{profile\.note\}<\/p>/);
});

test('admin uses saved teacher names for portfolio assignment labels', () => {
    assert.match(adminJs, /const getTeacherChoiceOptions = \(\) => teacherOptions\.map/);
    assert.match(adminJs, /teacherProfileForKey\(teacherItems,\s*key,\s*index\)/);
    assert.match(adminJs, /chips\(meta\.teacherKeys,\s*teacherChoiceOptions\)/);
    assert.match(adminJs, /renderChecks\('teacherKeys',\s*teacherChoiceOptions,\s*meta\.teacherKeys\)/);
    assert.match(adminJs, /readFormItem\(form,\s*getTeacherChoiceOptions\(\)\)/);
    assert.match(adminJs, /teacherItems = upsertTeacherItem\(teacherItems,\s*savedTeacher\.item/);
});

test('portfolio cms labels match the unified public portfolio fields', () => {
    assert.match(adminJs, />제목</);
    assert.match(adminJs, />크레딧</);
    assert.match(adminJs, />설명/);
    assert.match(adminJs, />태그</);
    assert.match(adminJs, />참여 강사</);
    assert.doesNotMatch(adminJs, /간략 설명|상세 프로젝트 설명|간략 크레딧|카테고리|제작 포인트|포인트|태그 \/ 참여자|프리뷰 종류|YouTube Preview|Audio Preview|Project Preview/);
    assert.doesNotMatch(js, /간략 설명|상세 프로젝트 설명|제작 포인트|포인트|프리뷰 종류|YouTube Preview|Audio Preview|Project Preview/);
});

test('portfolio detail views show credit below title and tags as pills', () => {
    assert.match(js, /<p class="portfolio-credit-line decode-text">\$\{enriched\.credits \|\| '-'\}<\/p>/);
    assert.match(js, /<dt>설명<\/dt>/);
    assert.match(js, /portfolio-tag-list/);
    assert.match(js, /portfolio-tag/);
    assert.doesNotMatch(js, /<dt>크레딧<\/dt>/);
    assert.doesNotMatch(js, /<dt>담당 강사<\/dt>/);
    assert.doesNotMatch(js, /<dt>제작 포인트<\/dt>/);
});

test('teacher work detail uses the portfolio consultation CTA label and spacing', () => {
    assert.match(js, /<a href="#contact" class="portfolio-detail-cta">이런 스타일 배우기<\/a>/);
    assert.match(js, /<button type="button" class="portfolio-back">목록으로 돌아가기<\/button>/);
    assert.match(css, /\.portfolio-detail-cta\s*\{[^}]*padding:\s*0 14px\s*;/s);
    assert.match(css, /\.portfolio-detail-cta:hover,\s*\.portfolio-back:hover\s*\{[^}]*transform:\s*translateY\(-2px\)\s*;/s);
    assert.match(css, /\.portfolio-detail-cta:active,\s*\.portfolio-back:active\s*\{[^}]*transform:\s*translateY\(0\)\s*scale\(0\.98\)\s*;/s);
});

test('audio portfolio players share and cache the same volume', () => {
    assert.match(js, /const AUDIO_PREVIEW_VOLUME_KEY = 'osumAudioPreviewVolume';/);
    assert.match(js, /const readAudioPreviewVolume = \(\) =>/);
    assert.match(js, /localStorage\.setItem\(AUDIO_PREVIEW_VOLUME_KEY/);
    assert.match(js, /const setAudioVolumeFill = \(input,\s*volume\) =>/);
    assert.match(js, /input\.style\.setProperty\('--volume-fill'/);
    assert.match(js, /querySelectorAll\('audio\[data-osum-audio-preview\]'\)/);
    assert.match(js, /audio\.addEventListener\('volumechange'/);
    assert.match(js, /const renderOsumAudioPlayer = \(item\) =>/);
    assert.match(js, /class="osum-audio-player"/);
    assert.match(js, /data-audio-toggle/);
    assert.match(js, /data-audio-volume/);
    assert.match(js, /class="osum-audio-volume-inline"/);
    assert.match(js, /class="osum-audio-topline"/);
    assert.match(js, /class="osum-audio-bottomline"/);
    assert.match(js, /<div class="osum-audio-progress" data-audio-seek>/);
    assert.match(js, /<span data-audio-current>0:00<\/span>\s*<span data-audio-duration>0:00<\/span>/);
    assert.doesNotMatch(js, /data-volume-popover/);
    assert.match(js, /<audio data-osum-audio-preview preload="metadata" src="\$\{item\.audioUrl\}"><\/audio>/);
    assert.match(css, /\.osum-audio-player\s*\{/);
    assert.match(css, /\.osum-audio-volume-inline\s*\{/);
    assert.match(css, /\.osum-audio-chip\s*\{[^}]*grid-template-columns:\s*1fr\s*;/s);
    assert.match(css, /\.osum-audio-chip\s*\{[^}]*border-radius:\s*22px\s*;/s);
    assert.match(css, /\.osum-audio-topline\s*\{/);
    assert.match(css, /\.osum-audio-bottomline\s*\{/);
    assert.match(css, /\.osum-audio-time-row\s*\{/);
    assert.match(css, /\.osum-audio-volume-inline input:focus-visible\s*\{\s*outline:\s*none\s*;/);
    assert.match(css, /\.osum-audio-volume-inline input::-webkit-slider-runnable-track\s*\{/);
    assert.match(css, /var\(--volume-fill,\s*45%\)/);
    assert.match(css, /\.osum-audio-volume-inline input::-webkit-slider-thumb\s*\{/);
    assert.match(css, /\.osum-audio-volume-inline input::-moz-focus-outer\s*\{/);
    assert.doesNotMatch(css, /\.osum-audio-volume-popover/);
    assert.doesNotMatch(css, /\.osum-audio-volume:hover/);
});

test('portfolio side list shows title and credits only', () => {
    assert.match(js, /<h4>\$\{enriched\.title\}<\/h4>\s*<p>\$\{enriched\.credits\}<\/p>/);
    assert.doesNotMatch(js, /<span class="media-pill">\$\{enriched\.category \|\| enriched\.mediaType\}<\/span>\s*<h4>\$\{enriched\.title\}<\/h4>\s*<p>\$\{enriched\.desc/);
});

test('portfolio items without images use the default cover instead of no image text', () => {
    assert.match(js, /const DEFAULT_PORTFOLIO_IMAGE = new URL\('\.\/portfolio-default-cover\.png', import\.meta\.url\)\.href;/);
    assert.match(js, /img:\s*item\.imageUrl \|\| DEFAULT_PORTFOLIO_IMAGE/);
    assert.doesNotMatch(js, /portfolio-image-fallback">No Image/);
});

test('portfolio filtering accepts teacher assignments from cms metadata', () => {
    assert.match(js, /normalizeKeyList\(item\.teacherKeys,\s*item\.metadata\?\.teacherKeys,\s*item\.teacherKey\)/);
    assert.match(js, /normalizeKeyList\(item\.courseKeys,\s*item\.targetKeys,\s*item\.metadata\?\.targetKeys,\s*item\.targetKey\)/);
});

test('teacher modal does not hang on slow cms APIs or string point data', () => {
    assert.match(js, /const fetchWithTimeout = async/);
    assert.match(js, /fetchWithTimeout\('\/api\/teachers'/);
    assert.match(js, /fetchWithTimeout\('\/api\/portfolio'/);
    assert.match(js, /tags:\s*normalizeTagList\(item\.tags,\s*item\.metadata\?\.tags,\s*item\.category\)/);
});

test('site preloads teacher and portfolio data before hiding intro loader', () => {
    assert.match(js, /const preloadSiteData = \(\) =>/);
    assert.match(js, /preloadSiteData\(\)/);
    assert.match(js, /Promise\.all\(\[\s*pageLoadReady,\s*introMinimumReady,\s*preloadSiteData\(\)/);
    assert.match(js, /const siteDataCache = \{/);
    assert.match(js, /portfolioByTarget:\s*new Map\(\)/);
});

test('teacher works opens as a grid before entering detail mode', () => {
    const teacherWorksMarkup = js.slice(
        js.indexOf('const renderPortfolioCardMarkup ='),
        js.indexOf('const decodePortfolioImages =', js.indexOf('const renderPortfolioCardMarkup ='))
    );

    assert.doesNotMatch(js, /teacher-works-detail is-open/);
    assert.match(js, /teacher-work-detail-active/);
    assert.match(js, /portfolio-back/);
    assert.match(js, /renderPortfolioCardMarkup\(item,\s*index,\s*'data-teacher-work-index'\)/);
    assert.match(teacherWorksMarkup, /<div class="frame-inner[^>]*>\s*<div class="play-overlay">\s*<div class="play-icon">\+<\/div>/);
    assert.match(css, /\.teacher-dedicated-portfolio\s*\{\s*display:\s*block\s*;/);
    assert.match(css, /\.teacher-dedicated-portfolio \.portfolio-gallery\s*\{[^}]*display:\s*grid\s*;/s);
    assert.match(css, /\.teacher-dedicated-portfolio \.portfolio-gallery\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)\s*;/s);
    assert.match(css, /\.teacher-dedicated-portfolio \.portfolio-gallery\s*\{[^}]*overflow:\s*auto\s*;/s);
    assert.match(css, /\.teacher-dedicated-content\.teacher-work-detail-mode \.teacher-dedicated-portfolio\s*\{[^}]*grid-template-columns:\s*78px minmax\(0,\s*1fr\)\s*;/s);
});

test('portfolio detail side list stays compact and expands item on desktop hover', () => {
    assert.match(css, /\.modal-content\.detail-mode\s*\{[^}]*grid-template-columns:\s*78px minmax\(0,\s*1fr\)\s*;/s);
    assert.match(css, /\.modal-content\.detail-mode\s*\{[^}]*overflow:\s*visible\s*;/s);
    assert.match(css, /\.modal-content\.detail-mode \.portfolio-item\s*\{[^}]*width:\s*74px\s*;/s);
    assert.match(css, /@media \(hover:\s*hover\) and \(pointer:\s*fine\)\s*\{[^}]*\.modal-content\.detail-mode \.portfolio-item:hover/s);
    assert.match(css, /transform:\s*translateX\(-186px\)\s*;/);
    assert.match(css, /\.modal-content\.detail-mode \.portfolio-gallery\s*\{[^}]*overflow-y:\s*auto\s*;/s);
    assert.match(css, /\.modal-content\.detail-mode \.portfolio-gallery\s*\{[^}]*margin-left:\s*-186px\s*;/s);
    assert.match(css, /\.modal-content\.detail-mode \.portfolio-gallery\s*\{[^}]*padding:\s*2px 0 2px 186px\s*;/s);
    assert.match(css, /\.modal-content\.detail-mode \.portfolio-gallery\s*\{[^}]*scrollbar-width:\s*none\s*;/s);
});

test('portfolio grids show four cards per row on desktop', () => {
    assert.match(css, /\.portfolio-gallery\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)\s*;/s);
    assert.match(css, /\.portfolio-gallery\s*\{[^}]*overflow:\s*auto\s*;/s);
});

test('dedicated teacher modal animates between variable detail and works sizes', () => {
    const contentRule = getRuleBody('.teacher-dedicated-content');

    assert.doesNotMatch(contentRule, /height:\s*min\(760px/);
    assert.match(contentRule, /transition:\s*[\s\S]*width 0\.44s/);
    assert.match(js, /teacher-view-switching/);
    assert.match(css, /\.teacher-dedicated-content\.teacher-view-switching #teacher-modal-body/);
    assert.match(css, /\.teacher-dedicated-content\.teacher-view-ready #teacher-modal-body/);
});
