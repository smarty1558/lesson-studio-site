import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestPost } from './functions/api/contact.js';

const makeRequest = (body) => new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
});

test('contact API requires a valid reply email and message detail', async () => {
    const response = await onRequestPost({
        request: makeRequest({
            name: 'Kim',
            phone: '010-0000-0000',
            email: 'not-an-email',
            course: 'jpop',
            lessonMode: '',
            message: ''
        }),
        env: {}
    });
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
});

test('contact API sends inquiry email to the OMUS inbox', async () => {
    const fetchCalls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
        fetchCalls.push(args);
        return new Response(JSON.stringify({ id: 'email-1' }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    };

    try {
        const response = await onRequestPost({
            request: makeRequest({
                name: 'Kim',
                phone: '',
                email: 'student@example.com',
                course: 'jpop',
                courseLabel: 'jpop 작곡 / 미디 레슨',
                lessonMode: 'online',
                lessonModeLabel: '온라인',
                message: 'I want to ask about vocal direction.',
                portfolioInterest: 'Sugar Rush Opening'
            }),
            env: {
                RESEND_API_KEY: 'test-key',
                CONTACT_FROM_EMAIL: 'OSUM <contact@example.com>',
                CONTACT_TO_EMAIL: 'smarty1558@gmail.com, omusinform@gmail.com, smarty1558910@gmail.com'
            }
        });
        const json = await response.json();
        const sentPayload = JSON.parse(fetchCalls[0][1].body);

        assert.equal(response.status, 200);
        assert.equal(json.success, true);
        assert.equal(fetchCalls[0][0], 'https://api.resend.com/emails');
        assert.deepEqual(sentPayload.to, ['omusinform@gmail.com']);
        assert.equal(sentPayload.reply_to, 'student@example.com');
        assert.match(sentPayload.text, /이름: Kim/);
        assert.match(sentPayload.text, /연락처: -/);
        assert.match(sentPayload.text, /이메일: student@example.com/);
        assert.match(sentPayload.text, /희망 수업: jpop 작곡 \/ 미디 레슨/);
        assert.doesNotMatch(sentPayload.text, /희망 수업: jpop\n/);
        assert.match(sentPayload.text, /수업 방식: 온라인/);
        assert.doesNotMatch(sentPayload.text, /희망 선생님/);
        assert.match(sentPayload.text, /I want to ask about vocal direction/);
        assert.match(sentPayload.text, /이런 스타일 배우기: Sugar Rush Opening/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('contact API keeps optional phone field optional', async () => {
    const fetchCalls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
        fetchCalls.push(args);
        return new Response(JSON.stringify({ id: 'email-optional' }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });
    };

    try {
        const response = await onRequestPost({
            request: makeRequest({
                name: 'Kim',
                email: 'student@example.com',
                course: 'mixing',
                courseLabel: '믹싱 / 마스터링',
                lessonMode: 'offline',
                lessonModeLabel: '오프라인',
                message: 'I want mixing feedback.'
            }),
            env: {
                RESEND_API_KEY: 'test-key',
                CONTACT_TO_EMAIL: 'owner@example.com'
            }
        });
        const sentPayload = JSON.parse(fetchCalls[0][1].body);

        assert.equal(response.status, 200);
        assert.match(sentPayload.text, /연락처: -/);
        assert.match(sentPayload.text, /희망 수업: 믹싱 \/ 마스터링/);
        assert.match(sentPayload.text, /수업 방식: 오프라인/);
        assert.doesNotMatch(sentPayload.text, /희망 선생님/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

const OMUS_INBOX = 'omusinform@gmail.com';

// Sends one inquiry with Resend replaced by a fake. Any request to another host fails the test.
const submitInquiry = async ({ body: extra = {}, env, ipCity } = {}) => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        calls.push({ url: String(url), init });
        if (String(url) !== 'https://api.resend.com/emails') {
            throw new Error(`unexpected outbound request: ${url}`);
        }
        return new Response(JSON.stringify({ id: 'fake' }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    try {
        const request = makeRequest({
            name: 'Visitor',
            email: 'visitor@example.com',
            course: 'jpop',
            lessonMode: 'online',
            message: 'hello',
            ...extra
        });
        if (ipCity !== undefined) Object.defineProperty(request, 'cf', { value: { city: ipCity } });
        const response = await onRequestPost({ request, env: { RESEND_API_KEY: 'test-key', ...env } });
        assert.equal(response.status, 200);
        assert.equal(calls.length, 1);
        return JSON.parse(calls[0].init.body);
    } finally {
        globalThis.fetch = originalFetch;
    }
};

const expectOmusOnly = (sent) => {
    assert.deepEqual(sent.to, [OMUS_INBOX]);
    assert.equal(sent.cc, undefined);
    assert.equal(sent.bcc, undefined);
};

test('every inquiry goes only to the OMUS inbox, whatever the dashboard recipient variables say', async () => {
    expectOmusOnly(await submitInquiry());
    expectOmusOnly(await submitInquiry({ env: { CONTACT_TO_EMAIL: 'owner@example.com, academy@example.com' } }));
    expectOmusOnly(await submitInquiry({ env: { CONTACT_TO_EMAIL: 'smarty1558@gmail.com', CONTACT_PYEONGTAEK_TO_EMAIL: 'other@example.com' } }));
    expectOmusOnly(await submitInquiry({ env: { CONTACT_SPECIAL_TO_EMAIL: 'other@example.com', CONTACT_SPECIAL_FROM_EMAILS: 'visitor@example.com' } }));
});

test('visitor region no longer affects the recipient', async () => {
    expectOmusOnly(await submitInquiry({ ipCity: 'Pyeongtaek' }));
    expectOmusOnly(await submitInquiry({ ipCity: 'Seoul' }));
    expectOmusOnly(await submitInquiry({ body: { geo: { lat: 36.9921, lng: 127.1129, accuracy: 50 } } }));
});

test('a client-supplied recipient is ignored', async () => {
    expectOmusOnly(await submitInquiry({ body: { to: 'attacker@example.com', cc: 'attacker@example.com' } }));
});

test('contact form no longer asks for the browser location', () => {
    const page = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
    assert.doesNotMatch(page, /navigator\.geolocation/);
    assert.doesNotMatch(page, /requestBrowserLocation/);
});

test('bottom-right KakaoTalk button links to the OMUS channel chat', () => {
    const page = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
    const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
    assert.match(page, /<a class="kakao-float" href="https:\/\/pf\.kakao\.com\/_axmmPX\/chat" target="_blank" rel="noopener noreferrer"/);
    assert.match(css, /\.kakao-float \{[^}]*position: fixed;[^}]*right: 22px;[^}]*bottom: 24px;/s);
});
