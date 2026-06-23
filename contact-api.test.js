import test from 'node:test';
import assert from 'node:assert/strict';
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

test('contact API requires configured recipient emails', async () => {
    const response = await onRequestPost({
        request: makeRequest({
            name: 'Kim',
            phone: '010-0000-0000',
            email: 'student@example.com',
            course: 'jpop',
            lessonMode: 'online',
            message: 'I want to ask about vocal direction.'
        }),
        env: {
            RESEND_API_KEY: 'test-key'
        }
    });
    const json = await response.json();

    assert.equal(response.status, 503);
    assert.equal(json.success, false);
});

test('contact API sends inquiry email to configured studio recipients', async () => {
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
                teacher: 'lee',
                teacherLabel: '박학민 / B@kamin',
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
        assert.deepEqual(sentPayload.to, ['smarty1558@gmail.com', 'omusinform@gmail.com', 'smarty1558910@gmail.com']);
        assert.equal(sentPayload.reply_to, 'student@example.com');
        assert.match(sentPayload.text, /이름: Kim/);
        assert.match(sentPayload.text, /연락처: -/);
        assert.match(sentPayload.text, /이메일: student@example.com/);
        assert.match(sentPayload.text, /희망 수업: jpop 작곡 \/ 미디 레슨/);
        assert.doesNotMatch(sentPayload.text, /희망 수업: jpop\n/);
        assert.match(sentPayload.text, /수업 방식: 온라인/);
        assert.match(sentPayload.text, /희망 선생님: 박학민 \/ B@kamin/);
        assert.match(sentPayload.text, /I want to ask about vocal direction/);
        assert.match(sentPayload.text, /이런 스타일 배우기: Sugar Rush Opening/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('contact API keeps optional phone and teacher fields optional', async () => {
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
        assert.match(sentPayload.text, /희망 선생님: 미선택/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('contact API sends inquiry email to multiple configured recipients', async () => {
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
                phone: '010-0000-0000',
                email: 'student@example.com',
                course: 'jpop',
                lessonMode: 'online',
                message: 'Send this to both inboxes.'
            }),
            env: {
                RESEND_API_KEY: 'test-key',
                CONTACT_TO_EMAIL: 'owner@example.com, academy@example.com'
            }
        });
        const sentPayload = JSON.parse(fetchCalls[0][1].body);

        assert.equal(response.status, 200);
        assert.deepEqual(sentPayload.to, ['owner@example.com', 'academy@example.com']);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('contact API tolerates env-style CONTACT_TO_EMAIL values from dashboard mistakes', async () => {
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
                phone: '010-0000-0000',
                email: 'student@example.com',
                course: 'jpop',
                lessonMode: 'online',
                message: 'Dashboard value included the key name.'
            }),
            env: {
                RESEND_API_KEY: 'test-key',
                CONTACT_TO_EMAIL: 'CONTACT_TO_EMAIL=smarty1558@gmail.com, omusinform@gmail.com'
            }
        });
        const sentPayload = JSON.parse(fetchCalls[0][1].body);

        assert.equal(response.status, 200);
        assert.deepEqual(sentPayload.to, ['smarty1558@gmail.com', 'omusinform@gmail.com']);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
