import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildPublicUrl,
    createObjectKey,
    validateUploadInput
} from './functions/_shared/upload-utils.js';

const makeFile = ({ name, type, size }) => ({
    name,
    type,
    size,
    arrayBuffer: async () => new ArrayBuffer(size)
});

test('accepts a valid image upload and creates an R2 image key', () => {
    const result = validateUploadInput({
        type: 'image',
        file: makeFile({ name: 'cover.webp', type: 'image/webp', size: 1024 })
    });

    assert.equal(result.ok, true);
    assert.equal(result.extension, 'webp');
    assert.equal(result.prefix, 'portfolio/images/');

    const key = createObjectKey({
        prefix: result.prefix,
        extension: result.extension,
        randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
    });

    assert.equal(key, 'portfolio/images/123e4567-e89b-12d3-a456-426614174000.webp');
});

test('rejects files over the type-specific size limit', () => {
    const result = validateUploadInput({
        type: 'audio',
        file: makeFile({ name: 'demo.mp3', type: 'audio/mpeg', size: 31 * 1024 * 1024 })
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 413);
});

test('rejects mismatched unsafe extensions even when MIME type is allowed', () => {
    const result = validateUploadInput({
        type: 'image',
        file: makeFile({ name: 'cover.exe', type: 'image/png', size: 1024 })
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
});

test('builds public URL without duplicate slashes', () => {
    assert.equal(
        buildPublicUrl('https://static.osum.kr/', 'portfolio/audio/demo.mp3'),
        'https://static.osum.kr/portfolio/audio/demo.mp3'
    );
});
