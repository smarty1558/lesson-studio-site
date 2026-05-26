import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    failure,
    success
} from './functions/_shared/upload-utils.js';

const adminSource = readFileSync(new URL('./admin-d1.js', import.meta.url), 'utf8');

test('api json responses are not cached by browsers or edge caches', () => {
    assert.equal(success({}).headers.get('Cache-Control'), 'no-store');
    assert.equal(failure('Nope').headers.get('Cache-Control'), 'no-store');
});

test('admin api requests bypass cached cms responses', () => {
    assert.match(adminSource, /cache:\s*'no-store'/);
});

test('teacher cms keeps the saved profile from the post response instead of redrawing stale data', () => {
    assert.match(adminSource, /const savedTeacher = await apiJson\('\/api\/admin\/teachers'/);
    assert.match(adminSource, /teacherItems = upsertTeacherItem\(teacherItems,\s*savedTeacher\.item/);
    assert.doesNotMatch(adminSource, /await loadTeachers\('Teacher profile saved\.'\)/);
});
