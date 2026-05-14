import {
    publicListSql,
    requireDb,
    sendFailure,
    sendSuccess,
    toPublicPortfolioItem
} from '../_shared/portfolio-utils.js';

export const onRequestGet = async ({ env }) => {
    try {
        const dbError = requireDb(env);
        if (dbError) return dbError;

        const result = await env.DB.prepare(publicListSql).all();

        return sendSuccess({
            items: (result.results || []).map(toPublicPortfolioItem)
        });
    } catch (error) {
        return sendFailure(error?.message || '포트폴리오 목록을 불러오지 못했습니다.', 500);
    }
};

export const onRequestPost = () => sendFailure('관리자 API를 사용해 주세요.', 400);
export const onRequestPut = () => sendFailure('지원하지 않는 요청입니다.', 400);
export const onRequestPatch = () => sendFailure('지원하지 않는 요청입니다.', 400);
export const onRequestDelete = () => sendFailure('지원하지 않는 요청입니다.', 400);
