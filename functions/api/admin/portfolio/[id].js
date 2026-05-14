import {
    normalizePortfolioPayload,
    readJson,
    requireAdmin,
    requireDb,
    sendFailure,
    sendSuccess
} from '../../../_shared/portfolio-utils.js';

export const onRequestPatch = async ({ request, env, params }) => {
    try {
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const dbError = requireDb(env);
        if (dbError) return dbError;

        const id = params.id;
        if (!id) {
            return sendFailure('항목 id가 필요합니다.', 400);
        }

        const body = await readJson(request);
        if (!body) {
            return sendFailure('JSON 요청 본문이 필요합니다.', 400);
        }

        const payload = normalizePortfolioPayload(body);
        if (!payload.title) {
            return sendFailure('title은 필수입니다.', 400);
        }

        const now = new Date().toISOString();
        const result = await env.DB.prepare(`
            UPDATE portfolio_items
            SET title = ?,
                description = ?,
                category = ?,
                date = ?,
                image_url = ?,
                audio_url = ?,
                external_link = ?,
                visible = ?,
                sort_order = ?,
                updated_at = ?
            WHERE id = ?
        `).bind(
            payload.title,
            payload.description,
            payload.category,
            payload.date,
            payload.imageUrl,
            payload.audioUrl,
            payload.externalLink,
            payload.visible ? 1 : 0,
            payload.sortOrder,
            now,
            id
        ).run();

        if (result.meta?.changes === 0) {
            return sendFailure('수정할 항목을 찾지 못했습니다.', 404);
        }

        return sendSuccess({
            item: {
                id,
                ...payload,
                updatedAt: now
            }
        });
    } catch (error) {
        return sendFailure(error?.message || '포트폴리오 항목을 수정하지 못했습니다.', 500);
    }
};

export const onRequestDelete = async ({ request, env, params }) => {
    try {
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const dbError = requireDb(env);
        if (dbError) return dbError;

        const id = params.id;
        if (!id) {
            return sendFailure('항목 id가 필요합니다.', 400);
        }

        const result = await env.DB.prepare('DELETE FROM portfolio_items WHERE id = ?').bind(id).run();

        if (result.meta?.changes === 0) {
            return sendFailure('삭제할 항목을 찾지 못했습니다.', 404);
        }

        return sendSuccess({ id });
    } catch (error) {
        return sendFailure(error?.message || '포트폴리오 항목을 삭제하지 못했습니다.', 500);
    }
};

export const onRequestGet = () => sendFailure('지원하지 않는 요청입니다.', 400);
export const onRequestPost = () => sendFailure('지원하지 않는 요청입니다.', 400);
export const onRequestPut = () => sendFailure('지원하지 않는 요청입니다.', 400);
