import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestDelete, onRequestGet } from './functions/api/admin/files.js';

const env = (overrides = {}) => ({
    ADMIN_PASSWORD: 'secret',
    R2_PUBLIC_URL: 'https://static.osum.kr',
    PORTFOLIO_BUCKET: {
        list: async ({ prefix }) => ({
            truncated: false,
            objects: [
                {
                    key: `${prefix}demo.webp`,
                    size: 2048,
                    uploaded: '2026-05-15T00:00:00.000Z'
                }
            ]
        }),
        delete: async () => {},
        ...overrides
    }
});

test('lists R2 files for the requested portfolio folder', async () => {
    const response = await onRequestGet({
        request: new Request('https://example.com/api/admin/files?type=image', {
            headers: { 'x-admin-password': 'secret' }
        }),
        env: env()
    });
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.files[0].key, 'portfolio/images/demo.webp');
    assert.equal(json.files[0].url, 'https://static.osum.kr/portfolio/images/demo.webp');
});

test('deletes only files inside managed portfolio folders', async () => {
    const deleted = [];
    const response = await onRequestDelete({
        request: new Request('https://example.com/api/admin/files?key=portfolio/audio/demo.mp3', {
            method: 'DELETE',
            headers: { 'x-admin-password': 'secret' }
        }),
        env: env({ delete: async (key) => deleted.push(key) })
    });
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.deepEqual(deleted, ['portfolio/audio/demo.mp3']);
});

test('rejects delete requests outside managed portfolio folders', async () => {
    const response = await onRequestDelete({
        request: new Request('https://example.com/api/admin/files?key=private/admin.txt', {
            method: 'DELETE',
            headers: { 'x-admin-password': 'secret' }
        }),
        env: env()
    });
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
});
