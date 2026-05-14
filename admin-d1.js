const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const teacherOptions = [
    ['kim', '김정환'],
    ['lee', '이서윤'],
    ['han', '한유나'],
    ['cho', '조은오']
];

const targetOptions = [
    ['game', '게임 · 영화 OST'],
    ['anime', '애니메이션 BGM'],
    ['sound', 'Sound Design']
];

const apiJson = async (url, { password, method = 'GET', body } = {}) => {
    const headers = {
        'x-admin-password': password
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.error || '요청을 처리하지 못했습니다.');
    }

    return data;
};

const uploadFile = async ({ file, type, password }) => {
    if (!file || !file.size) return '';

    const body = new FormData();
    body.append('file', file);
    body.append('type', type);

    const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
            'x-admin-password': password
        },
        body
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.error || `${type} 업로드에 실패했습니다.`);
    }

    return data.url;
};

const emptyItem = {
    id: '',
    title: '',
    description: '',
    category: '',
    date: '',
    imageUrl: '',
    audioUrl: '',
    externalLink: '',
    visible: true,
    sortOrder: 0,
    metadata: {
        mediaType: 'Audio',
        format: '',
        youtubeUrl: '',
        imageUrlManual: '',
        audioUrlManual: '',
        targetKeys: [],
        teacherKeys: [],
        points: [],
        detail: ''
    }
};

const itemMetadata = (item = {}) => ({
    ...emptyItem.metadata,
    ...(item.metadata || {}),
    mediaType: item.mediaType || item.metadata?.mediaType || emptyItem.metadata.mediaType,
    format: item.format || item.metadata?.format || '',
    youtubeUrl: item.youtubeUrl || item.metadata?.youtubeUrl || '',
    targetKeys: item.targetKeys || item.metadata?.targetKeys || [],
    teacherKeys: item.teacherKeys || item.metadata?.teacherKeys || [],
    points: item.points || item.metadata?.points || [],
    detail: item.detail || item.metadata?.detail || item.description || ''
});

const toPayload = (item) => ({
    title: item.title || '',
    description: item.description || '',
    category: item.category || '',
    date: item.date || '',
    imageUrl: item.imageUrl || '',
    audioUrl: item.audioUrl || '',
    externalLink: item.externalLink || '',
    visible: item.visible !== false,
    sortOrder: Number(item.sortOrder || 0),
    metadata: item.metadata || {}
});

const checkedValues = (form, name) => Array.from(form.querySelectorAll(`[name="${name}"]:checked`))
    .map((input) => input.value);

const renderChecks = (name, options, selected = []) => options.map(([value, label]) => `
    <label class="admin-check">
        <input type="checkbox" name="${name}" value="${escapeHtml(value)}" ${selected.includes(value) ? 'checked' : ''}>
        <span>${escapeHtml(label)}</span>
    </label>
`).join('');

const readFormItem = (form) => {
    const formData = new FormData(form);
    const points = String(formData.get('points') || '')
        .split(',')
        .map((point) => point.trim())
        .filter(Boolean);
    const category = String(formData.get('category') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const imageUrlManual = String(formData.get('imageUrlManual') || '').trim();
    const audioUrlManual = String(formData.get('audioUrlManual') || '').trim();

    return {
        id: String(formData.get('id') || ''),
        title: String(formData.get('title') || '').trim(),
        description,
        category,
        date: String(formData.get('date') || '').trim(),
        imageUrl: imageUrlManual || String(formData.get('imageUrl') || '').trim(),
        audioUrl: audioUrlManual || String(formData.get('audioUrl') || '').trim(),
        externalLink: String(formData.get('externalLink') || '').trim(),
        visible: formData.get('visible') === 'on',
        sortOrder: Number(formData.get('sortOrder') || 0),
        metadata: {
            mediaType: String(formData.get('mediaType') || 'Project'),
            format: String(formData.get('format') || '').trim(),
            youtubeUrl: String(formData.get('youtubeUrl') || '').trim(),
            imageUrlManual,
            audioUrlManual,
            targetKeys: checkedValues(form, 'targetKeys'),
            teacherKeys: checkedValues(form, 'teacherKeys'),
            targetLabels: checkedValues(form, 'targetKeys').map((key) => targetOptions.find(([value]) => value === key)?.[1] || key),
            teacherNames: checkedValues(form, 'teacherKeys').map((key) => teacherOptions.find(([value]) => value === key)?.[1] || key),
            points,
            detail: description,
            legacyCategory: category
        }
    };
};

export const renderD1Admin = () => {
    document.body.classList.remove('is-loading');
    document.body.classList.add('site-ready', 'admin-page');
    document.querySelector('.intro-loader')?.remove();

    let adminPassword = '';
    let items = [];
    let editingItem = null;

    const setText = (selector, message, className = '') => {
        const target = document.querySelector(selector);
        if (!target) return;
        target.textContent = message;
        target.className = className || target.className;
    };

    const draw = () => {
        const item = editingItem || emptyItem;
        const meta = itemMetadata(item);
        const rows = items.length ? items.map((entry) => {
            const entryMeta = itemMetadata(entry);
            const targetText = entryMeta.targetLabels?.length ? entryMeta.targetLabels.join(' · ') : '표시 조건 없음';
            const teacherText = entryMeta.teacherNames?.length ? entryMeta.teacherNames.join(' · ') : '참여자 없음';

            return `
                <article class="admin-item admin-portfolio-row">
                    <div class="admin-portfolio-media">
                        ${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="">` : '<span>No Image</span>'}
                    </div>
                    <div class="admin-portfolio-body">
                        <span>${escapeHtml(entry.category || 'Uncategorized')} / ${entry.visible ? 'Visible' : 'Hidden'} / Sort ${Number(entry.sortOrder || 0)}</span>
                        <h3>${escapeHtml(entry.title)}</h3>
                        <p>${escapeHtml(entry.description || '')}</p>
                        <p>참여자: ${escapeHtml(teacherText)}</p>
                        <p>표시 클래스: ${escapeHtml(targetText)}</p>
                        <p>${escapeHtml(entry.date || 'No date')}</p>
                        ${entry.audioUrl ? `<audio controls src="${escapeHtml(entry.audioUrl)}"></audio>` : ''}
                        ${entryMeta.youtubeUrl ? `<a href="${escapeHtml(entryMeta.youtubeUrl)}" target="_blank" rel="noopener noreferrer">YouTube</a>` : ''}
                        ${entry.externalLink ? `<a href="${escapeHtml(entry.externalLink)}" target="_blank" rel="noopener noreferrer">External link</a>` : ''}
                    </div>
                    <div class="admin-portfolio-actions">
                        <button type="button" data-edit-id="${escapeHtml(entry.id)}">수정</button>
                        <button type="button" data-toggle-id="${escapeHtml(entry.id)}">${entry.visible ? '숨김' : '표시'}</button>
                        <button type="button" data-delete-id="${escapeHtml(entry.id)}">삭제</button>
                    </div>
                </article>
            `;
        }).join('') : '<p class="admin-empty">등록된 포트폴리오가 없습니다.</p>';

        document.body.innerHTML = `
            <main class="admin-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 관리</h1>
                        <p>기존 CMS 표시 조건은 유지하고, 이미지와 오디오는 R2에 업로드한 뒤 D1에 저장합니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트로 돌아가기</a>
                </header>

                <section class="admin-panel admin-auth-panel">
                    <label>관리자 비밀번호
                        <input id="admin-password" type="password" value="${escapeHtml(adminPassword)}" autocomplete="current-password" placeholder="ADMIN_PASSWORD">
                    </label>
                    <button type="button" class="admin-primary" data-load-admin>목록 불러오기</button>
                    <p class="admin-status" aria-live="polite"></p>
                </section>

                <section class="admin-layout">
                    <form id="d1-portfolio-form" class="admin-panel">
                        <h2>${item.id ? '포트폴리오 수정' : '작품 등록'}</h2>
                        <input type="hidden" name="id" value="${escapeHtml(item.id)}">
                        <input type="hidden" name="imageUrl" value="${escapeHtml(item.imageUrl)}">
                        <input type="hidden" name="audioUrl" value="${escapeHtml(item.audioUrl)}">

                        <div class="admin-grid">
                            <label>제목
                                <input name="title" required value="${escapeHtml(item.title)}" placeholder="예: 조이고">
                            </label>
                            <label>장르 / 카테고리
                                <input name="category" value="${escapeHtml(item.category)}" placeholder="예: Game BGM, Anime, J-POP">
                            </label>
                            <label>날짜
                                <input type="date" name="date" value="${escapeHtml(item.date)}">
                            </label>
                            <label>정렬 순서
                                <input type="number" name="sortOrder" value="${Number(item.sortOrder || 0)}">
                            </label>

                            <div class="admin-field admin-field-wide">
                                <span>참여자</span>
                                <div class="admin-checks">${renderChecks('teacherKeys', teacherOptions, meta.teacherKeys)}</div>
                            </div>
                            <div class="admin-field admin-field-wide">
                                <span>표시될 클래스</span>
                                <div class="admin-checks">${renderChecks('targetKeys', targetOptions, meta.targetKeys)}</div>
                            </div>

                            <label>프리뷰 종류
                                <select name="mediaType">
                                    ${['Audio', 'Video', 'Project'].map((value) => `<option value="${value}" ${meta.mediaType === value ? 'selected' : ''}>${value}</option>`).join('')}
                                </select>
                            </label>
                            <label>표시 형식
                                <input name="format" value="${escapeHtml(meta.format)}" placeholder="예: YouTube Preview / Audio Preview">
                            </label>
                            <label>이미지 파일 업로드
                                <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/avif">
                            </label>
                            <label>오디오 파일 업로드
                                <input type="file" name="audioFile" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/wave,audio/x-wav,.mp3,.m4a,.wav">
                            </label>
                            <label>이미지 URL
                                <input name="imageUrlManual" value="${escapeHtml(meta.imageUrlManual || item.imageUrl)}" placeholder="./joygo_jpop_hero.png 또는 R2 URL">
                            </label>
                            <label>Audio URL
                                <input name="audioUrlManual" value="${escapeHtml(meta.audioUrlManual || item.audioUrl)}" placeholder="https://.../demo.mp3">
                            </label>
                            <label>YouTube URL
                                <input name="youtubeUrl" value="${escapeHtml(meta.youtubeUrl)}" placeholder="https://youtube.com/...">
                            </label>
                            <label>외부 링크
                                <input name="externalLink" value="${escapeHtml(item.externalLink)}" placeholder="SoundCloud, Drive, 음원 링크">
                            </label>
                            <label class="admin-field-wide">상세 설명
                                <textarea name="description" rows="5" placeholder="작업 의도, 담당 파트, 수업에서 보여주고 싶은 포인트를 적어주세요.">${escapeHtml(item.description || meta.detail)}</textarea>
                            </label>
                            <label class="admin-field-wide">제작 포인트
                                <input name="points" value="${escapeHtml((meta.points || []).join(', '))}" placeholder="쉼표로 구분: 루프 설계, 보스전 전개, 믹싱">
                            </label>
                            <label class="admin-check admin-visible-check">
                                <input type="checkbox" name="visible" ${item.visible ? 'checked' : ''}>
                                <span>공개 표시</span>
                            </label>
                        </div>

                        <div class="admin-current-media">
                            ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="Current image">` : ''}
                            ${item.audioUrl ? `<audio controls src="${escapeHtml(item.audioUrl)}"></audio>` : ''}
                        </div>

                        <p class="admin-help">저장 순서: 이미지 파일 업로드 -> 오디오 파일 업로드 -> CMS 조건과 URL을 D1에 저장 -> 목록 새로고침.</p>
                        <button type="submit" class="admin-primary">${item.id ? '수정 저장' : '포트폴리오 저장'}</button>
                        ${item.id ? '<button type="button" class="admin-link" data-cancel-edit>새 항목 작성</button>' : ''}
                        <p class="admin-form-status" aria-live="polite"></p>
                    </form>

                    <aside class="admin-panel">
                        <h2>등록된 작품</h2>
                        <div class="admin-list">${rows}</div>
                    </aside>
                </section>
            </main>
        `;

        bindEvents();
    };

    const loadItems = async () => {
        adminPassword = document.getElementById('admin-password')?.value || adminPassword;
        setText('.admin-status', '목록을 불러오는 중...', 'admin-status');
        const data = await apiJson('/api/admin/portfolio', { password: adminPassword });
        items = data.items || [];
        editingItem = editingItem ? items.find((entry) => entry.id === editingItem.id) || null : null;
        draw();
        setText('.admin-status', '목록을 불러왔습니다.', 'admin-status admin-upload-success');
    };

    const saveForm = async (form) => {
        const formData = new FormData(form);
        const imageFile = formData.get('imageFile');
        const audioFile = formData.get('audioFile');
        const status = form.querySelector('.admin-form-status');
        adminPassword = document.getElementById('admin-password')?.value || adminPassword;

        if (!adminPassword) {
            status.textContent = '관리자 비밀번호를 먼저 입력하세요.';
            status.className = 'admin-form-status admin-upload-error';
            return;
        }

        const nextItem = readFormItem(form);
        if (!nextItem.title) {
            status.textContent = '제목은 필수입니다.';
            status.className = 'admin-form-status admin-upload-error';
            return;
        }

        status.textContent = '선택한 파일을 업로드하는 중...';
        status.className = 'admin-form-status';

        const imageUrl = await uploadFile({
            file: imageFile,
            type: 'image',
            password: adminPassword
        }) || nextItem.imageUrl;
        const audioUrl = await uploadFile({
            file: audioFile,
            type: 'audio',
            password: adminPassword
        }) || nextItem.audioUrl;

        status.textContent = 'D1에 저장하는 중...';
        const payload = toPayload({
            ...nextItem,
            imageUrl,
            audioUrl,
            metadata: {
                ...nextItem.metadata,
                imageUrlManual: nextItem.metadata.imageUrlManual || imageUrl,
                audioUrlManual: nextItem.metadata.audioUrlManual || audioUrl
            }
        });

        await apiJson(nextItem.id ? `/api/admin/portfolio/${encodeURIComponent(nextItem.id)}` : '/api/admin/portfolio', {
            password: adminPassword,
            method: nextItem.id ? 'PATCH' : 'POST',
            body: payload
        });

        editingItem = null;
        await loadItems();
    };

    const bindEvents = () => {
        document.querySelector('[data-load-admin]')?.addEventListener('click', async () => {
            try {
                await loadItems();
            } catch (error) {
                setText('.admin-status', error.message, 'admin-status admin-upload-error');
            }
        });

        document.getElementById('d1-portfolio-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await saveForm(event.currentTarget);
            } catch (error) {
                const status = event.currentTarget.querySelector('.admin-form-status');
                status.textContent = error.message;
                status.className = 'admin-form-status admin-upload-error';
            }
        });

        document.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
            editingItem = null;
            draw();
        });

        document.querySelectorAll('[data-edit-id]').forEach((button) => {
            button.addEventListener('click', () => {
                editingItem = items.find((entry) => entry.id === button.dataset.editId) || null;
                draw();
            });
        });

        document.querySelectorAll('[data-toggle-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                const item = items.find((entry) => entry.id === button.dataset.toggleId);
                if (!item) return;

                try {
                    await apiJson(`/api/admin/portfolio/${encodeURIComponent(item.id)}`, {
                        password: adminPassword,
                        method: 'PATCH',
                        body: toPayload({ ...item, metadata: itemMetadata(item), visible: !item.visible })
                    });
                    await loadItems();
                } catch (error) {
                    setText('.admin-status', error.message, 'admin-status admin-upload-error');
                }
            });
        });

        document.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                if (!confirm('이 포트폴리오 항목을 삭제할까요?')) return;

                try {
                    await apiJson(`/api/admin/portfolio/${encodeURIComponent(button.dataset.deleteId)}`, {
                        password: adminPassword,
                        method: 'DELETE'
                    });
                    await loadItems();
                } catch (error) {
                    setText('.admin-status', error.message, 'admin-status admin-upload-error');
                }
            });
        });
    };

    draw();
};
