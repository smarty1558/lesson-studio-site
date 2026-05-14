import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from './functions/api/admin/upload.js';

const makeUploadRequest = ({ password = 'secret', file, type = 'image' } = {}) => {
    const body = new FormData();
    body.append('file', file || new File(['demo'], 'cover.png', { type: 'image/png' }));
    body.append('type', type);

    return new Request('http://localhost/api/admin/upload', {
        method: 'POST',
        headers: {
            'x-admin-password': password
        },
        body
    });
};

test('uploads a validated file to the bound R2 bucket', async () => {
    const puts = [];
    const response = await onRequestPost({
        request: makeUploadRequest(),
        env: {
            ADMIN_PASSWORD: 'secret',
            R2_PUBLIC_URL: 'https://static.osum.kr',
            PORTFOLIO_BUCKET: {
                put: async (...args) => puts.push(args)
            }
        }
    });
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.type, 'image');
    assert.match(json.key, /^portfolio\/images\/.+\.png$/);
    assert.equal(json.url, `https://static.osum.kr/${json.key}`);
    assert.equal(puts.length, 1);
    assert.equal(puts[0][0], json.key);
    assert.equal(puts[0][2].httpMetadata.contentType, 'image/png');
});

test('returns 401 when the admin password does not match', async () => {
    const response = await onRequestPost({
        request: makeUploadRequest({ password: 'wrong' }),
        env: {
            ADMIN_PASSWORD: 'secret',
            R2_PUBLIC_URL: 'https://static.osum.kr',
            PORTFOLIO_BUCKET: {
                put: async () => {}
            }
        }
    });
    const json = await response.json();

    assert.equal(response.status, 401);
    assert.equal(json.success, false);
});
