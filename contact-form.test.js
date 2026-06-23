import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('./main.js', import.meta.url), 'utf8');

test('consulting form collects reply email and inquiry detail', () => {
    assert.match(indexSource, /<span>이름 <b aria-hidden="true">\*<\/b><\/span>[\s\S]*<input[^>]*name="name"[^>]*required/);
    assert.match(indexSource, /<span>연락처<\/span>[\s\S]*<input type="tel" name="phone"/);
    assert.doesNotMatch(indexSource, /<input[^>]*name="phone"[^>]*required/);
    assert.match(indexSource, /<span>이메일 <b aria-hidden="true">\*<\/b><\/span>[\s\S]*<input[^>]*type="email"[^>]*name="email"[^>]*required/);
    assert.match(indexSource, /<p class="required-guide"><b aria-hidden="true">\*<\/b> 표시는 필수 선택\/작성 항목입니다\.<\/p>/);
    assert.match(indexSource, /class="form-row course-mode-row"/);
    assert.match(indexSource, /<span>희망 수업 <b aria-hidden="true">\*<\/b><\/span>[\s\S]*<select[^>]*name="course"[^>]*required/);
    assert.match(indexSource, /<option value="">수업을 선택해주세요<\/option>/);
    assert.match(indexSource, /<option value="jpop">jpop 작곡 \/ 미디 레슨<\/option>/);
    assert.match(indexSource, /<option value="subculture">서브컬처 작곡 \/ 미디 레슨<\/option>/);
    assert.match(indexSource, /<option value="mixing">믹싱 \/ 마스터링<\/option>/);
    assert.match(indexSource, /<span>수업 방식 <b aria-hidden="true">\*<\/b><\/span>[\s\S]*<select[^>]*name="lessonMode"[^>]*required/);
    assert.match(indexSource, /<option value="">방식을 선택해주세요<\/option>/);
    assert.match(indexSource, /<option value="online">온라인<\/option>/);
    assert.match(indexSource, /<option value="offline">오프라인<\/option>/);
    assert.match(indexSource, /<span>희망 선생님<\/span>[\s\S]*<select name="teacher"/);
    assert.match(indexSource, /<select name="teacher">\s*<option value="">선생님을 선택해주세요<\/option>\s*<\/select>/);
    assert.doesNotMatch(indexSource, /<option value="lee">박학민 \/ B@kamin<\/option>/);
    assert.doesNotMatch(indexSource, /<select[^>]*name="teacher"[^>]*required/);
    assert.match(indexSource, /<span>문의 내용 <b aria-hidden="true">\*<\/b><\/span>[\s\S]*<textarea[\s\S]*name="message"[\s\S]*required/);
});

test('consulting form teacher options are hydrated from CMS teacher profile names', () => {
    assert.match(mainSource, /const syncContactTeacherOptionsFromProfiles = async \(\) =>/);
    assert.match(mainSource, /const profiles = await Promise\.all\(teacherDataKeys\.map\(\(key\) => loadTeacherProfile\(key\)\)\);/);
    assert.match(mainSource, /option\.textContent = profile\.name;/);
    assert.match(mainSource, /syncContactTeacherOptionsFromProfiles\(\)/);
});

test('consulting form submits contact payload to the contact API', () => {
    assert.match(mainSource, /fetch\('\/api\/contact'/);
    assert.match(mainSource, /formData\.get\('email'\)/);
    assert.match(mainSource, /getSelectedOptionText\(contactForm,\s*'course'\)/);
    assert.match(mainSource, /formData\.get\('lessonMode'\)/);
    assert.match(mainSource, /getSelectedOptionText\(contactForm,\s*'lessonMode'\)/);
    assert.match(mainSource, /formData\.get\('teacher'\)/);
    assert.match(mainSource, /getSelectedOptionText\(contactForm,\s*'teacher'\)/);
    assert.match(mainSource, /formData\.get\('message'\)/);
});
