import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getVisibleSortedPortfolioItems,
    normalizePortfolioItem
} from './portfolio-data.js';

test('filters hidden portfolio items and sorts by sortOrder then newest date', () => {
    const items = [
        { id: 'hidden', title: 'Hidden', visible: false, sortOrder: 1, date: '2026-01-01' },
        { id: 'older', title: 'Older', visible: true, sortOrder: 2, date: '2025-01-01' },
        { id: 'newer', title: 'Newer', visible: true, sortOrder: 2, date: '2026-02-01' },
        { id: 'first', title: 'First', visible: true, sortOrder: 1, date: '2024-01-01' }
    ];

    assert.deepEqual(
        getVisibleSortedPortfolioItems(items).map((item) => item.id),
        ['first', 'newer', 'older']
    );
});

test('normalizes required portfolio fields without creating broken media URLs', () => {
    const item = normalizePortfolioItem({
        id: 'demo',
        title: 'Demo',
        description: 'A portfolio demo',
        category: 'anime',
        date: '2026-05-14',
        visible: true,
        sortOrder: 1
    });

    assert.equal(item.desc, 'A portfolio demo');
    assert.equal(item.img, '');
    assert.equal(item.audioUrl, '');
    assert.equal(item.externalLink, '');
});
