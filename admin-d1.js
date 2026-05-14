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

const labelFor = (options, key) => options.find(([value]) => value === key)?.[1] || key;

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

const fetchR2Files = async ({ type, password, cursor = '' }) => {
    const params = new URLSearchParams({ type });
    if (cursor) params.set('cursor', cursor);
    return apiJson(`/api/admin/files?${params.toString()}`, { password });
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
        targetLabels: [],
        teacherNames: [],
        points: [],
        detail: ''
    }
};

const createDraftItem = () => ({
    ...emptyItem,
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    isDraft: true,
    metadata: { ...emptyItem.metadata }
});

const itemMetadata = (item = {}) => ({
    ...emptyItem.metadata,
    ...(item.metadata || {}),
    mediaType: item.mediaType || item.metadata?.mediaType || emptyItem.metadata.mediaType,
    format: item.format || item.metadata?.format || '',
    youtubeUrl: item.youtubeUrl || item.metadata?.youtubeUrl || '',
    targetKeys: item.targetKeys || item.metadata?.targetKeys || [],
    teacherKeys: item.teacherKeys || item.metadata?.teacherKeys || [],
    targetLabels: item.targetLabels || item.metadata?.targetLabels || [],
    teacherNames: item.teacherNames || item.metadata?.teacherNames || [],
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

const chips = (values = [], options = []) => {
    if (!values.length) return '<span class="admin-muted">-</span>';

    return values.map((value) => `<span class="admin-chip">${escapeHtml(labelFor(options, value))}</span>`).join('');
};

const truncate = (value = '', length = 72) => {
    const text = String(value || '').trim();
    return text.length > length ? `${text.slice(0, length)}...` : text;
};

const formatFileSize = (size = 0) => {
    const value = Number(size || 0);
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
    if (value >= 1024) return `${Math.round(value / 1024)} KB`;
    return `${value} B`;
};

const readFormItem = (form) => {
    const formData = new FormData(form);
    const points = String(formData.get('points') || '')
        .split(',')
        .map((point) => point.trim())
        .filter(Boolean);
    const category = String(formData.get('category') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const detail = String(formData.get('detail') || '').trim();
    const imageUrlManual = String(formData.get('imageUrlManual') || '').trim();
    const audioUrlManual = String(formData.get('audioUrlManual') || '').trim();
    const targetKeys = checkedValues(form, 'targetKeys');
    const teacherKeys = checkedValues(form, 'teacherKeys');

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
            targetKeys,
            teacherKeys,
            targetLabels: targetKeys.map((key) => labelFor(targetOptions, key)),
            teacherNames: teacherKeys.map((key) => labelFor(teacherOptions, key)),
            points,
            detail,
            legacyCategory: category
        }
    };
};

export const renderD1Admin = () => {
    document.body.classList.remove('is-loading');
    document.body.classList.add('site-ready', 'admin-page');
    document.querySelector('.intro-loader')?.remove();

    let adminPassword = '';
    let unlocked = false;
    let items = [];
    let editingItem = null;

    const setText = (selector, message, className = '') => {
        const target = document.querySelector(selector);
        if (!target) return;
        target.textContent = message;
        target.className = className || target.className;
    };

    const closeFilePicker = () => {
        document.querySelector('.admin-file-picker-backdrop')?.remove();
    };

    const renderFilePicker = ({ type, targetName, files = [], cursor = '', truncated = false, loading = false, error = '' }) => {
        const title = type === 'image' ? 'R2 image files' : 'R2 audio files';
        const rows = files.length
            ? files.map((file) => `
                <button type="button" class="admin-file-row" data-select-file-url="${escapeHtml(file.url)}" data-target-input="${escapeHtml(targetName)}">
                    <span class="admin-file-preview">
                        ${type === 'image' ? `<img src="${escapeHtml(file.url)}" alt="">` : '<span>Audio</span>'}
                    </span>
                    <span class="admin-file-info">
                        <strong title="${escapeHtml(file.key)}">${escapeHtml(file.key.replace(/^portfolio\/(images|audio)\//, ''))}</strong>
                        <small>${escapeHtml(formatFileSize(file.size))}${file.uploaded ? ` - ${escapeHtml(file.uploaded.slice(0, 10))}` : ''}</small>
                    </span>
                </button>
            `).join('')
            : `<p class="admin-table-empty">${loading ? 'R2 files loading...' : 'No files in this R2 folder.'}</p>`;

        closeFilePicker();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="admin-file-picker-backdrop" role="dialog" aria-modal="true">
                <section class="admin-panel admin-file-picker">
                    <div class="admin-editor-head">
                        <div>
                            <span>R2 Library</span>
                            <h2>${title}</h2>
                        </div>
                        <button type="button" class="admin-link" data-close-file-picker>Close</button>
                    </div>
                    ${error ? `<p class="admin-upload-error">${escapeHtml(error)}</p>` : ''}
                    <div class="admin-file-list">${rows}</div>
                    ${truncated ? `<button type="button" class="admin-secondary" data-load-more-files data-file-type="${escapeHtml(type)}" data-target-input="${escapeHtml(targetName)}" data-cursor="${escapeHtml(cursor)}">Load more</button>` : ''}
                </section>
            </div>
        `);

        document.querySelector('[data-close-file-picker]')?.addEventListener('click', closeFilePicker);
        document.querySelectorAll('[data-select-file-url]').forEach((button) => {
            button.addEventListener('click', () => {
                const input = document.querySelector(`[name="${button.dataset.targetInput}"]`);
                if (input) input.value = button.dataset.selectFileUrl || '';
                closeFilePicker();
            });
        });
        document.querySelector('[data-load-more-files]')?.addEventListener('click', (event) => {
            openFilePicker({
                type: event.currentTarget.dataset.fileType,
                targetName: event.currentTarget.dataset.targetInput,
                cursor: event.currentTarget.dataset.cursor
            });
        });
    };

    const openFilePicker = async ({ type, targetName, cursor = '' }) => {
        renderFilePicker({ type, targetName, loading: true });

        try {
            const data = await fetchR2Files({ type, password: adminPassword, cursor });
            renderFilePicker({
                type,
                targetName,
                files: data.files || [],
                cursor: data.cursor || '',
                truncated: Boolean(data.truncated)
            });
        } catch (error) {
            renderFilePicker({ type, targetName, error: error.message });
        }
    };

    const renderLogin = () => {
        document.body.innerHTML = `
            <main class="admin-shell admin-login-shell">
                <section class="admin-panel admin-login-card">
                    <span>OSUM CMS</span>
                    <h1>관리자 인증</h1>
                    <p>포트폴리오 CMS를 보려면 관리자 비밀번호를 입력하세요.</p>
                    <form id="admin-login-form">
                        <label>관리자 비밀번호
                            <input id="admin-password" type="password" autocomplete="current-password" placeholder="ADMIN_PASSWORD" autofocus>
                        </label>
                        <button type="submit" class="admin-primary">CMS 열기</button>
                        <p class="admin-status" aria-live="polite"></p>
                    </form>
                    <a href="/" class="admin-link">사이트로 돌아가기</a>
                </section>
            </main>
        `;

        document.getElementById('admin-login-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            adminPassword = document.getElementById('admin-password')?.value || '';
            setText('.admin-status', '확인 중...', 'admin-status');

            try {
                const data = await apiJson('/api/admin/portfolio', { password: adminPassword });
                items = data.items || [];
                unlocked = true;
                editingItem = null;
                draw();
            } catch (error) {
                setText('.admin-status', error.message, 'admin-status admin-upload-error');
            }
        });
    };

    const renderTableRows = () => {
        if (!items.length) {
            return `
                <tr>
                    <td colspan="16" class="admin-table-empty">등록된 포트폴리오가 없습니다.</td>
                </tr>
            `;
        }

    return items.map((entry, index) => {
            const meta = itemMetadata(entry);
            const title = entry.title || 'Untitled';
            const detail = meta.detail || entry.description || '';
            const points = (meta.points || []).join(' · ');
            const isDraft = Boolean(entry.isDraft);

            return `
                <tr class="${isDraft ? 'is-draft' : ''}">
                    <td class="admin-row-number">${index + 1}</td>
                    <td class="admin-table-actions">
                        <button type="button" data-edit-id="${escapeHtml(entry.id)}">수정</button>
                        <button type="button" data-delete-id="${escapeHtml(entry.id)}">삭제</button>
                    </td>
                    <td><button type="button" class="admin-status-pill ${entry.visible ? 'is-visible' : 'is-hidden'}" data-toggle-id="${escapeHtml(entry.id)}">${entry.visible ? '공개' : '숨김'}</button></td>
                    <td>
                        <div class="admin-table-thumb">
                            ${entry.imageUrl ? `<img src="${escapeHtml(entry.imageUrl)}" alt="">` : '<span>!</span>'}
                        </div>
                    </td>
                    <td class="admin-strong">${isDraft ? '<span class="admin-muted">새 항목</span>' : escapeHtml(truncate(title, 44))}</td>
                    <td>${isDraft ? '<span class="admin-muted">-</span>' : Number(entry.sortOrder || 0)}</td>
                    <td>${escapeHtml(truncate(entry.description || '', 54))}</td>
                    <td>${escapeHtml(entry.category || '-')}</td>
                    <td>${escapeHtml(truncate(meta.format || '', 42))}</td>
                    <td><div class="admin-chip-list">${chips(meta.teacherKeys, teacherOptions)}</div></td>
                    <td><div class="admin-chip-list">${chips(meta.targetKeys, targetOptions)}</div></td>
                    <td>${escapeHtml(truncate(detail, 58))}</td>
                    <td>${escapeHtml(entry.date || '-')}</td>
                    <td>${entry.audioUrl ? '<span class="admin-cell-ok">Audio</span>' : '<span class="admin-muted">-</span>'}</td>
                    <td>${meta.youtubeUrl ? `<a href="${escapeHtml(meta.youtubeUrl)}" target="_blank" rel="noopener noreferrer">YouTube</a>` : entry.externalLink ? `<a href="${escapeHtml(entry.externalLink)}" target="_blank" rel="noopener noreferrer">Link</a>` : '<span class="admin-muted">-</span>'}</td>
                </tr>
            `;
        }).join('');
    };

    const renderEditor = () => {
        if (!editingItem) return '';

        const item = editingItem;
        const meta = itemMetadata(item);

        return `
            <div class="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
                <section class="admin-panel admin-editor-panel">
                    <div class="admin-editor-head">
                        <div>
                            <span>Item Editor</span>
                            <h2 id="admin-editor-title">${item.isDraft ? '새 작품 등록' : '포트폴리오 수정'}</h2>
                        </div>
                        <button type="button" class="admin-link" data-cancel-edit>닫기</button>
                    </div>

                    <form id="d1-portfolio-form">
                    <input type="hidden" name="id" value="${escapeHtml(item.id)}">
                    <input type="hidden" name="imageUrl" value="${escapeHtml(item.imageUrl)}">
                    <input type="hidden" name="audioUrl" value="${escapeHtml(item.audioUrl)}">

                    <div class="admin-grid">
                        <label>프로젝트 이름
                            <input name="title" required value="${escapeHtml(item.title)}" placeholder="예: 조이고">
                        </label>
                        <label>카테고리
                            <input name="category" value="${escapeHtml(item.category)}" placeholder="예: Game BGM, Anime, J-POP">
                        </label>
                        <label>완료일
                            <input type="date" name="date" value="${escapeHtml(item.date)}">
                        </label>
                        <label>등급 / 정렬
                            <input type="number" name="sortOrder" value="${Number(item.sortOrder || 0)}">
                        </label>

                        <div class="admin-field admin-field-wide">
                            <span>태그 / 참여자</span>
                            <div class="admin-checks">${renderChecks('teacherKeys', teacherOptions, meta.teacherKeys)}</div>
                        </div>
                        <div class="admin-field admin-field-wide">
                            <span>표시 조건</span>
                            <div class="admin-checks">${renderChecks('targetKeys', targetOptions, meta.targetKeys)}</div>
                        </div>

                        <label>프로젝트 설명
                            <input name="description" value="${escapeHtml(item.description)}" placeholder="작곡 / 편곡 / BGM">
                        </label>
                        <label>간략 크레딧
                            <input name="format" value="${escapeHtml(meta.format)}" placeholder="예: 작곡: OSUM / Audio Preview">
                        </label>
                        <label>프리뷰 종류
                            <select name="mediaType">
                                ${['Audio', 'Video', 'Project'].map((value) => `<option value="${value}" ${meta.mediaType === value ? 'selected' : ''}>${value}</option>`).join('')}
                            </select>
                        </label>
                        <label>공개 상태
                            <select name="visible">
                                <option value="on" ${item.visible ? 'selected' : ''}>공개</option>
                                <option value="off" ${!item.visible ? 'selected' : ''}>숨김</option>
                            </select>
                        </label>
                        <label>프로젝트 이미지 업로드
                            <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/avif">
                        </label>
                        <label>오디오 파일 업로드
                            <input type="file" name="audioFile" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/wave,audio/x-wav,.mp3,.m4a,.wav">
                        </label>
                        <label>이미지 URL
                            <span class="admin-input-action">
                                <input name="imageUrlManual" value="${escapeHtml(meta.imageUrlManual || item.imageUrl)}" placeholder="./image.png 또는 R2 URL">
                                <button type="button" class="admin-secondary" data-open-file-picker="image" data-target-input="imageUrlManual">R2</button>
                            </span>
                        </label>
                        <label>Audio URL
                            <span class="admin-input-action">
                                <input name="audioUrlManual" value="${escapeHtml(meta.audioUrlManual || item.audioUrl)}" placeholder="https://.../demo.mp3">
                                <button type="button" class="admin-secondary" data-open-file-picker="audio" data-target-input="audioUrlManual">R2</button>
                            </span>
                        </label>
                        <label>동영상 / YouTube URL
                            <input name="youtubeUrl" value="${escapeHtml(meta.youtubeUrl)}" placeholder="https://youtube.com/...">
                        </label>
                        <label>외부 링크
                            <input name="externalLink" value="${escapeHtml(item.externalLink)}" placeholder="SoundCloud, Drive, 음원 링크">
                        </label>
                        <label class="admin-field-wide">상세 설명
                            <textarea name="detail" rows="5" placeholder="상세 설명, 크레딧, 작업 포인트">${escapeHtml(meta.detail || item.description)}</textarea>
                        </label>
                        <label class="admin-field-wide">제작 포인트
                            <input name="points" value="${escapeHtml((meta.points || []).join(', '))}" placeholder="쉼표로 구분: 루프 설계, 보스전 전개, 믹싱">
                        </label>
                    </div>

                    <div class="admin-current-media">
                        ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="Current image">` : ''}
                        ${item.audioUrl ? `<audio controls src="${escapeHtml(item.audioUrl)}"></audio>` : ''}
                    </div>

                    <p class="admin-help">저장 순서: 이미지 파일 업로드 -> 오디오 파일 업로드 -> CMS 조건과 URL을 D1에 저장 -> 표 새로고침.</p>
                    <button type="submit" class="admin-primary">${item.id ? '수정 저장' : '새 항목 저장'}</button>
                    <p class="admin-form-status" aria-live="polite"></p>
                    </form>
                </section>
            </div>
        `;
    };

    const draw = () => {
        if (!unlocked) {
            renderLogin();
            return;
        }

        document.body.innerHTML = `
            <main class="admin-shell admin-table-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 데이터베이스</h1>
                        <p>Wix CMS처럼 표에서 항목을 보고, 수정 화면에서 R2 업로드와 표시 조건을 관리합니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트로 돌아가기</a>
                </header>

                <section class="admin-panel admin-toolbar">
                    <div>
                        <strong>${items.length}</strong>
                        <span>items</span>
                    </div>
                    <button type="button" class="admin-secondary" data-refresh>새로고침</button>
                    <button type="button" class="admin-primary" data-new-item>새 항목</button>
                    <p class="admin-status" aria-live="polite"></p>
                </section>

                <section class="admin-panel admin-table-panel">
                    <div class="admin-table-wrap">
                        <table class="admin-cms-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>관리</th>
                                    <th>상태</th>
                                    <th>프로젝트 이미지</th>
                                    <th>프로젝트 이름</th>
                                    <th>등급</th>
                                    <th>프로젝트 설명</th>
                                    <th>카테고리</th>
                                    <th>간략 크레딧</th>
                                    <th>태그</th>
                                    <th>표시 조건</th>
                                    <th>상세설명</th>
                                    <th>완료일</th>
                                    <th>오디오</th>
                                    <th>동영상/링크</th>
                                </tr>
                            </thead>
                            <tbody>${renderTableRows()}</tbody>
                        </table>
                    </div>
                </section>

                ${renderEditor()}
            </main>
        `;

        bindEvents();
    };

    const loadItems = async (message = '목록을 불러왔습니다.') => {
        const data = await apiJson('/api/admin/portfolio', { password: adminPassword });
        items = data.items || [];
        editingItem = editingItem ? items.find((entry) => entry.id === editingItem.id) || editingItem : null;
        draw();
        setText('.admin-status', message, 'admin-status admin-upload-success');
    };

    const saveForm = async (form) => {
        const formData = new FormData(form);
        const imageFile = formData.get('imageFile');
        const audioFile = formData.get('audioFile');
        const status = form.querySelector('.admin-form-status');
        const nextItem = readFormItem(form);

        if (!nextItem.title) {
            status.textContent = '프로젝트 이름은 필수입니다.';
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
            visible: formData.get('visible') !== 'off',
            metadata: {
                ...nextItem.metadata,
                imageUrlManual: nextItem.metadata.imageUrlManual || imageUrl,
                audioUrlManual: nextItem.metadata.audioUrlManual || audioUrl
            }
        });

        const isDraft = nextItem.id.startsWith('draft-');

        await apiJson(nextItem.id && !isDraft ? `/api/admin/portfolio/${encodeURIComponent(nextItem.id)}` : '/api/admin/portfolio', {
            password: adminPassword,
            method: nextItem.id && !isDraft ? 'PATCH' : 'POST',
            body: payload
        });

        editingItem = null;
        await loadItems('저장했습니다.');
    };

    const bindEvents = () => {
        document.querySelector('[data-refresh]')?.addEventListener('click', async () => {
            try {
                await loadItems();
            } catch (error) {
                setText('.admin-status', error.message, 'admin-status admin-upload-error');
            }
        });

        document.querySelector('[data-new-item]')?.addEventListener('click', () => {
            const draft = createDraftItem();
            items = [draft, ...items];
            editingItem = null;
            draw();
        });

        document.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
            editingItem = null;
            draw();
        });

        document.querySelectorAll('[data-open-file-picker]').forEach((button) => {
            button.addEventListener('click', () => {
                openFilePicker({
                    type: button.dataset.openFilePicker,
                    targetName: button.dataset.targetInput
                });
            });
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
                if (item.isDraft) {
                    item.visible = !item.visible;
                    draw();
                    return;
                }

                try {
                    await apiJson(`/api/admin/portfolio/${encodeURIComponent(item.id)}`, {
                        password: adminPassword,
                        method: 'PATCH',
                        body: toPayload({ ...item, metadata: itemMetadata(item), visible: !item.visible })
                    });
                    await loadItems('상태를 변경했습니다.');
                } catch (error) {
                    setText('.admin-status', error.message, 'admin-status admin-upload-error');
                }
            });
        });

        document.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                const item = items.find((entry) => entry.id === button.dataset.deleteId);
                if (!item) return;

                if (item.isDraft) {
                    items = items.filter((entry) => entry.id !== item.id);
                    if (editingItem?.id === item.id) editingItem = null;
                    draw();
                    return;
                }

                if (!confirm('이 포트폴리오 항목을 삭제할까요?')) return;

                try {
                    await apiJson(`/api/admin/portfolio/${encodeURIComponent(button.dataset.deleteId)}`, {
                        password: adminPassword,
                        method: 'DELETE'
                    });
                    await loadItems('삭제했습니다.');
                } catch (error) {
                    setText('.admin-status', error.message, 'admin-status admin-upload-error');
                }
            });
        });
    };

    draw();
};
