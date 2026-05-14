import {
    failure,
    getAdminPasswordFromRequest,
    success
} from './upload-utils.js';

const parseMetadata = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;

    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

export const toPublicPortfolioItem = (row = {}) => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    desc: row.description || '',
    category: row.category || '',
    mediaType: parseMetadata(row.metadata).mediaType || row.category || '',
    format: parseMetadata(row.metadata).format || '',
    date: row.date || '',
    imageUrl: row.image_url || '',
    img: row.image_url || '',
    audioUrl: row.audio_url || '',
    externalLink: row.external_link || '',
    externalUrl: row.external_link || '',
    visible: row.visible === 1 || row.visible === true,
    sortOrder: Number(row.sort_order || 0),
    metadata: parseMetadata(row.metadata),
    ...parseMetadata(row.metadata)
});

export const toAdminPortfolioItem = (row = {}) => ({
    ...toPublicPortfolioItem(row),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
});

export const normalizePortfolioPayload = (payload = {}) => ({
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    category: String(payload.category || '').trim(),
    date: String(payload.date || '').trim(),
    imageUrl: String(payload.imageUrl || '').trim(),
    audioUrl: String(payload.audioUrl || '').trim(),
    externalLink: String(payload.externalLink || '').trim(),
    visible: payload.visible !== false,
    sortOrder: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
    metadata: parseMetadata(payload.metadata)
});

export const requireAdmin = (request, env) => {
    if (!env.ADMIN_PASSWORD) {
        return failure('ADMIN_PASSWORD 환경변수가 설정되어 있지 않습니다.', 500);
    }

    if (getAdminPasswordFromRequest(request) !== env.ADMIN_PASSWORD) {
        return failure('관리자 인증에 실패했습니다.', 401);
    }

    return null;
};

export const requireDb = (env) => {
    if (!env.DB) {
        return failure('DB D1 binding이 설정되어 있지 않습니다.', 500);
    }

    return null;
};

export const readJson = async (request) => {
    try {
        return await request.json();
    } catch {
        return null;
    }
};

export const publicListSql = `
    SELECT id, title, description, category, date, image_url, audio_url, external_link, visible, sort_order, metadata
    FROM portfolio_items
    WHERE visible = 1
    ORDER BY sort_order ASC, created_at DESC
`;

export const adminListSql = `
    SELECT id, title, description, category, date, image_url, audio_url, external_link, visible, sort_order, metadata, created_at, updated_at
    FROM portfolio_items
    ORDER BY sort_order ASC, created_at DESC
`;

export const sendSuccess = success;
export const sendFailure = failure;
