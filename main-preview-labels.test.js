import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

test('portfolio media views do not render preview type labels', () => {
    assert.equal(mainSource.includes('<div class="expanded-player-badge">YouTube Preview</div>'), false);
    assert.equal(mainSource.includes('<div class="expanded-player-badge">Audio Preview</div>'), false);
    assert.equal(mainSource.includes('<span class="media-pill">${enriched.mediaType} · ${enriched.format}</span>'), false);
});
