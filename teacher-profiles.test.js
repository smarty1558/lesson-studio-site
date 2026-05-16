import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getTeacherProfile,
    getTeacherProfileViewState
} from './teacher-profiles.js';

test('returns teacher profile details for the selected teacher key', () => {
    const profile = getTeacherProfile('kim');

    assert.equal(profile.key, 'kim');
    assert.equal(profile.name, '김정환');
    assert.ok(profile.specialties.includes('Anime Vocal'));
    assert.ok(profile.works.length >= 2);
});

test('teacher profile view state toggles between detail and works panels', () => {
    assert.deepEqual(getTeacherProfileViewState('detail'), {
        isWorks: false,
        detailLabel: '강사 상세정보 보기',
        worksLabel: '강사 대표작품 보기'
    });

    assert.equal(getTeacherProfileViewState('works').isWorks, true);
});
