import {
    readJson,
    sendFailure,
    sendSuccess
} from '../_shared/portfolio-utils.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeContactPayload = (payload = {}) => ({
    name: String(payload.name || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    course: String(payload.course || '').trim(),
    courseLabel: String(payload.courseLabel || '').trim(),
    lessonMode: String(payload.lessonMode || '').trim(),
    lessonModeLabel: String(payload.lessonModeLabel || '').trim(),
    teacher: String(payload.teacher || '').trim(),
    teacherLabel: String(payload.teacherLabel || '').trim(),
    message: String(payload.message || '').trim(),
    portfolioInterest: String(payload.portfolioInterest || '').trim()
});

const normalizeRecipientEmails = (value) => String(value || '')
    .replace(/^CONTACT_TO_EMAIL\s*=\s*/i, '')
    .split(/[;,]/)
    .map((email) => email.trim())
    .filter(Boolean);

const getContactDisplayValues = (payload) => ({
    course: payload.courseLabel || payload.course,
    lessonMode: payload.lessonModeLabel || payload.lessonMode,
    teacher: payload.teacher ? (payload.teacherLabel || payload.teacher) : '미선택',
    phone: payload.phone || '-'
});

const buildContactEmailText = (payload) => {
    const display = getContactDisplayValues(payload);

    return [
        '[오타쿠 뮤직 스튜디오 상담 문의]',
        '',
        `이름: ${payload.name}`,
        `연락처: ${display.phone}`,
        `이메일: ${payload.email}`,
        `희망 수업: ${display.course}`,
        `수업 방식: ${display.lessonMode}`,
        `희망 선생님: ${display.teacher}`,
        payload.portfolioInterest ? `이런 스타일 배우기: ${payload.portfolioInterest}` : '',
        '',
        '문의 내용:',
        payload.message
    ].filter((line) => line !== '').join('\n');
};

export const onRequestPost = async ({ request, env }) => {
    const payload = normalizeContactPayload(await readJson(request));

    if (!payload.name || !payload.course || !payload.lessonMode || !payload.message) {
        return sendFailure('필수 상담 정보를 모두 입력해주세요.', 400);
    }

    if (!emailPattern.test(payload.email)) {
        return sendFailure('답장을 받을 수 있는 이메일을 입력해주세요.', 400);
    }

    if (!env.RESEND_API_KEY) {
        return sendFailure('상담 메일 수신 설정이 아직 완료되지 않았습니다.', 503);
    }

    const toEmails = normalizeRecipientEmails(env.CONTACT_TO_EMAIL);
    if (!toEmails.length) {
        return sendFailure('상담 메일 수신 주소가 설정되지 않았습니다.', 503);
    }

    const display = getContactDisplayValues(payload);
    const fromEmail = env.CONTACT_FROM_EMAIL || 'Lesson Studio <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${env.RESEND_API_KEY}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            from: fromEmail,
            to: toEmails,
            reply_to: payload.email,
            subject: `[오타쿠 뮤직 스튜디오 상담 문의] ${payload.name} - ${display.course}`,
            text: buildContactEmailText(payload)
        })
    });

    if (!response.ok) {
        const resendError = await response.text().catch(() => '');
        console.error('Resend contact email failed', {
            status: response.status,
            to: toEmails,
            from: fromEmail,
            body: resendError
        });
        return sendFailure('상담 문의 메일 전송에 실패했습니다.', 502);
    }

    return sendSuccess({ message: '상담 신청이 접수되었습니다.' });
};

export const onRequestGet = () => sendFailure('지원하지 않는 요청입니다.', 405);
export const onRequestPut = () => sendFailure('지원하지 않는 요청입니다.', 405);
export const onRequestPatch = () => sendFailure('지원하지 않는 요청입니다.', 405);
export const onRequestDelete = () => sendFailure('지원하지 않는 요청입니다.', 405);
