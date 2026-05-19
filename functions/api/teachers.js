import {
    requireDb,
    sendFailure,
    sendSuccess
} from '../_shared/portfolio-utils.js';
import { toPublicTeacherProfile } from '../../teacher-profile-utils.js';

export const onRequestGet = async ({ env }) => {
    try {
        const dbError = requireDb(env);
        if (dbError) return dbError;

        const result = await env.DB.prepare(`
            SELECT key, name, role, image_url, summary, specialties, works, note, sort_order
            FROM teacher_profiles
            ORDER BY sort_order ASC, key ASC
        `).all();

        return sendSuccess({
            items: (result.results || []).map(toPublicTeacherProfile)
        });
    } catch (error) {
        return sendFailure(error?.message || 'Could not load teacher profiles.', 500);
    }
};

export const onRequestPost = () => sendFailure('Admin API required.', 400);
export const onRequestPut = () => sendFailure('Unsupported method.', 400);
export const onRequestPatch = () => sendFailure('Unsupported method.', 400);
export const onRequestDelete = () => sendFailure('Unsupported method.', 400);
