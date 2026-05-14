import {
    adminListSql,
    normalizePortfolioPayload,
    readJson,
    requireAdmin,
    requireDb,
    sendFailure,
    sendSuccess,
    toAdminPortfolioItem
} from '../../_shared/portfolio-utils.js';

export const onRequestGet = async ({ request, env }) => {
    try {
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const dbError = requireDb(env);
        if (dbError) return dbError;

        const result = await env.DB.prepare(adminListSql).all();

        return sendSuccess({
            items: (result.results || []).map(toAdminPortfolioItem)
        });
    } catch (error) {
        return sendFailure(error?.message || '관리자 포트폴리오 목록을 불러오지 못했습니다.', 500);
    }
};

export const onRequestPost = async ({ request, env }) => {
    try {
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const dbError = requireDb(env);
        if (dbError) return dbError;

        const body = await readJson(request);
        if (!body) {
            return sendFailure('JSON 요청 본문이 필요합니다.', 400);
        }

        const payload = normalizePortfolioPayload(body);
        if (!payload.title) {
            return sendFailure('title은 필수입니다.', 400);
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(`
            INSERT INTO portfolio_items (
                id, title, description, category, date, image_url, audio_url,
                external_link, visible, sort_order, metadata, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            payload.title,
            payload.description,
            payload.category,
            payload.date,
            payload.imageUrl,
            payload.audioUrl,
            payload.externalLink,
            payload.visible ? 1 : 0,
            payload.sortOrder,
            JSON.stringify(payload.metadata || {}),
            now,
            now
        ).run();

        return sendSuccess({
            item: {
                id,
                ...payload,
                createdAt: now,
                updatedAt: now
            }
        });
    } catch (error) {
        return sendFailure(error?.message || '포트폴리오 항목을 저장하지 못했습니다.', 500);
    }
};

export const onRequestPut = () => sendFailure('지원하지 않는 요청입니다.', 400);
export const onRequestPatch = () => sendFailure('항목 id가 필요합니다.', 400);
export const onRequestDelete = () => sendFailure('항목 id가 필요합니다.', 400);
