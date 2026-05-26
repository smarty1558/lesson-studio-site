export const uploadRules = {
    image: {
        prefix: 'portfolio/images/',
        maxSize: 10 * 1024 * 1024,
        mimeToExtension: {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/avif': 'avif'
        },
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'avif']
    },
    audio: {
        prefix: 'portfolio/audio/',
        maxSize: 30 * 1024 * 1024,
        mimeToExtension: {
            'audio/mpeg': 'mp3',
            'audio/mp3': 'mp3',
            'audio/mp4': 'm4a',
            'audio/x-m4a': 'm4a',
            'audio/wav': 'wav',
            'audio/wave': 'wav',
            'audio/x-wav': 'wav'
        },
        allowedExtensions: ['mp3', 'm4a', 'wav']
    }
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    }
});

export const failure = (error, status = 400) => json({
    success: false,
    error
}, status);

export const success = (payload) => json({
    success: true,
    ...payload
});

export const getOriginalExtension = (fileName = '') => {
    const extension = String(fileName).split('.').pop()?.toLowerCase() || '';
    return /^[a-z0-9]+$/.test(extension) ? extension : '';
};

export const getSafeOriginalName = (fileName = '') => {
    const rawName = String(fileName || '').split(/[\\/]/).pop() || 'file';
    const withoutExtension = rawName.replace(/\.[^.]+$/, '');
    const safeName = withoutExtension
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9가-힣._-]+/g, '-')
        .replace(/[-_.]{2,}/g, '-')
        .replace(/^[-_.]+|[-_.]+$/g, '')
        .slice(0, 80);

    return safeName || 'file';
};

export const validateUploadInput = ({ file, type }) => {
    const normalizedType = String(type || '').trim().toLowerCase();
    const rules = uploadRules[normalizedType];

    if (!rules) {
        return { ok: false, status: 400, error: 'type은 image 또는 audio여야 합니다.' };
    }

    if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function') {
        return { ok: false, status: 400, error: 'file 필드가 필요합니다.' };
    }

    if (!file.size) {
        return { ok: false, status: 400, error: '빈 파일은 업로드할 수 없습니다.' };
    }

    if (file.size > rules.maxSize) {
        return { ok: false, status: 413, error: normalizedType === 'image' ? '이미지는 최대 10MB까지 업로드할 수 있습니다.' : '오디오는 최대 30MB까지 업로드할 수 있습니다.' };
    }

    const mimeType = String(file.type || '').toLowerCase();
    const extensionFromMime = rules.mimeToExtension[mimeType];

    if (!extensionFromMime) {
        return { ok: false, status: 400, error: '허용되지 않는 MIME type입니다.' };
    }

    const originalExtension = getOriginalExtension(file.name);
    if (originalExtension && !rules.allowedExtensions.includes(originalExtension)) {
        return { ok: false, status: 400, error: '허용되지 않는 파일 확장자입니다.' };
    }

    return {
        ok: true,
        type: normalizedType,
        mimeType,
        extension: extensionFromMime,
        prefix: rules.prefix
    };
};

export const createObjectKey = ({ prefix, extension, randomUUID = () => crypto.randomUUID() }) => {
    const id = randomUUID().replace(/[^a-f0-9-]/gi, '');
    return `${prefix}${id}.${extension}`;
};

export const createReadableObjectKey = ({
    prefix,
    extension,
    originalName,
    randomUUID = () => crypto.randomUUID()
}) => {
    const id = randomUUID().replace(/[^a-f0-9-]/gi, '');
    const safeName = getSafeOriginalName(originalName);
    return `${prefix}${id}-${safeName}.${extension}`;
};

export const getAdminPasswordFromRequest = (request) => {
    const directPassword = request.headers.get('x-admin-password') || '';
    const authorization = request.headers.get('authorization') || '';
    const bearerPassword = authorization.toLowerCase().startsWith('bearer ')
        ? authorization.slice(7)
        : '';

    return directPassword || bearerPassword;
};

export const buildPublicUrl = (baseUrl, key) => `${String(baseUrl || '').replace(/\/+$/, '')}/${key}`;
