import {
    buildPublicUrl,
    failure,
    getAdminPasswordFromRequest,
    success,
    uploadRules
} from '../../_shared/upload-utils.js';

const fileTypeLabels = {
    image: 'image',
    audio: 'audio'
};

export const onRequestGet = async ({ request, env }) => {
    try {
        if (!env.ADMIN_PASSWORD) {
            return failure('ADMIN_PASSWORD environment variable is not configured.', 500);
        }

        if (getAdminPasswordFromRequest(request) !== env.ADMIN_PASSWORD) {
            return failure('Admin authentication failed.', 401);
        }

        if (!env.PORTFOLIO_BUCKET) {
            return failure('PORTFOLIO_BUCKET R2 binding is not configured.', 500);
        }

        if (!env.R2_PUBLIC_URL) {
            return failure('R2_PUBLIC_URL environment variable is not configured.', 500);
        }

        const url = new URL(request.url);
        const type = String(url.searchParams.get('type') || '').trim().toLowerCase();
        const rules = uploadRules[type];

        if (!rules) {
            return failure('type must be image or audio.', 400);
        }

        const cursor = url.searchParams.get('cursor') || undefined;
        const listed = await env.PORTFOLIO_BUCKET.list({
            prefix: rules.prefix,
            cursor,
            limit: 100
        });

        return success({
            type: fileTypeLabels[type],
            cursor: listed.cursor || '',
            truncated: Boolean(listed.truncated),
            files: (listed.objects || []).map((object) => ({
                key: object.key,
                url: buildPublicUrl(env.R2_PUBLIC_URL, object.key),
                size: object.size || 0,
                uploaded: object.uploaded ? new Date(object.uploaded).toISOString() : ''
            }))
        });
    } catch (error) {
        return failure(error?.message || 'Failed to list R2 files.', 500);
    }
};

export const onRequestPost = () => failure('GET requests only.', 400);
export const onRequestPut = () => failure('GET requests only.', 400);
export const onRequestPatch = () => failure('GET requests only.', 400);
export const onRequestDelete = () => failure('GET requests only.', 400);
