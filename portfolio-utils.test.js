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
        sort_order: 2,
        metadata: JSON.stringify({
            mediaType: 'Audio',
            youtubeUrl: 'https://youtube.com/watch?v=abcdefghijk',
            teacherKeys: ['kim'],
            targetKeys: ['anime']
        })
    });

    assert.equal(item.id, 'id-1');
    assert.equal(item.title, 'Midnight Concerto');
    assert.equal(item.desc, 'Fantasy orchestra');
    assert.equal(item.img, 'https://static.osum.kr/image.webp');
    assert.equal(item.audioUrl, 'https://static.osum.kr/audio.mp3');
    assert.equal(item.externalUrl, 'https://example.com');
    assert.equal(item.visible, true);
    assert.equal(item.sortOrder, 2);
    assert.equal(item.mediaType, 'Audio');
    assert.equal(item.youtubeUrl, 'https://youtube.com/watch?v=abcdefghijk');
    assert.deepEqual(item.teacherKeys, ['kim']);
    assert.deepEqual(item.targetKeys, ['anime']);
});

test('normalizes admin payload for D1 insertion', () => {
    const payload = normalizePortfolioPayload({
        title: '  Demo  ',
        visible: false,
        sortOrder: '4',
        metadata: {
            youtubeUrl: 'https://youtube.com/demo',
            targetKeys: ['game']
        }
    });

    assert.equal(payload.title, 'Demo');
    assert.equal(payload.visible, false);
    assert.equal(payload.sortOrder, 4);
    assert.deepEqual(payload.metadata.targetKeys, ['game']);
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
