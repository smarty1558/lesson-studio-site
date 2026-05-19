import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mergeTeacherProfile,
    normalizeTeacherProfilePayload,
    toPublicTeacherProfile
} from './teacher-profile-utils.js';

test('normalizes teacher profile payloads for CMS storage', () => {
    const payload = normalizeTeacherProfilePayload({
        key: ' kim ',
        name: '  Kim Director  ',
        role: ' Vocal Coach ',
        imageUrl: ' https://cdn.example.com/kim.webp ',
        summary: ' Main teacher ',
        specialties: 'Anime Vocal, Topline',
        works: ['Opening Demo', 'Character Song'],
        note: ' Portfolio direction ',
        sortOrder: '3'
    });

    assert.deepEqual(payload, {
        key: 'kim',
        name: 'Kim Director',
        role: 'Vocal Coach',
        imageUrl: 'https://cdn.example.com/kim.webp',
        summary: 'Main teacher',
        specialties: ['Anime Vocal', 'Topline'],
        works: ['Opening Demo', 'Character Song'],
        note: 'Portfolio direction',
        sortOrder: 3
    });
});

test('maps D1 teacher rows to public profile shape', () => {
    const profile = toPublicTeacherProfile({
        key: 'lee',
        name: 'Lee',
        role: 'Producer',
        image_url: 'https://cdn.example.com/lee.webp',
        summary: 'J-POP producer',
        specialties: '["J-POP","Arrangement"]',
        works: 'Blue Hour, Studio Demo',
        note: 'Makes references practical.',
        sort_order: 2
    });

    assert.equal(profile.key, 'lee');
    assert.equal(profile.image, 'https://cdn.example.com/lee.webp');
    assert.equal(profile.imageUrl, 'https://cdn.example.com/lee.webp');
    assert.deepEqual(profile.specialties, ['J-POP', 'Arrangement']);
    assert.deepEqual(profile.works, ['Blue Hour', 'Studio Demo']);
    assert.equal(profile.sortOrder, 2);
});

test('merges CMS teacher profile fields over static fallback data', () => {
    const merged = mergeTeacherProfile(
        { key: 'han', name: 'Han', image: './fallback.png', specialties: ['Game Audio'], works: ['Loop'], note: 'Fallback' },
        { key: 'han', imageUrl: 'https://cdn.example.com/han.webp', summary: 'CMS summary' }
    );

    assert.equal(merged.key, 'han');
    assert.equal(merged.name, 'Han');
    assert.equal(merged.image, 'https://cdn.example.com/han.webp');
    assert.equal(merged.summary, 'CMS summary');
    assert.deepEqual(merged.specialties, ['Game Audio']);
});
