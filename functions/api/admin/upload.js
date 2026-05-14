import {
    buildPublicUrl,
    createReadableObjectKey,
    failure,
    getAdminPasswordFromRequest,
    success,
    validateUploadInput
} from '../../_shared/upload-utils.js';

export const onRequestPost = async ({ request, env }) => {
    try {
        if (!env.ADMIN_PASSWORD) {
            return failure('ADMIN_PASSWORD 환경변수가 설정되어 있지 않습니다.', 500);
        }

        if (getAdminPasswordFromRequest(request) !== env.ADMIN_PASSWORD) {
            return failure('관리자 인증에 실패했습니다.', 401);
        }

        if (!env.PORTFOLIO_BUCKET) {
            return failure('PORTFOLIO_BUCKET R2 binding이 설정되어 있지 않습니다.', 500);
        }

        if (!env.R2_PUBLIC_URL) {
            return failure('R2_PUBLIC_URL 환경변수가 설정되어 있지 않습니다.', 500);
        }

        if (!String(request.headers.get('content-type') || '').toLowerCase().includes('multipart/form-data')) {
            return failure('multipart/form-data 요청만 업로드할 수 있습니다.', 400);
        }

        let formData;
        try {
            formData = await request.formData();
        } catch {
            return failure('multipart/form-data 형식이 올바르지 않습니다.', 400);
        }

        const file = formData.get('file');
        const type = formData.get('type');
        const validation = validateUploadInput({ file, type });

        if (!validation.ok) {
            return failure(validation.error, validation.status);
        }

        const key = createReadableObjectKey({
            prefix: validation.prefix,
            extension: validation.extension,
            originalName: file.name
        });

        await env.PORTFOLIO_BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: validation.mimeType
            }
        });

        return success({
            url: buildPublicUrl(env.R2_PUBLIC_URL, key),
            key,
            type: validation.type
        });
    } catch (error) {
        return failure(error?.message || '업로드 처리 중 오류가 발생했습니다.', 500);
    }
};

export const onRequestGet = () => failure('POST 요청만 사용할 수 있습니다.', 400);
export const onRequestPut = () => failure('POST 요청만 사용할 수 있습니다.', 400);
export const onRequestPatch = () => failure('POST 요청만 사용할 수 있습니다.', 400);
export const onRequestDelete = () => failure('POST 요청만 사용할 수 있습니다.', 400);
