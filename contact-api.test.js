import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestPost } from './functions/api/contact.js';
import { PYEONGTAEK_BOUNDARY } from './functions/_shared/pyeongtaek-boundary.js';
import { classifyPyeongtaekLocation } from './functions/_shared/geo-utils.js';

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

const TO_DEFAULT = 'smarty1558@gmail.com';
const TO_PYEONGTAEK = 'omusinform@gmail.com';
const baseEnv = {
    RESEND_API_KEY: 'test-key',
    CONTACT_TO_EMAIL: TO_DEFAULT,
    CONTACT_PYEONGTAEK_TO_EMAIL: TO_PYEONGTAEK
};

// Sends one inquiry with Resend replaced by a fake. Any request to another host fails the test.
const submitInquiry = async ({ geo, ipCity, env = baseEnv, omitGeo = false }) => {
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
        const body = {
            name: 'Visitor',
            email: 'visitor@example.com',
            course: 'jpop',
            lessonMode: 'online',
            message: 'Where am I?'
        };
        if (!omitGeo) body.geo = geo;
        const request = makeRequest(body);
        if (ipCity !== undefined) Object.defineProperty(request, 'cf', { value: { city: ipCity } });
        const response = await onRequestPost({ request, env });
        assert.equal(response.status, 200);
        assert.equal(calls.length, 1);
        return { sent: JSON.parse(calls[0].init.body), raw: calls[0].init.body };
    } finally {
        globalThis.fetch = originalFetch;
    }
};

const PYEONGTAEK_CENTER = { lat: 36.9921, lng: 127.1129, accuracy: 50 };
const SEOUL = { lat: 37.5665, lng: 126.978, accuracy: 50 };
const SUWON = { lat: 37.266, lng: 127.001, accuracy: 50 };

const expectTo = (result, address) => {
    assert.deepEqual(result.sent.to, [address]);
    assert.equal(result.sent.cc, undefined);
    assert.equal(result.sent.bcc, undefined);
};

test('browser location inside Pyeongtaek goes to the Pyeongtaek recipient even when the IP city differs', async () => {
    const result = await submitInquiry({ geo: PYEONGTAEK_CENTER, ipCity: 'Seoul' });
    expectTo(result, TO_PYEONGTAEK);
    assert.match(result.sent.text, /접속 지역: 평택시 \(브라우저 위치 기준\)/);
});

test('browser location outside Pyeongtaek goes to the default recipient even when the IP city is Pyeongtaek', async () => {
    for (const geo of [SEOUL, SUWON]) {
        const result = await submitInquiry({ geo, ipCity: 'Pyeongtaek' });
        expectTo(result, TO_DEFAULT);
        assert.match(result.sent.text, /접속 지역: 평택 외 \(브라우저 위치 기준\)/);
    }
});

test('without a browser location the IP city decides', async () => {
    expectTo(await submitInquiry({ omitGeo: true, ipCity: 'Pyeongtaek' }), TO_PYEONGTAEK);
    expectTo(await submitInquiry({ geo: null, ipCity: 'Pyeongtaek' }), TO_PYEONGTAEK);
    expectTo(await submitInquiry({ omitGeo: true, ipCity: 'Pyeongtaek-si' }), TO_PYEONGTAEK);
    expectTo(await submitInquiry({ omitGeo: true, ipCity: 'Seoul' }), TO_DEFAULT);
    expectTo(await submitInquiry({ omitGeo: true }), TO_DEFAULT);
});

test('invalid, low-accuracy or malformed coordinates are ignored and the IP city decides', async () => {
    const unusable = [
        { lat: 'x', lng: 127.1, accuracy: 10 },
        { lat: 36.99, lng: 127.1129 },
        { lat: 95, lng: 127.1, accuracy: 10 },
        { lat: 36.99, lng: 200, accuracy: 10 },
        { lat: 36.99, lng: 127.1129, accuracy: -5 },
        { lat: 36.99, lng: 127.1129, accuracy: 0 },
        { lat: null, lng: null, accuracy: null },
        { ...PYEONGTAEK_CENTER, accuracy: 20000 },
        { ...SEOUL, accuracy: 20000 },
        'pyeongtaek',
        42
    ];
    for (const geo of unusable) {
        expectTo(await submitInquiry({ geo, ipCity: 'Pyeongtaek' }), TO_PYEONGTAEK);
        expectTo(await submitInquiry({ geo, ipCity: 'Seoul' }), TO_DEFAULT);
    }
});

test('a fix whose accuracy circle crosses the boundary is ambiguous and the IP city decides', async () => {
    const [ax, ay] = PYEONGTAEK_BOUNDARY[0][0][100];
    const [bx, by] = PYEONGTAEK_BOUNDARY[0][0][101];
    const nearBoundary = { lng: (ax + bx) / 2, lat: (ay + by) / 2, accuracy: 2000 };

    assert.equal(classifyPyeongtaekLocation(nearBoundary), 'ambiguous');
    expectTo(await submitInquiry({ geo: nearBoundary, ipCity: 'Pyeongtaek' }), TO_PYEONGTAEK);
    expectTo(await submitInquiry({ geo: nearBoundary, ipCity: 'Seoul' }), TO_DEFAULT);
});

test('precise fixes on either side of the boundary are decided by the browser location', async () => {
    const ring = PYEONGTAEK_BOUNDARY[0][0];
    let checked = 0;
    for (let i = 0; i < ring.length - 1 && checked < 3; i += 40) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[i + 1];
        const nx = -(by - ay);
        const ny = bx - ax;
        const norm = Math.hypot(nx, ny);
        if (!norm) continue;
        // about 300 m to either side of the edge midpoint, 5 m accuracy
        const step = 0.003 / norm;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const sideA = { lng: mx + nx * step, lat: my + ny * step, accuracy: 5 };
        const sideB = { lng: mx - nx * step, lat: my - ny * step, accuracy: 5 };
        const a = classifyPyeongtaekLocation(sideA);
        const b = classifyPyeongtaekLocation(sideB);
        if (a === b || a === 'ambiguous' || b === 'ambiguous') continue;
        const inside = a === 'inside' ? sideA : sideB;
        const outside = a === 'inside' ? sideB : sideA;
        expectTo(await submitInquiry({ geo: inside, ipCity: 'Seoul' }), TO_PYEONGTAEK);
        expectTo(await submitInquiry({ geo: outside, ipCity: 'Pyeongtaek' }), TO_DEFAULT);
        checked += 1;
    }
    assert.ok(checked >= 1);
});

test('legacy special-applicant variables never redirect non-Pyeongtaek inquiries', async () => {
    const env = {
        ...baseEnv,
        CONTACT_SPECIAL_TO_EMAIL: TO_PYEONGTAEK,
        CONTACT_SPECIAL_FROM_EMAILS: 'visitor@example.com'
    };
    expectTo(await submitInquiry({ geo: SEOUL, ipCity: 'Seoul', env }), TO_DEFAULT);
    expectTo(await submitInquiry({ omitGeo: true, ipCity: 'Seoul', env }), TO_DEFAULT);
});

test('a client-supplied recipient or region flag is ignored', async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        calls.push(init);
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    };
    try {
        const request = makeRequest({
            name: 'Visitor',
            email: 'visitor@example.com',
            course: 'jpop',
            lessonMode: 'online',
            message: 'hi',
            to: TO_PYEONGTAEK,
            isPyeongtaek: true,
            geo: { ...SEOUL, pyeongtaek: true, to: TO_PYEONGTAEK }
        });
        await onRequestPost({ request, env: baseEnv });
        assert.deepEqual(JSON.parse(calls[0].body).to, [TO_DEFAULT]);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('coordinates are never written into the email', async () => {
    const result = await submitInquiry({ geo: PYEONGTAEK_CENTER, ipCity: 'Seoul' });
    assert.ok(!result.raw.includes('36.9921'));
    assert.ok(!result.raw.includes('127.1129'));
});

test('a Pyeongtaek visitor falls back to the default recipient when no Pyeongtaek recipient is configured', async () => {
    const env = { RESEND_API_KEY: 'test-key', CONTACT_TO_EMAIL: TO_DEFAULT };
    expectTo(await submitInquiry({ geo: PYEONGTAEK_CENTER, ipCity: 'Pyeongtaek', env }), TO_DEFAULT);
});

test('contact form asks for browser location with the agreed notice and never blocks submission', () => {
    const page = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
    assert.equal(page.match(/위치 기반 정보 확인/g).length, 1);
    assert.match(page, /navigator\.geolocation\.getCurrentPosition/);
    assert.match(page, /setTimeout\(\(\) => resolve\(null\), 10000\)/);
    assert.match(page, /\(\) => finish\(null\)/);
});
