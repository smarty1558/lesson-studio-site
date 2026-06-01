import {
    readJson,
    sendFailure,
    sendSuccess
} from '../_shared/portfolio-utils.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultContactEmail = 'smarty1558@gmail.com';

const normalizeContactPayload = (payload = {}) => ({
    name: String(payload.name || '').trim(),
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    course: String(payload.course || '').trim(),
    lessonMode: String(payload.lessonMode || '').trim(),
    message: String(payload.message || '').trim(),
    portfolioInterest: String(payload.portfolioInterest || '').trim()
});

const buildContactEmailText = (payload) => [
    '[오타쿠 뮤직 스튜디오 상담 문의]',
    '',
    `이름: ${payload.name}`,
    `연락처: ${payload.phone}`,
    `이메일: ${payload.email}`,
    `희망 수업: ${payload.course}`,
    `수업 방식: ${payload.lessonMode}`,
    payload.portfolioInterest ? `이런 스타일 배우기: ${payload.portfolioInterest}` : '',
    '',
    '문의 내용:',
    payload.message
].filter((line) => line !== '').join('\n');

export const onRequestPost = async ({ request, env }) => {
    const payload = normalizeContactPayload(await readJson(request));

    if (!payload.name || !payload.phone || !payload.course || !payload.lessonMode || !payload.message) {
        return sendFailure('필수 상담 정보를 모두 입력해주세요.', 400);
    }

    if (!emailPattern.test(payload.email)) {
        return sendFailure('답장을 받을 수 있는 이메일을 입력해주세요.', 400);
    }

    if (!env.RESEND_API_KEY) {
        return sendFailure('상담 메일 수신 설정이 아직 완료되지 않았습니다.', 503);
    }

    const toEmail = env.CONTACT_TO_EMAIL || defaultContactEmail;
    const fromEmail = env.CONTACT_FROM_EMAIL || 'Lesson Studio <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${env.RESEND_API_KEY}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            reply_to: payload.email,
            subject: `[오타쿠 뮤직 스튜디오 상담 문의] ${payload.name} - ${payload.course}`,
            text: buildContactEmailText(payload)
        })
    });

    if (!response.ok) {
        return sendFailure('상담 문의 메일 전송에 실패했습니다.', 502);
    }

    return sendSuccess({ message: '상담 신청이 접수되었습니다.' });
};

export const onRequestGet = () => sendFailure('지원하지 않는 요청입니다.', 405);
export const onRequestPut = () => sendFailure('지원하지 않는 요청입니다.', 405);
export const onRequestPatch = () => sendFailure('지원하지 않는 요청입니다.', 405);
export const onRequestDelete = () => sendFailure('지원하지 않는 요청입니다.', 405);
