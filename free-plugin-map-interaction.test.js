import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./free-plugin-transition-options.html', import.meta.url), 'utf8');

test('free plugin map supports bounded wheel zoom', () => {
  assert.match(html, /zoom:\s*1/);
  assert.match(html, /function updateZoom/);
  assert.match(html, /0\.8,\s*1\.2/);
  assert.match(html, /addEventListener\('wheel'/);
});

test('category cards stay on their branch line when constrained to the viewport', () => {
  assert.match(html, /function constrainCenterToBranch/);
  assert.match(html, /isInsideSafeArea/);
  assert.match(html, /constrainCenterToBranch\(originScreen,\s*desiredCenter/);
});

test('branch lines terminate at the constrained category card positions', () => {
  assert.match(html, /function getCategoryPlacement/);
  assert.match(html, /lineEnd/);
  assert.match(html, /getFinalBranchPoints/);
});

test('category branch endpoints keep a minimum visual gap from each other', () => {
  assert.match(html, /function getSeparatedPlacements/);
  assert.match(html, /minGap/);
  assert.match(html, /separationPass/);
  assert.match(html, /getSeparatedPlacements\(\)/);
});

test('lower-right categories use visibly different branch angles', () => {
  assert.match(html, /\{ x: w \* \.67, y: h \* \.72,/);
  assert.match(html, /\{ x: w \* \.9, y: h \* \.7,/);
});

test('category cards are centered on their branch points', () => {
  assert.doesNotMatch(html, /point\.align === 'right'/);
  assert.doesNotMatch(html, /point\.align === 'left'/);
  assert.doesNotMatch(html, /point\.align === 'center'/);
});

test('plugin drawer renders real category data with row links', () => {
  assert.match(html, /const pluginCategories = \[/);
  assert.match(html, /Komplete Start/);
  assert.match(html, /bx_rockrack V3 Player/);
  assert.match(html, /class="plugin-row"/);
  assert.match(html, /target="_blank"/);
});

test('plugin drawer expands from the selected category card with fast row reveal', () => {
  assert.match(html, /function openDrawerFromCategory/);
  assert.match(html, /--drawer-left/);
  assert.match(html, /is-expanded/);
  assert.match(html, /rowTypeIn/);
});

test('plugin row hover updates the drawer note with that plugin description', () => {
  assert.match(html, /data-use=/);
  assert.match(html, /data-detail=/);
  assert.match(html, /getPluginDetail/);
  assert.match(html, /function setDrawerNote/);
  assert.match(html, /mouseover/);
  assert.match(html, /focusin/);
});

test('expanded plugin drawer can be dragged and closed from empty map space', () => {
  assert.match(html, /drawerDragging/);
  assert.match(html, /function closeDrawer/);
  assert.match(html, /function updateDrawerPosition/);
  assert.match(html, /drawerOriginLeft/);
  assert.match(html, /--drawer-origin-left/);
  assert.match(html, /mapDragMoved/);
});

test('category hover expands in place without outline and drawer collapses back to remembered origin', () => {
  assert.match(html, /--hover-scale/);
  assert.match(html, /border:\s*1px solid transparent/);
  assert.match(html, /scale\(calc\(var\(--scale, 1\) \* var\(--hover-scale, 1\)\)\)/);
  assert.match(html, /\.category:hover,\s*\.category:focus-visible\s*\{[^}]*z-index:\s*24\s*;/s);
  assert.match(html, /drawerOriginWidth/);
  assert.match(html, /scrollbar-width:\s*none/);
  assert.match(html, /::-webkit-scrollbar/);
});

test('background cursor field follows pointer movement', () => {
  assert.match(html, /cursorX/);
  assert.match(html, /function drawWarpedGrid/);
  assert.match(html, /function getWarpedGridPoint/);
  assert.match(html, /quadraticCurveTo/);
  assert.match(html, /startCursorFieldLoop/);
  assert.match(html, /Math\.sin/);
  assert.match(html, /pointermove/);
});

test('free plugin page reuses the parent home cursor instead of creating a second cursor', () => {
  assert.doesNotMatch(html, /document\.createElement\('div'\)/);
  assert.doesNotMatch(html, /className = 'view-cursor-dot'/);
  assert.doesNotMatch(html, /function renderViewCursor/);
  assert.match(html, /--hidden-cursor/);
  assert.match(html, /cursor:\s*var\(--hidden-cursor\)\s*!important/);
  assert.match(html, /\.stage\.is-complete\s*\{[^}]*cursor:\s*grab\s*!important/s);
  assert.match(html, /\.stage\.is-complete\.is-dragging\s*\{[^}]*cursor:\s*grabbing\s*!important/s);
  assert.match(html, /function syncParentCursor/);
  assert.match(html, /window\.parent\.postMessage/);
  assert.match(html, /type:\s*'free-plugin-cursor'/);
  assert.match(html, /event\.target\?\.closest\?\.\('\.category, \.plugin-row, \.site-back, \.stage-back, \.trigger'\)/);
});

test('static css grid is hidden so only the animated canvas grid remains', () => {
  assert.match(html, /\.grid\s*\{[^}]*display:\s*none/s);
  assert.match(html, /drawWarpedGrid\(elapsed\)/);
});

test('warped grid keeps lens bulge but uses restrained ripple motion', () => {
  assert.match(html, /const ripple = Math\.sin\(time \+ distance \* \.028\) \* 2\.2 \* force/);
  assert.match(html, /const bulge = 22 \* force \+ ripple/);
  assert.match(html, /const tangent = Math\.sin\(time \* \.65 \+ x \* \.01 \+ y \* \.008\) \* 1\.6 \* force/);
  assert.match(html, /performance\.now\(\) \* \.0014/);
});

test('warped grid moves with a slower parallax offset while dragging the map', () => {
  assert.match(html, /function getGridParallaxOffset/);
  assert.match(html, /panX \* \.28/);
  assert.match(html, /panY \* \.28/);
  assert.match(html, /offsetX/);
  assert.match(html, /offsetY/);
});

test('runner blink triggers staggered row then column grid reveal', () => {
  assert.doesNotMatch(html, /function drawGridReveal/);
  assert.match(html, /function drawWarpedGrid\(elapsed = 9999\)/);
  assert.match(html, /function drawWarpedGridLine/);
  assert.match(html, /revealHead/);
  assert.match(html, /rowRevealProgress/);
  assert.match(html, /columnRevealProgress/);
  assert.match(html, /elapsed - 1500/);
  assert.match(html, /elapsed - 1840/);
  assert.match(html, /\/ 900/);
  assert.match(html, /\/ 940/);
  assert.doesNotMatch(html, /revealHead = lerp\(start, end, easeOutExpo\(progress\)\)/);
});

test('category cards do not re-position after the reveal completes', () => {
  assert.match(html, /stage\.classList\.add\('is-complete'\);\s*state\.running = false;\s*drawFrame\(9999\);\s*startCursorFieldLoop\(\);/);
  assert.doesNotMatch(html, /stage\.classList\.add\('is-complete'\);\s*state\.running = false;\s*positionCategories\(\);/);
});
