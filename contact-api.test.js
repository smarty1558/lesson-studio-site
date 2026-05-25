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
            message: ''
        }),
        env: {}
    });
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
});

test('contact API sends inquiry email to the site owner by default', async () => {
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
                message: 'I want to ask about vocal direction.',
                portfolioInterest: 'Sugar Rush Opening'
            }),
            env: {
                RESEND_API_KEY: 'test-key',
                CONTACT_FROM_EMAIL: 'OSUM <contact@example.com>'
            }
        });
        const json = await response.json();
        const sentPayload = JSON.parse(fetchCalls[0][1].body);

        assert.equal(response.status, 200);
        assert.equal(json.success, true);
        assert.equal(fetchCalls[0][0], 'https://api.resend.com/emails');
        assert.equal(sentPayload.to[0], 'smarty1558@gmail.com');
        assert.equal(sentPayload.reply_to, 'student@example.com');
        assert.match(sentPayload.text, /이름: Kim/);
        assert.match(sentPayload.text, /연락처: 010-0000-0000/);
        assert.match(sentPayload.text, /이메일: student@example.com/);
        assert.match(sentPayload.text, /희망 수업: jpop/);
        assert.match(sentPayload.text, /I want to ask about vocal direction/);
        assert.match(sentPayload.text, /이런 스타일 배우기: Sugar Rush Opening/);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
