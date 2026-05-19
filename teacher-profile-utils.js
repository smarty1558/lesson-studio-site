const splitList = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof value !== 'string') return [];

    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return splitList(parsed);
    } catch {
        // Comma-separated text is the CMS-friendly fallback.
    }

    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
};

export const normalizeTeacherProfilePayload = (payload = {}) => ({
    key: String(payload.key || '').trim(),
    name: String(payload.name || '').trim(),
    role: String(payload.role || '').trim(),
    imageUrl: String(payload.imageUrl || payload.image || '').trim(),
    summary: String(payload.summary || '').trim(),
    specialties: splitList(payload.specialties),
    works: splitList(payload.works),
    note: String(payload.note || '').trim(),
    sortOrder: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0
});

export const toPublicTeacherProfile = (row = {}) => {
    const imageUrl = row.image_url || row.imageUrl || row.image || '';

    return {
        key: row.key || '',
        name: row.name || '',
        role: row.role || '',
        image: imageUrl,
        imageUrl,
        summary: row.summary || '',
        specialties: splitList(row.specialties),
        works: splitList(row.works),
        note: row.note || '',
        sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0)
    };
};

export const mergeTeacherProfile = (base = {}, override = {}) => {
    const normalized = normalizeTeacherProfilePayload(override);
    const image = normalized.imageUrl || override.image || base.image || base.imageUrl || '';

    return {
        ...base,
        key: normalized.key || base.key || '',
        name: normalized.name || base.name || '',
        role: normalized.role || base.role || '',
        image,
        imageUrl: image,
        summary: normalized.summary || base.summary || '',
        specialties: normalized.specialties.length ? normalized.specialties : (base.specialties || []),
        works: normalized.works.length ? normalized.works : (base.works || []),
        note: normalized.note || base.note || '',
        sortOrder: normalized.sortOrder || base.sortOrder || 0
    };
};
