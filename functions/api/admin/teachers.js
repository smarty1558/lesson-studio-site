import {
    readJson,
    requireAdmin,
    requireDb,
    sendFailure,
    sendSuccess
} from '../../_shared/portfolio-utils.js';
import {
    normalizeTeacherProfilePayload,
    toPublicTeacherProfile
} from '../../../teacher-profile-utils.js';

const adminTeacherListSql = `
    SELECT key, name, role, image_url, summary, direction, specialties, works, note, sort_order
    FROM teacher_profiles
    ORDER BY sort_order ASC, key ASC
`;

export const onRequestGet = async ({ request, env }) => {
    try {
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const dbError = requireDb(env);
        if (dbError) return dbError;

        const result = await env.DB.prepare(adminTeacherListSql).all();

        return sendSuccess({
            items: (result.results || []).map(toPublicTeacherProfile)
        });
    } catch (error) {
        return sendFailure(error?.message || 'Could not load teacher profiles.', 500);
    }
};

export const onRequestPost = async ({ request, env }) => {
    try {
        const authError = requireAdmin(request, env);
        if (authError) return authError;

        const dbError = requireDb(env);
        if (dbError) return dbError;

        const body = await readJson(request);
        if (!body) return sendFailure('JSON body is required.', 400);

        const payload = normalizeTeacherProfilePayload(body);
        if (!payload.key || !payload.name) {
            return sendFailure('Teacher key and name are required.', 400);
        }

        const now = new Date().toISOString();

        await env.DB.prepare(`
            INSERT INTO teacher_profiles (
                key, name, role, image_url, summary, direction, specialties, works, note, sort_order, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                name = excluded.name,
                role = excluded.role,
                image_url = excluded.image_url,
                summary = excluded.summary,
                direction = excluded.direction,
                specialties = excluded.specialties,
                works = excluded.works,
                note = excluded.note,
                sort_order = excluded.sort_order,
                updated_at = excluded.updated_at
        `).bind(
            payload.key,
            payload.name,
            payload.role,
            payload.imageUrl,
            payload.summary,
            payload.direction,
            JSON.stringify(payload.specialties),
            JSON.stringify(payload.works),
            payload.note,
            payload.sortOrder,
            now
        ).run();

        return sendSuccess({
            item: {
                ...payload,
                image: payload.imageUrl,
                updatedAt: now
            }
        });
    } catch (error) {
        return sendFailure(error?.message || 'Could not save teacher profile.', 500);
    }
};

export const onRequestPut = () => sendFailure('Unsupported method.', 400);
export const onRequestPatch = () => sendFailure('Use POST to upsert teacher profiles.', 400);
export const onRequestDelete = () => sendFailure('Teacher profiles cannot be deleted here.', 400);
