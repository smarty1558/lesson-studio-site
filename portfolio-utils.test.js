import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizePortfolioPayload,
    toAdminPortfolioItem,
    toPublicPortfolioItem
} from './functions/_shared/portfolio-utils.js';

test('maps D1 snake_case rows to public camelCase items', () => {
    const item = toPublicPortfolioItem({
        id: 'id-1',
        title: 'Midnight Concerto',
        description: 'Fantasy orchestra',
        category: 'Album',
        date: '2026-05-14',
        image_url: 'https://static.osum.kr/image.webp',
        audio_url: 'https://static.osum.kr/audio.mp3',
        external_link: 'https://example.com',
        visible: 1,
        sort_order: 2
    });

    assert.deepEqual(item, {
        id: 'id-1',
        title: 'Midnight Concerto',
        description: 'Fantasy orchestra',
        category: 'Album',
        date: '2026-05-14',
        imageUrl: 'https://static.osum.kr/image.webp',
        audioUrl: 'https://static.osum.kr/audio.mp3',
        externalLink: 'https://example.com',
        visible: true,
        sortOrder: 2
    });
});

test('normalizes admin payload for D1 insertion', () => {
    const payload = normalizePortfolioPayload({
        title: '  Demo  ',
        visible: false,
        sortOrder: '4'
    });

    assert.equal(payload.title, 'Demo');
    assert.equal(payload.visible, false);
    assert.equal(payload.sortOrder, 4);
});

test('admin mapping includes timestamps', () => {
    const item = toAdminPortfolioItem({
        id: 'id-1',
        title: 'Demo',
        visible: 0,
        sort_order: 0,
        created_at: '2026-05-14T00:00:00.000Z',
        updated_at: '2026-05-14T00:00:00.000Z'
    });

    assert.equal(item.visible, false);
    assert.equal(item.createdAt, '2026-05-14T00:00:00.000Z');
    assert.equal(item.updatedAt, '2026-05-14T00:00:00.000Z');
});
