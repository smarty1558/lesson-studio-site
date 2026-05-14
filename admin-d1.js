const apiJson = async (url, { password, method = 'GET', body } = {}) => {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || '요청을 처리하지 못했습니다.');
    }

    return data;
};

const uploadFile = async ({ file, type, password }) => {
    if (!file) return '';

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
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || '파일 업로드에 실패했습니다.');
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
    sortOrder: 0
};

const itemToPayload = (item) => ({
    title: item.title,
    description: item.description,
    category: item.category,
    date: item.date,
    imageUrl: item.imageUrl,
    audioUrl: item.audioUrl,
    externalLink: item.externalLink,
    visible: Boolean(item.visible),
    sortOrder: Number(item.sortOrder || 0)
});

export const renderD1Admin = () => {
    document.body.classList.remove('is-loading');
    document.body.classList.add('site-ready', 'admin-page');
    document.querySelector('.intro-loader')?.remove();

    let adminPassword = sessionStorage.getItem('osumAdminPassword') || '';
    let items = [];
    let editingItem = null;

    const draw = () => {
        const formItem = editingItem || emptyItem;
        const listMarkup = items.length ? items.map((item) => `
            <article class="admin-item admin-portfolio-row">
                <div class="admin-portfolio-media">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="">` : '<span>No Image</span>'}
                </div>
                <div class="admin-portfolio-body">
                    <span>${item.category || 'Uncategorized'} · ${item.visible ? 'Visible' : 'Hidden'} · Sort ${item.sortOrder}</span>
                    <h3>${item.title}</h3>
                    <p>${item.description || ''}</p>
                    <p>${item.date || 'No date'}</p>
                    ${item.audioUrl ? `<audio controls src="${item.audioUrl}"></audio>` : ''}
                </div>
                <div class="admin-portfolio-actions">
                    <button type="button" data-edit-id="${item.id}">수정</button>
                    <button type="button" data-toggle-id="${item.id}">${item.visible ? '숨김' : '표시'}</button>
                    <button type="button" data-delete-id="${item.id}">삭제</button>
                </div>
            </article>
        `).join('') : '<p class="admin-empty">아직 등록된 포트폴리오 항목이 없습니다.</p>';

        document.body.innerHTML = `
            <main class="admin-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 관리</h1>
                        <p>이미지와 오디오는 R2에 업로드되고, 반환된 URL은 D1 portfolio_items 테이블에 저장됩니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트 보기</a>
                </header>

                <section class="admin-panel admin-auth-panel">
                    <label>관리자 비밀번호
                        <input id="admin-password" type="password" value="${adminPassword}" autocomplete="current-password" placeholder="ADMIN_PASSWORD">
                    </label>
                    <button type="button" class="admin-primary" data-load-admin>목록 불러오기</button>
                    <p class="admin-status" aria-live="polite"></p>
                </section>

                <section class="admin-layout">
                    <form id="d1-portfolio-form" class="admin-panel">
                        <h2>${formItem.id ? '포트폴리오 수정' : '포트폴리오 추가'}</h2>
                        <input type="hidden" name="id" value="${formItem.id}">
                        <input type="hidden" name="imageUrl" value="${formItem.imageUrl}">
                        <input type="hidden" name="audioUrl" value="${formItem.audioUrl}">
                        <div class="admin-grid">
                            <label>제목<input name="title" required value="${formItem.title}" placeholder="Midnight Concerto"></label>
                            <label>카테고리<input name="category" value="${formItem.category}" placeholder="Album"></label>
                            <label>날짜<input type="date" name="date" value="${formItem.date}"></label>
                            <label>정렬 순서<input type="number" name="sortOrder" value="${formItem.sortOrder}"></label>
                            <label class="admin-field-wide">설명<textarea name="description" rows="4" placeholder="작업 설명">${formItem.description}</textarea></label>
                            <label>이미지 파일<input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/avif"></label>
                            <label>오디오 파일<input type="file" name="audioFile" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/wave,audio/x-wav,.mp3,.m4a,.wav"></label>
                            <label>외부 링크<input name="externalLink" value="${formItem.externalLink}" placeholder="https://example.com"></label>
                            <label class="admin-check admin-visible-check">
                                <input type="checkbox" name="visible" ${formItem.visible ? 'checked' : ''}>
                                <span>공개 표시</span>
                            </label>
                        </div>
                        <div class="admin-current-media">
                            ${formItem.imageUrl ? `<img src="${formItem.imageUrl}" alt="Current image">` : ''}
                            ${formItem.audioUrl ? `<audio controls src="${formItem.audioUrl}"></audio>` : ''}
                        </div>
                        <button type="submit" class="admin-primary">${formItem.id ? '수정 저장' : '포트폴리오 저장'}</button>
                        ${formItem.id ? '<button type="button" class="admin-link" data-cancel-edit>새 항목 작성</button>' : ''}
                        <p class="admin-form-status" aria-live="polite"></p>
                    </form>

                    <aside class="admin-panel">
                        <h2>등록된 포트폴리오</h2>
                        <div class="admin-list">${listMarkup}</div>
                    </aside>
                </section>
            </main>
        `;

        bindEvents();
    };

    const setStatus = (message, type = '') => {
        const target = document.querySelector('.admin-status') || document.querySelector('.admin-form-status');
        if (target) {
            target.textContent = message;
            target.className = `admin-status ${type}`;
        }
    };

    const loadItems = async () => {
        adminPassword = document.getElementById('admin-password')?.value || adminPassword;
        sessionStorage.setItem('osumAdminPassword', adminPassword);
        setStatus('목록을 불러오는 중...');

        const data = await apiJson('/api/admin/portfolio', { password: adminPassword });
        items = data.items || [];
        editingItem = editingItem ? items.find((item) => item.id === editingItem.id) || null : null;
        draw();
        setStatus('목록을 불러왔습니다.', 'admin-upload-success');
    };

    const bindEvents = () => {
        document.querySelector('[data-load-admin]')?.addEventListener('click', async () => {
            try {
                await loadItems();
            } catch (error) {
                setStatus(error.message, 'admin-upload-error');
            }
        });

        document.getElementById('d1-portfolio-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const status = form.querySelector('.admin-form-status');
            adminPassword = document.getElementById('admin-password')?.value || adminPassword;
            sessionStorage.setItem('osumAdminPassword', adminPassword);

            try {
                status.textContent = '파일 업로드와 저장을 진행 중입니다...';
                const imageUrl = await uploadFile({
                    file: formData.get('imageFile'),
                    type: 'image',
                    password: adminPassword
                }) || formData.get('imageUrl') || '';
                const audioUrl = await uploadFile({
                    file: formData.get('audioFile'),
                    type: 'audio',
                    password: adminPassword
                }) || formData.get('audioUrl') || '';
                const payload = {
                    title: formData.get('title'),
                    description: formData.get('description'),
                    category: formData.get('category'),
                    date: formData.get('date'),
                    imageUrl,
                    audioUrl,
                    externalLink: formData.get('externalLink'),
                    visible: formData.get('visible') === 'on',
                    sortOrder: Number(formData.get('sortOrder') || 0)
                };
                const id = formData.get('id');
                await apiJson(id ? `/api/admin/portfolio/${encodeURIComponent(id)}` : '/api/admin/portfolio', {
                    password: adminPassword,
                    method: id ? 'PATCH' : 'POST',
                    body: payload
                });
                editingItem = null;
                await loadItems();
            } catch (error) {
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
                editingItem = items.find((item) => item.id === button.dataset.editId) || null;
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
                        body: itemToPayload({ ...item, visible: !item.visible })
                    });
                    await loadItems();
                } catch (error) {
                    setStatus(error.message, 'admin-upload-error');
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
                    setStatus(error.message, 'admin-upload-error');
                }
            });
        });
    };

    draw();
    if (adminPassword) {
        loadItems().catch((error) => setStatus(error.message, 'admin-upload-error'));
    }
};
