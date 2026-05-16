import { renderD1Admin } from './admin-d1.js';
import {
    clearPortfolioInterest,
    createPortfolioInterest
} from './portfolio-interest.js';
import {
    getTeacherProfile,
    getTeacherProfileViewState
} from './teacher-profiles.js';
import { getPortfolioItemsForTarget } from './portfolio-data.js';

const uploadTesterMarkup = '';

document.body.classList.add('is-loading');

window.addEventListener('load', () => {
    const loader = document.querySelector('.intro-loader');

    window.setTimeout(() => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('site-ready');
        loader?.classList.add('is-hidden');
    }, 1550);
});

const renderStandaloneAdminPage = () => {
    const cmsStorageKey = 'osumPortfolioCmsItems';
    const targets = {
        course: {
            game: '게임 · 영화 OST',
            anime: '애니메이션 BGM',
            jpop: 'J-POP',
            sound: 'Sound Design'
        },
        teacher: {
            kim: '김정환 포트폴리오',
            lee: '이서윤 포트폴리오',
            han: '한유나 포트폴리오',
            cho: '조은오 포트폴리오'
        }
    };

    const readItems = () => {
        try {
            return JSON.parse(localStorage.getItem(cmsStorageKey) || '[]');
        } catch {
            return [];
        }
    };

    const writeItems = (items) => {
        localStorage.setItem(cmsStorageKey, JSON.stringify(items));
    };

    const renderChecks = (type) => Object.entries(targets[type]).map(([value, label]) => `
        <label class="admin-check">
            <input type="checkbox" name="targetKeys" value="${value}">
            <span>${label}</span>
        </label>
    `).join('');

    const renderRows = () => {
        const items = readItems();

        if (!items.length) {
            return '<p class="admin-empty">아직 등록된 포트폴리오 항목이 없습니다.</p>';
        }

        return items.map((item) => {
            const keys = Array.isArray(item.targetKeys) ? item.targetKeys : [item.targetKey].filter(Boolean);
            const categories = keys.map((key) => targets[item.type]?.[key] || key).join(' · ');

            return `
                <article class="admin-item">
                    <div>
                        <span>${item.type === 'teacher' ? '강사 CMS' : '클래스 CMS'} · ${categories}</span>
                        <h3>${item.title}</h3>
                        <p>${item.mediaType} · ${item.desc}</p>
                    </div>
                    <button type="button" data-delete-id="${item.id}">삭제</button>
                </article>
            `;
        }).join('');
    };

    const draw = () => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('site-ready', 'admin-page');
        document.querySelector('.intro-loader')?.remove();
        document.body.innerHTML = `
            <main class="admin-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 모달 관리</h1>
                        <p>아이템 하나에 여러 카테고리를 달면, 해당 카테고리를 쓰는 클래스/강사 모달에 자동으로 노출됩니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트 보기</a>
                </header>

                <section class="admin-layout">
                    <form id="admin-portfolio-form" class="admin-panel">
                        <h2>CMS 아이템 추가</h2>
                        <div class="admin-grid">
                            <label>CMS 타입
                                <select name="type">
                                    <option value="course">클래스 CMS</option>
                                    <option value="teacher">강사 CMS</option>
                                </select>
                            </label>
                            <label>미디어 타입
                                <select name="mediaType">
                                    <option>Audio</option>
                                    <option>Video</option>
                                    <option>Project</option>
                                </select>
                            </label>
                            <div class="admin-field admin-field-wide">
                                <span>노출 카테고리</span>
                                <div class="admin-checks" data-target-checks>${renderChecks('course')}</div>
                            </div>
                            <label>제목
                                <input name="title" required placeholder="예: Rhythm Game Original">
                            </label>
                            <label>짧은 설명
                                <input name="desc" required placeholder="예: J-POP / Electronic">
                            </label>
                            <label>형식
                                <input name="format" placeholder="예: 유튜브 영상 / 음원 데모">
                            </label>
                            <label>썸네일 이미지 URL
                                <input name="img" placeholder="./joygo_jpop_hero.png">
                            </label>
                            <label>YouTube URL
                                <input name="youtubeUrl" placeholder="https://youtube.com/...">
                            </label>
                            <label>Audio URL
                                <input name="audioUrl" placeholder="https://.../demo.mp3">
                            </label>
                            <label>외부 링크
                                <input name="externalUrl" placeholder="SoundCloud, Drive 등">
                            </label>
                        </div>
                        <label>상세 설명
                            <textarea name="detail" rows="5" placeholder="결과물의 방향, 작업 과정, 수업 포인트를 적어주세요."></textarea>
                        </label>
                        <label>포인트
                            <input name="points" placeholder="장면 분석, 사운드 설계, 완성 피드백">
                        </label>
                        <button type="submit" class="admin-primary">CMS 아이템 등록</button>
                    </form>

                    <aside class="admin-panel">
                        <h2>등록된 아이템</h2>
                        <div class="admin-list">${renderRows()}</div>
                    </aside>
                </section>
                ${uploadTesterMarkup}
            </main>
        `;

        document.querySelectorAll('[data-upload-form]').forEach((uploadForm) => {
            uploadForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const resultBox = uploadForm.querySelector('.admin-upload-result');
                const file = uploadForm.querySelector('[name="file"]').files?.[0];
                const adminPassword = uploadForm.querySelector('[name="adminPassword"]').value;
                const uploadType = uploadForm.dataset.uploadType;

                if (!file) {
                    resultBox.innerHTML = '<p class="admin-upload-error">업로드할 파일을 선택해 주세요.</p>';
                    return;
                }

                const body = new FormData();
                body.append('file', file);
                body.append('type', uploadType);
                resultBox.innerHTML = '<p>업로드 중...</p>';

                try {
                    const response = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: {
                            'x-admin-password': adminPassword
                        },
                        body
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || '업로드에 실패했습니다.');
                    }

                    const preview = data.type === 'image'
                        ? `<img src="${data.url}" alt="Uploaded preview">`
                        : `<audio controls src="${data.url}"></audio>`;

                    resultBox.innerHTML = `
                        <p class="admin-upload-success">업로드 완료</p>
                        <a href="${data.url}" target="_blank" rel="noopener noreferrer">${data.url}</a>
                        ${preview}
                    `;
                } catch (error) {
                    resultBox.innerHTML = `<p class="admin-upload-error">${error.message || '업로드 중 오류가 발생했습니다.'}</p>`;
                }
            });
        });

        const form = document.getElementById('admin-portfolio-form');
        const typeSelect = form.querySelector('[name="type"]');
        const checks = form.querySelector('[data-target-checks]');

        typeSelect.addEventListener('change', () => {
            checks.innerHTML = renderChecks(typeSelect.value);
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const targetKeys = Array.from(form.querySelectorAll('[name="targetKeys"]:checked')).map((input) => input.value);

            if (!targetKeys.length) {
                alert('노출 카테고리를 하나 이상 선택해주세요.');
                return;
            }

            writeItems([...readItems(), {
                id: `cms-${Date.now()}`,
                type: formData.get('type'),
                targetKeys,
                targetKey: targetKeys[0],
                title: formData.get('title') || 'Untitled',
                desc: formData.get('desc') || '',
                mediaType: formData.get('mediaType') || 'Project',
                format: formData.get('format') || '',
                img: formData.get('img') || './joygo_jpop_hero.png',
                youtubeUrl: formData.get('youtubeUrl') || '',
                audioUrl: formData.get('audioUrl') || '',
                externalUrl: formData.get('externalUrl') || '',
                detail: formData.get('detail') || '',
                points: String(formData.get('points') || '').split(',').map((point) => point.trim()).filter(Boolean),
                cta: '이 포트폴리오 상담하기'
            }]);

            draw();
        });

        document.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', () => {
                writeItems(readItems().filter((item) => item.id !== button.dataset.deleteId));
                draw();
            });
        });
    };

    draw();
};

const renderUnifiedAdminPage = () => {
    const cmsStorageKey = 'osumPortfolioCmsItems';
    const genreOptions = {
        gameBgm: 'Game BGM',
        filmOst: 'Film OST',
        anime: 'Anime',
        jpop: 'J-POP',
        soundDesign: 'Sound Design'
    };
    const teacherOptions = {
        kim: '김정환',
        lee: '이서윤',
        han: '한유나',
        cho: '조은오'
    };

    const readItems = () => {
        try {
            return JSON.parse(localStorage.getItem(cmsStorageKey) || '[]');
        } catch {
            return [];
        }
    };

    const writeItems = (items) => {
        localStorage.setItem(cmsStorageKey, JSON.stringify(items));
    };

    const rows = () => {
        const items = readItems();
        if (!items.length) return '<p class="admin-empty">아직 등록된 포트폴리오 아이템이 없습니다.</p>';

        return items.map((item) => `
            <article class="admin-item">
                <div>
                    <span>${genreOptions[item.genreKey] || item.genre || '장르 없음'} · ${teacherOptions[item.teacherKey] || '참여자 없음'}</span>
                    <h3>${item.title}</h3>
                    <p>${item.mediaType} · ${item.youtubeUrl ? 'YouTube' : item.audioUrl ? 'Audio' : 'Project'}</p>
                </div>
                <button type="button" data-delete-id="${item.id}">삭제</button>
            </article>
        `).join('');
    };

    const draw = () => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('site-ready', 'admin-page');
        document.querySelector('.intro-loader')?.remove();
        document.body.innerHTML = `
            <main class="admin-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 아이템 관리</h1>
                        <p>아이템 하나에 장르와 참여 강사를 지정하면, 관련 클래스와 강사 포트폴리오에 자동으로 표시됩니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트 보기</a>
                </header>

                <section class="admin-layout">
                    <form id="admin-portfolio-form" class="admin-panel">
                        <h2>아이템 추가</h2>
                        <div class="admin-grid">
                            <label>제목
                                <input name="title" required placeholder="예: Joygo">
                            </label>
                            <label>장르
                                <select name="genreKey">
                                    ${Object.entries(genreOptions).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
                                </select>
                            </label>
                            <label>참여자
                                <select name="teacherKey">
                                    ${Object.entries(teacherOptions).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
                                </select>
                            </label>
                            <label>미디어 타입
                                <select name="mediaType">
                                    <option>Audio</option>
                                    <option>Video</option>
                                    <option>Project</option>
                                </select>
                            </label>
                            <label>썸네일 이미지 URL
                                <input name="img" placeholder="./joygo_jpop_hero.png">
                            </label>
                            <label>YouTube URL
                                <input name="youtubeUrl" placeholder="https://youtube.com/...">
                            </label>
                            <label>Audio URL
                                <input name="audioUrl" placeholder="https://.../demo.mp3">
                            </label>
                            <label>외부 링크
                                <input name="externalUrl" placeholder="SoundCloud, Drive 등">
                            </label>
                        </div>
                        <label>상세 설명
                            <textarea name="detail" rows="5" placeholder="작업 방향, 수업 과정, 결과물 포인트를 적어주세요."></textarea>
                        </label>
                        <label>포인트
                            <input name="points" placeholder="장면 분석, 사운드 설계, 완성 피드백">
                        </label>
                        <button type="submit" class="admin-primary">CMS 아이템 등록</button>
                    </form>

                    <aside class="admin-panel">
                        <h2>등록된 아이템</h2>
                        <div class="admin-list">${rows()}</div>
                    </aside>
                </section>
                ${uploadTesterMarkup}
            </main>
        `;

        document.querySelectorAll('[data-upload-form]').forEach((uploadForm) => {
            uploadForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const resultBox = uploadForm.querySelector('.admin-upload-result');
                const file = uploadForm.querySelector('[name="file"]').files?.[0];
                const adminPassword = uploadForm.querySelector('[name="adminPassword"]').value;
                const uploadType = uploadForm.dataset.uploadType;

                if (!file) {
                    resultBox.innerHTML = '<p class="admin-upload-error">업로드할 파일을 선택해 주세요.</p>';
                    return;
                }

                const body = new FormData();
                body.append('file', file);
                body.append('type', uploadType);
                resultBox.innerHTML = '<p>업로드 중...</p>';

                try {
                    const response = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: {
                            'x-admin-password': adminPassword
                        },
                        body
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || '업로드에 실패했습니다.');
                    }

                    const preview = data.type === 'image'
                        ? `<img src="${data.url}" alt="Uploaded preview">`
                        : `<audio controls src="${data.url}"></audio>`;

                    resultBox.innerHTML = `
                        <p class="admin-upload-success">업로드 완료</p>
                        <a href="${data.url}" target="_blank" rel="noopener noreferrer">${data.url}</a>
                        ${preview}
                    `;
                } catch (error) {
                    resultBox.innerHTML = `<p class="admin-upload-error">${error.message || '업로드 중 오류가 발생했습니다.'}</p>`;
                }
            });
        });

        const form = document.getElementById('admin-portfolio-form');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const genreKey = formData.get('genreKey');
            const teacherKey = formData.get('teacherKey');
            const mediaType = formData.get('youtubeUrl') ? 'Video' : formData.get('audioUrl') ? 'Audio' : formData.get('mediaType') || 'Project';

            writeItems([...readItems(), {
                id: `cms-${Date.now()}`,
                title: formData.get('title') || 'Untitled',
                genreKey,
                genre: genreOptions[genreKey],
                teacherKey,
                teacherName: teacherOptions[teacherKey],
                desc: genreOptions[genreKey],
                mediaType,
                format: mediaType === 'Video' ? 'YouTube Preview' : mediaType === 'Audio' ? 'Audio Preview' : 'Project Preview',
                img: formData.get('img') || './joygo_jpop_hero.png',
                youtubeUrl: formData.get('youtubeUrl') || '',
                audioUrl: formData.get('audioUrl') || '',
                externalUrl: formData.get('externalUrl') || '',
                detail: formData.get('detail') || '',
                points: String(formData.get('points') || '').split(',').map((point) => point.trim()).filter(Boolean),
                cta: '이 포트폴리오 상담하기'
            }]);

            draw();
        });

        document.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', () => {
                writeItems(readItems().filter((item) => item.id !== button.dataset.deleteId));
                draw();
            });
        });
    };

    draw();
};

const initSite = () => {
    if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
        renderD1Admin();
        return;
    }

    if (false && (window.location.pathname === '/admin' || window.location.pathname === '/admin/')) {
        renderUnifiedAdminPage();
        return;
    }

    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll(
        '.course-card, .stat-item, .cta-card, .artist-card, .portfolio-layout'
    );

    revealElements.forEach((el) => {
        el.classList.add('reveal-init');
        observer.observe(el);
    });

    const navbar = document.querySelector('.navbar');
    let navRevealTimer;
    let lastScrollY = Math.max(window.scrollY, 0);

    const updateNav = () => {
        const currentScrollY = Math.max(window.scrollY, 0);
        const scrollingDown = currentScrollY >= lastScrollY;

        navbar?.classList.toggle('is-scrolled', currentScrollY > 18);
        navbar?.classList.remove('is-visible');
        navbar?.classList.remove('from-top', 'from-bottom');

        if (currentScrollY > 18) {
            navbar?.classList.add('is-hidden');
            navbar?.classList.add(scrollingDown ? 'from-top' : 'from-bottom');
        }

        window.clearTimeout(navRevealTimer);
        navRevealTimer = window.setTimeout(() => {
            navbar?.classList.remove('is-hidden');
            navbar?.classList.add('is-visible');
        }, currentScrollY > 18 ? 360 : 80);

        lastScrollY = currentScrollY;
    };

    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });

    const contactForm = document.getElementById('contact-form');
    const contactSection = document.getElementById('contact');
    const contactCard = document.querySelector('.cta-card');
    const portfolioInterestSlot = document.querySelector('[data-portfolio-interest]');
    let activePortfolioInterest = null;

    const renderPortfolioInterest = (interest) => {
        if (!portfolioInterestSlot || !contactCard) return;

        activePortfolioInterest = interest;
        contactCard.classList.remove('is-learning', 'is-clearing');

        if (!interest) {
            const activeChip = portfolioInterestSlot.querySelector('.portfolio-interest-chip');
            if (!activeChip) {
                portfolioInterestSlot.classList.remove('has-interest');
                portfolioInterestSlot.innerHTML = '';
                return;
            }

            activeChip.classList.add('is-removing');
            contactCard.classList.add('is-clearing');
            window.setTimeout(() => {
                portfolioInterestSlot.classList.remove('has-interest');
                portfolioInterestSlot.innerHTML = '';
                contactCard.classList.remove('is-clearing');
            }, 300);
            return;
        }

        portfolioInterestSlot.innerHTML = `
            <div class="portfolio-interest-chip">
                <span>${interest.text}</span>
                <button type="button" class="portfolio-interest-remove" aria-label="선택한 포트폴리오 지우기">삭제</button>
            </div>
        `;
        portfolioInterestSlot.classList.add('has-interest');

        window.requestAnimationFrame(() => {
            contactCard.classList.add('is-learning');
        });
    };

    const moveToContactWithPortfolioInterest = (item) => {
        const interest = createPortfolioInterest(item);
        if (!interest || !contactSection) return;

        closeModal();

        window.setTimeout(() => {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 220);

        window.setTimeout(() => {
            renderPortfolioInterest(interest);
        }, 760);
    };

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const button = contactForm.querySelector('button');
            const originalText = button.textContent;

            button.textContent = '상담 신청 접수 중...';
            button.disabled = true;

            window.setTimeout(() => {
                alert('상담 신청이 접수되었습니다. OSUM에서 곧 연락드릴게요.');
                button.textContent = originalText;
                button.disabled = false;
                contactForm.reset();
            }, 900);
        });
    }

    portfolioInterestSlot?.addEventListener('click', (event) => {
        if (!event.target.closest('.portfolio-interest-remove')) return;
        event.preventDefault();
        renderPortfolioInterest(clearPortfolioInterest());
    });

    document.querySelectorAll('.course-card, .artist-card').forEach((card) => {
        card.addEventListener('mousemove', (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
        });
    });

    const cursorTargets = document.querySelectorAll('.course-card, .artist-card[data-teacher]');
    const statCursorTargets = document.querySelectorAll('.stat-item');

    if (cursorTargets.length) {
        const cursorDot = document.createElement('div');
        const cursorPill = document.createElement('div');
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let pillX = mouseX;
        let pillY = mouseY;
        let activeCursorTarget = null;

        cursorDot.className = 'view-cursor-dot';
        cursorPill.className = 'view-cursor-pill';
        cursorPill.textContent = 'VIEW';
        cursorDot.setAttribute('aria-hidden', 'true');
        cursorPill.setAttribute('aria-hidden', 'true');
        document.body.append(cursorDot, cursorPill);
        document.body.classList.add('has-view-cursor');
        document.documentElement.classList.add('has-view-cursor');

        const setStatCursorClip = () => {
            if (activeCursorTarget) {
                cursorDot.classList.remove('has-stat-overlap');
                return;
            }

            const radius = cursorDot.offsetWidth / 2 || 7;
            const dotRect = {
                top: mouseY - radius,
                right: mouseX + radius,
                bottom: mouseY + radius,
                left: mouseX - radius
            };

            const overlapRect = Array.from(statCursorTargets).map((target) => {
                const rect = target.getBoundingClientRect();
                return {
                    top: Math.max(dotRect.top, rect.top),
                    right: Math.min(dotRect.right, rect.right),
                    bottom: Math.min(dotRect.bottom, rect.bottom),
                    left: Math.max(dotRect.left, rect.left)
                };
            }).find((rect) => rect.left < rect.right && rect.top < rect.bottom);

            if (!overlapRect) {
                cursorDot.classList.remove('has-stat-overlap');
                cursorDot.style.setProperty('--stat-clip-top', '100%');
                cursorDot.style.setProperty('--stat-clip-right', '0px');
                cursorDot.style.setProperty('--stat-clip-bottom', '0px');
                cursorDot.style.setProperty('--stat-clip-left', '0px');
                return;
            }

            cursorDot.classList.add('has-stat-overlap');
            cursorDot.style.setProperty('--stat-clip-top', `${Math.max(0, overlapRect.top - dotRect.top)}px`);
            cursorDot.style.setProperty('--stat-clip-right', `${Math.max(0, dotRect.right - overlapRect.right)}px`);
            cursorDot.style.setProperty('--stat-clip-bottom', `${Math.max(0, dotRect.bottom - overlapRect.bottom)}px`);
            cursorDot.style.setProperty('--stat-clip-left', `${Math.max(0, overlapRect.left - dotRect.left)}px`);
        };

        const renderCursor = () => {
            pillX += (mouseX - pillX) * 0.22;
            pillY += (mouseY - pillY) * 0.22;

            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
            setStatCursorClip();
            const pillScale = cursorPill.classList.contains('is-pressed')
                ? 0.9
                : cursorPill.classList.contains('is-visible')
                    ? 1
                    : 0.72;
            cursorPill.style.transform = `translate3d(${pillX + 28}px, ${pillY + 18}px, 0) translate(-50%, -50%) scale(${pillScale})`;

            window.requestAnimationFrame(renderCursor);
        };

        window.addEventListener('mousemove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            activeCursorTarget = event.target.closest('.course-card, .artist-card[data-teacher]');

            document.body.classList.toggle('view-cursor-active', Boolean(activeCursorTarget));
            cursorPill.classList.toggle('is-visible', Boolean(activeCursorTarget));
        }, { passive: true });

        cursorTargets.forEach((target) => {
            target.addEventListener('mouseenter', () => {
                document.body.classList.add('view-cursor-active');
                cursorPill.classList.add('is-visible');
            });
            target.addEventListener('mouseleave', () => {
                document.body.classList.remove('view-cursor-active');
                cursorPill.classList.remove('is-visible', 'is-pressed');
            });
            target.addEventListener('mousedown', () => {
                cursorPill.classList.add('is-pressed');
            });
            target.addEventListener('mouseup', () => {
                cursorPill.classList.remove('is-pressed');
            });
        });

        renderCursor();
    }

    const modal = document.getElementById('portfolio-modal');
    const modalContent = modal?.querySelector('.modal-content');
    const gallery = document.getElementById('portfolio-gallery');
    const modalHeader = modal?.querySelector('.modal-header');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = document.querySelector('.modal-close');
    const overlay = document.querySelector('.modal-overlay');
    let isModalClosing = false;
    const restoreTeacherModalLayout = () => {
        const stage = modalContent?.querySelector('.teacher-modal-stage');
        if (stage && gallery && modalContent) {
            modalContent.appendChild(gallery);
            stage.remove();
        }

        modalContent?.classList.remove('teacher-mode', 'teacher-works-active');
    };
    const titleMap = {
        game: '게임 · 영화 OST',
        anime: '애니메이션 BGM',
        jpop: 'J-POP',
        sound: 'Sound Design'
    };
    const teacherTitleMap = {
        kim: '김정환 포트폴리오',
        lee: '이서윤 포트폴리오',
        han: '한유나 포트폴리오',
        cho: '조은오 포트폴리오'
    };

    const renderTeacherProfileMarkup = (profile) => `
        <section class="teacher-profile-card">
            <div class="teacher-profile-visual" style="background-image: url('${profile.image}')"></div>
            <div class="teacher-profile-copy">
                <span class="section-kicker">${profile.role}</span>
                <h3>${profile.name}</h3>
                <p>${profile.summary}</p>
                <div class="teacher-specialties">
                    ${profile.specialties.map((specialty) => `<span>${specialty}</span>`).join('')}
                </div>
                <dl class="teacher-profile-facts">
                    <div>
                        <dt>대표 방향</dt>
                        <dd>${profile.note}</dd>
                    </div>
                    <div>
                        <dt>대표 작업</dt>
                        <dd>${profile.works.join(' · ')}</dd>
                    </div>
                </dl>
            </div>
        </section>
    `;

    const setTeacherModalMode = (mode) => {
        const state = getTeacherProfileViewState(mode);
        modalContent?.classList.toggle('teacher-works-active', state.isWorks);
        modalContent?.querySelector('[data-teacher-panel="detail"]')?.setAttribute('aria-pressed', state.isWorks ? 'false' : 'true');
        modalContent?.querySelector('[data-teacher-panel="works"]')?.setAttribute('aria-pressed', state.isWorks ? 'true' : 'false');
    };

    const enrichPortfolioItem = (item, index) => ({
        mediaType: index % 3 === 0 ? 'Audio' : index % 3 === 1 ? 'Video' : 'Project',
        format: index % 3 === 0 ? '음원 데모' : index % 3 === 1 ? '영상 싱크' : '제작 패키지',
        detail: '수업 안에서 만든 결과물의 방향, 장면 해석, 사운드 선택 이유를 함께 정리한 포트폴리오입니다.',
        points: ['장면/캐릭터 분석', '사운드 레퍼런스 설계', '완성본 피드백'],
        cta: '이런 결과물 상담하기',
        ...item
    });

    const cmsStorageKey = 'osumPortfolioCmsItems';
    const cmsTargets = {
        course: {
            game: '게임 · 영화 OST',
            anime: '애니메이션 BGM',
            jpop: 'J-POP',
            sound: 'Sound Design'
        },
        teacher: {
            kim: '김정환 포트폴리오',
            lee: '이서윤 포트폴리오',
            han: '한유나 포트폴리오',
            cho: '조은오 포트폴리오'
        }
    };

    const cmsLabels = {
        course: {
            game: '게임 · 영화 OST',
            anime: '애니메이션 BGM',
            jpop: 'J-POP',
            sound: 'Sound Design'
        },
        teacher: {
            kim: '김정환',
            lee: '이서윤',
            han: '한유나',
            cho: '조은오'
        }
    };

    const readCmsItems = () => {
        try {
            return JSON.parse(localStorage.getItem(cmsStorageKey) || '[]');
        } catch {
            return [];
        }
    };

    const writeCmsItems = (items) => {
        localStorage.setItem(cmsStorageKey, JSON.stringify(items));
    };

    const readServerCmsItems = async () => {
        return [];
    };

    const saveServerCmsItem = async (item) => {
        throw new Error('Portfolio data is file-based in this build');
    };

    const deleteServerCmsItem = async (id) => {
        throw new Error('Portfolio data is file-based in this build');
    };

    const cmsDbName = 'osumPortfolioCmsDb';
    const cmsDbStore = 'portfolioItems';

    const openCmsDb = () => new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB is not available'));
            return;
        }

        const request = indexedDB.open(cmsDbName, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(cmsDbStore)) {
                db.createObjectStore(cmsDbStore, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const readCmsDbItems = async () => {
        try {
            return await readServerCmsItems();
        } catch {
            // Static preview fallback: keep the current browser cache working.
        }

        try {
            const db = await openCmsDb();
            const transaction = db.transaction(cmsDbStore, 'readonly');
            const store = transaction.objectStore(cmsDbStore);
            const request = store.getAll();
            const items = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
            db.close();

            if (items.length) writeCmsItems(items);
            return items.length ? items : readCmsItems();
        } catch {
            return readCmsItems();
        }
    };

    const persistCmsItems = async (items) => {
        writeCmsItems(items);

        try {
            await Promise.all(items.map((item) => saveServerCmsItem(item)));
            return;
        } catch {
            // Static preview fallback: mirror to browser storage below.
        }

        try {
            const db = await openCmsDb();
            const transaction = db.transaction(cmsDbStore, 'readwrite');
            const store = transaction.objectStore(cmsDbStore);
            store.clear();
            items.forEach((item) => store.put(item));
            await new Promise((resolve, reject) => {
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(transaction.error);
            });
            db.close();
        } catch {
            writeCmsItems(items);
        }
    };

    const itemMatchesTarget = (item, type, key) => {
        const courseGenres = {
            game: ['gameBgm', 'filmOst'],
            anime: ['anime'],
            jpop: ['jpop'],
            sound: ['soundDesign']
        };

        const teacherKeys = Array.isArray(item.teacherKeys)
            ? item.teacherKeys
            : [item.teacherKey].filter(Boolean);
        const courseKeys = Array.isArray(item.courseKeys)
            ? item.courseKeys
            : [];

        if (teacherKeys.length || courseKeys.length) {
            if (type === 'teacher') return teacherKeys.includes(key);
            return courseKeys.includes(key);
        }

        if (item.genreKey || item.teacherKey) {
            if (type === 'teacher') return item.teacherKey === key;
            return (courseGenres[key] || []).includes(item.genreKey);
        }

        const targetKeys = Array.isArray(item.targetKeys)
            ? item.targetKeys
            : [item.targetKey].filter(Boolean);

        return item.type === type && targetKeys.includes(key);
    };

    const normalizeApiPortfolioItem = (item = {}) => ({
        id: item.id || '',
        title: item.title || 'Untitled',
        desc: item.description || '',
        description: item.description || '',
        category: item.category || '',
        date: item.date || '',
        img: item.imageUrl || '',
        imageUrl: item.imageUrl || '',
        audioUrl: item.audioUrl || '',
        youtubeUrl: item.youtubeUrl || item.metadata?.youtubeUrl || '',
        externalUrl: item.externalLink || '',
        externalLink: item.externalLink || '',
        visible: item.visible !== false,
        sortOrder: Number(item.sortOrder || 0),
        mediaType: item.mediaType || item.metadata?.mediaType || (item.audioUrl ? 'Audio' : item.youtubeUrl ? 'Video' : 'Project'),
        format: item.format || item.metadata?.format || item.category || 'Portfolio Preview',
        detail: item.detail || item.metadata?.detail || item.description || '',
        points: item.points || item.metadata?.points || ['D1 portfolio data', 'R2 media URL', 'Admin managed item'],
        teacherKeys: item.teacherKeys || item.metadata?.teacherKeys || [],
        courseKeys: item.courseKeys || item.targetKeys || item.metadata?.targetKeys || [],
        targetKeys: item.targetKeys || item.metadata?.targetKeys || [],
        teacherNames: item.teacherNames || item.metadata?.teacherNames || [],
        targetLabels: item.targetLabels || item.metadata?.targetLabels || [],
        cta: 'Portfolio consultation'
    });

    const loadPortfolioItems = async (type, key) => {
        try {
            const response = await fetch('/api/portfolio', { cache: 'no-store' });
            const payload = await response.json();

            if (!response.ok || !payload.success) {
            throw new Error(payload.error || '포트폴리오 데이터를 불러오지 못했습니다.');
            }

            const items = (payload.items || []).map(normalizeApiPortfolioItem);

            const filtered = items.filter((item) => itemMatchesTarget(item, type, key));
            return filtered;
        } catch {
            return getPortfolioItemsForTarget(type, key);
        }
    };

    const renderPortfolioAdmin = async (editId = '') => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('site-ready', 'admin-page');
        document.querySelector('.intro-loader')?.remove();

        const items = await readCmsDbItems();
        const editingItem = items.find((item) => item.id === editId);
        const checkedList = (name, options, selected = []) => Object.entries(options)
            .map(([value, label]) => `
                <label class="admin-check">
                    <input type="checkbox" name="${name}" value="${value}" ${selected.includes(value) ? 'checked' : ''}>
                    <span>${label}</span>
                </label>
            `)
            .join('');
        const labelsFor = (type, keys = []) => keys
            .map((key) => cmsLabels[type][key] || key)
            .join(' · ');

        const uploadTesterMarkup = `
            <section class="admin-panel admin-upload-panel">
                <div>
                    <span class="admin-upload-eyebrow">R2 Upload Test</span>
                    <h2>이미지 / 오디오 업로드 테스트</h2>
                    <p>파일은 Cloudflare Pages Function을 거쳐 R2에 저장됩니다. 비밀번호는 서버의 ADMIN_PASSWORD와 비교되고 클라이언트 코드에는 저장되지 않습니다.</p>
                </div>
                <div class="admin-upload-grid">
                    <form class="admin-upload-form" data-upload-form data-upload-type="image">
                        <h3>이미지 업로드</h3>
                        <label>관리자 비밀번호<input type="password" name="adminPassword" autocomplete="current-password" required></label>
                        <label>이미지 파일<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required></label>
                        <button type="submit" class="admin-primary">이미지 업로드</button>
                        <div class="admin-upload-result" aria-live="polite"></div>
                    </form>
                    <form class="admin-upload-form" data-upload-form data-upload-type="audio">
                        <h3>오디오 업로드</h3>
                        <label>관리자 비밀번호<input type="password" name="adminPassword" autocomplete="current-password" required></label>
                        <label>오디오 파일<input type="file" name="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/wave,audio/x-wav,.mp3,.m4a,.wav" required></label>
                        <button type="submit" class="admin-primary">오디오 업로드</button>
                        <div class="admin-upload-result" aria-live="polite"></div>
                    </form>
                </div>
            </section>
        `;

        const itemRows = items.map((item) => {
            const teacherKeys = Array.isArray(item.teacherKeys) ? item.teacherKeys : [item.teacherKey].filter(Boolean);
            const courseKeys = Array.isArray(item.courseKeys)
                ? item.courseKeys
                : (Array.isArray(item.targetKeys) && item.type === 'course' ? item.targetKeys : [item.targetKey].filter(Boolean));

            return `
                <article class="admin-item">
                    <div>
                        <span>${item.genre || item.desc || '장르 미입력'}</span>
                        <h3>${item.title}</h3>
                        <p>참여자: ${labelsFor('teacher', teacherKeys) || '없음'}<br>표시 클래스: ${labelsFor('course', courseKeys) || '없음'}</p>
                    </div>
                    <button type="button" data-edit-id="${item.id}">수정</button>
                    <button type="button" data-delete-id="${item.id}">삭제</button>
                </article>
            `;
        }).join('');
        const selectedTeacherKeys = editingItem
            ? (Array.isArray(editingItem.teacherKeys) ? editingItem.teacherKeys : [editingItem.teacherKey].filter(Boolean))
            : [];
        const selectedCourseKeys = editingItem
            ? (Array.isArray(editingItem.courseKeys)
                ? editingItem.courseKeys
                : (Array.isArray(editingItem.targetKeys) ? editingItem.targetKeys : [editingItem.targetKey].filter(Boolean)))
            : [];

        document.body.innerHTML = `
            <main class="admin-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 통합 관리</h1>
                        <p>작품 하나를 등록하고, 참여 강사와 표시 클래스를 여러 개 선택하면 해당 포트폴리오 보기 화면에 모두 노출됩니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트로 돌아가기</a>
                </header>
                <section class="admin-layout">
                    <form id="admin-portfolio-form" class="admin-panel">
                        <h2>${editingItem ? '작품 수정' : '작품 등록'}</h2>
                        <input type="hidden" name="id" value="${editingItem?.id || ''}">
                        <div class="admin-grid">
                            <label>제목<input name="title" required value="${editingItem?.title || ''}" placeholder="예: 조이고"></label>
                            <label>장르<input name="genre" required value="${editingItem?.genre || editingItem?.desc || ''}" placeholder="예: Game BGM, Anime, J-POP"></label>
                            <div class="admin-field admin-field-wide">
                                <span>참여자</span>
                                <div class="admin-checks">${checkedList('teacherKeys', cmsLabels.teacher, selectedTeacherKeys)}</div>
                            </div>
                            <div class="admin-field admin-field-wide">
                                <span>표시될 클래스</span>
                                <div class="admin-checks">${checkedList('courseKeys', cmsLabels.course, selectedCourseKeys)}</div>
                            </div>
                            <div class="admin-field">
                                <span>프리뷰 종류</span>
                                <p>유튜브 URL이면 Video, 오디오 URL이면 Audio로 자동 표시됩니다.</p>
                            </div>
                            <label>표시 형식<input name="format" value="${editingItem?.format || ''}" placeholder="예: YouTube Preview / Audio Preview"></label>
                            <label>이미지 URL<input name="img" value="${editingItem?.img || ''}" placeholder="./joygo_jpop_hero.png"></label>
                            <label>YouTube URL<input name="youtubeUrl" value="${editingItem?.youtubeUrl || ''}" placeholder="https://youtube.com/..."></label>
                            <label>Audio URL<input name="audioUrl" value="${editingItem?.audioUrl || ''}" placeholder="https://.../demo.mp3"></label>
                            <label>외부 링크<input name="externalUrl" value="${editingItem?.externalUrl || ''}" placeholder="SoundCloud, Drive, 음원 링크"></label>
                        </div>
                        <label>상세 설명<textarea name="detail" rows="5" placeholder="작업 의도, 담당 파트, 수업에서 보여주고 싶은 포인트를 적어주세요.">${editingItem?.detail || ''}</textarea></label>
                        <label>제작 포인트<input name="points" value="${Array.isArray(editingItem?.points) ? editingItem.points.join(', ') : ''}" placeholder="쉼표로 구분: 루프 설계, 보스전 전개, 믹싱"></label>
                        <button type="submit" class="admin-primary">${editingItem ? '수정 저장' : '포트폴리오 등록'}</button>
                        ${editingItem ? '<button type="button" class="admin-link" data-cancel-edit>새 작품 등록으로 돌아가기</button>' : ''}
                    </form>
                    <aside class="admin-panel">
                        <h2>등록된 작품</h2>
                        <div class="admin-list">${itemRows || '<p class="admin-empty">아직 등록된 작품이 없습니다.</p>'}</div>
                    </aside>
                </section>
                ${uploadTesterMarkup}
            </main>
        `;

        document.querySelectorAll('[data-upload-form]').forEach((uploadForm) => {
            uploadForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const resultBox = uploadForm.querySelector('.admin-upload-result');
                const file = uploadForm.querySelector('[name="file"]').files?.[0];
                const adminPassword = uploadForm.querySelector('[name="adminPassword"]').value;
                const uploadType = uploadForm.dataset.uploadType;

                if (!file) {
                    resultBox.innerHTML = '<p class="admin-upload-error">???? ??? ??? ???.</p>';
                    return;
                }

                const body = new FormData();
                body.append('file', file);
                body.append('type', uploadType);
                resultBox.innerHTML = '<p>??? ?...</p>';

                try {
                    const response = await fetch('/api/admin/upload', {
                        method: 'POST',
                        headers: {
                            'x-admin-password': adminPassword
                        },
                        body
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || '???? ??????.');
                    }

                    const preview = data.type === 'image'
                        ? `<img src="${data.url}" alt="Uploaded preview">`
                        : `<audio controls src="${data.url}"></audio>`;

                    resultBox.innerHTML = `
                        <p class="admin-upload-success">??? ??</p>
                        <a href="${data.url}" target="_blank" rel="noopener noreferrer">${data.url}</a>
                        ${preview}
                    `;
                } catch (error) {
                    resultBox.innerHTML = `<p class="admin-upload-error">${error.message || '??? ? ??? ??????.'}</p>`;
                }
            });
        });

        const form = document.getElementById('admin-portfolio-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const teacherKeys = Array.from(form.querySelectorAll('[name="teacherKeys"]:checked')).map((input) => input.value);
            const courseKeys = Array.from(form.querySelectorAll('[name="courseKeys"]:checked')).map((input) => input.value);

            if (!teacherKeys.length || !courseKeys.length) {
                alert('참여자와 표시될 클래스를 각각 1개 이상 선택해주세요.');
                return;
            }

            const youtubeUrl = formData.get('youtubeUrl') || '';
            const audioUrl = formData.get('audioUrl') || '';
            const mediaType = youtubeUrl ? 'Video' : audioUrl ? 'Audio' : 'Project';
            const genre = formData.get('genre') || '';

            const nextItem = {
                id: formData.get('id') || `cms-${Date.now()}`,
                title: formData.get('title') || 'Untitled',
                genre,
                desc: genre,
                teacherKeys,
                teacherKey: teacherKeys[0],
                courseKeys,
                targetKeys: courseKeys,
                targetKey: courseKeys[0],
                mediaType,
                format: formData.get('format') || (mediaType === 'Video' ? 'YouTube Preview' : mediaType === 'Audio' ? 'Audio Preview' : 'Project Preview'),
                img: formData.get('img') || './joygo_jpop_hero.png',
                youtubeUrl,
                videoUrl: youtubeUrl,
                audioUrl,
                externalUrl: formData.get('externalUrl') || '',
                detail: formData.get('detail') || '',
                points: String(formData.get('points') || '').split(',').map((point) => point.trim()).filter(Boolean),
                cta: '포트폴리오 상담하기'
            };

            try {
                await saveServerCmsItem(nextItem);
            } catch {
                const existingItems = await readCmsDbItems();
                const nextItems = formData.get('id')
                    ? existingItems.map((item) => item.id === formData.get('id') ? nextItem : item)
                    : [...existingItems, nextItem];
                await persistCmsItems(nextItems);
            }
            renderPortfolioAdmin();
        });

        document.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
            renderPortfolioAdmin();
        });

        document.querySelectorAll('[data-edit-id]').forEach((button) => {
            button.addEventListener('click', () => {
                renderPortfolioAdmin(button.dataset.editId);
            });
        });

        document.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    await deleteServerCmsItem(button.dataset.deleteId);
                } catch {
                    await persistCmsItems((await readCmsDbItems()).filter((item) => item.id !== button.dataset.deleteId));
                }
                renderPortfolioAdmin();
            });
        });
    };

    const renderAdmin = () => {
        document.body.classList.remove('is-loading');
        document.body.classList.add('site-ready', 'admin-page');
        document.querySelector('.intro-loader')?.remove();

        const items = readCmsItems();
        const targetCheckboxes = (type, selected = []) => Object.entries(cmsTargets[type])
            .map(([value, label]) => `
                <label class="admin-check">
                    <input type="checkbox" name="targetKeys" value="${value}" ${selected.includes(value) ? 'checked' : ''}>
                    <span>${label}</span>
                </label>
            `)
            .join('');
        const itemRows = items.map((item) => `
            <article class="admin-item">
                <div>
                    <span>${(Array.isArray(item.targetKeys) ? item.targetKeys : [item.targetKey]).filter(Boolean).map((key) => cmsTargets[item.type]?.[key] || key).join(' · ')}</span>
                    <h3>${item.title}</h3>
                    <p>${item.mediaType} · ${item.desc}</p>
                </div>
                <button type="button" data-delete-id="${item.id}">삭제</button>
            </article>
        `).join('');

        document.body.innerHTML = `
            <main class="admin-shell">
                <header class="admin-topbar">
                    <div>
                        <span>OSUM CMS</span>
                        <h1>포트폴리오 모달 관리</h1>
                        <p>강사는 강사별, 클래스는 장르/카테고리별로 포트폴리오 항목을 추가합니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트 보기</a>
                </header>
                <section class="admin-layout">
                    <form id="admin-portfolio-form" class="admin-panel">
                        <h2>모달 항목 추가</h2>
                        <div class="admin-grid">
                            <div class="admin-field admin-field-wide">
                                <span>노출 카테고리</span>
                                <div class="admin-checks" data-target-checks>${targetCheckboxes('course')}</div>
                            </div>
                            <label>구분<select name="type"><option value="course">클래스 CMS</option><option value="teacher">강사 CMS</option></select></label>
                            <label>표시 위치<select name="targetKey">${targetOptions('course')}</select></label>
                            <label>제목<input name="title" required placeholder="예: Rhythm Game Original"></label>
                            <label>짧은 설명<input name="desc" required placeholder="예: J-POP / Electronic"></label>
                            <label>미디어 타입<select name="mediaType"><option>Audio</option><option>Video</option><option>Project</option></select></label>
                            <label>형식<input name="format" placeholder="예: 유튜브 영상 / 음원 데모"></label>
                            <label>썸네일 이미지 URL<input name="img" placeholder="./joygo_jpop_hero.png"></label>
                            <label>YouTube URL<input name="youtubeUrl" placeholder="https://youtube.com/..."></label>
                            <label>Audio URL<input name="audioUrl" placeholder="https://.../demo.mp3"></label>
                            <label>외부 링크<input name="externalUrl" placeholder="SoundCloud, Melon, Drive 등"></label>
                        </div>
                        <label>상세 설명<textarea name="detail" rows="5" placeholder="결과물의 방향, 작업 과정, 수업 포인트를 적어주세요."></textarea></label>
                        <label>포인트 3개<input name="points" placeholder="장면 분석, 사운드 설계, 완성 피드백"></label>
                        <button type="submit" class="admin-primary">포트폴리오 모달 추가</button>
                    </form>
                    <aside class="admin-panel">
                        <h2>등록된 CMS 항목</h2>
                        <div class="admin-list">${itemRows || '<p class="admin-empty">아직 추가된 항목이 없습니다.</p>'}</div>
                    </aside>
                </section>
            </main>
        `;

        const form = document.getElementById('admin-portfolio-form');
        const typeSelect = form.querySelector('[name="type"]');
        const targetSelect = form.querySelector('[name="targetKey"]');
        const targetChecks = form.querySelector('[data-target-checks]');

        typeSelect.addEventListener('change', () => {
            targetSelect.innerHTML = targetOptions(typeSelect.value);
            targetChecks.innerHTML = targetCheckboxes(typeSelect.value);
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const nextItem = {
                id: `cms-${Date.now()}`,
                type: formData.get('type'),
                targetKeys: Array.from(form.querySelectorAll('[name="targetKeys"]:checked')).map((input) => input.value),
                targetKey: Array.from(form.querySelectorAll('[name="targetKeys"]:checked')).map((input) => input.value)[0] || formData.get('targetKey'),
                title: formData.get('title') || 'Untitled',
                desc: formData.get('desc') || '',
                mediaType: formData.get('mediaType') || 'Project',
                format: formData.get('format') || '',
                img: formData.get('img') || './joygo_jpop_hero.png',
                youtubeUrl: formData.get('youtubeUrl') || '',
                audioUrl: formData.get('audioUrl') || '',
                externalUrl: formData.get('externalUrl') || '',
                detail: formData.get('detail') || '',
                points: String(formData.get('points') || '').split(',').map((point) => point.trim()).filter(Boolean),
                cta: '이 포트폴리오 상담하기'
            };

            writeCmsItems([...readCmsItems(), nextItem]);
            renderAdmin();
        });

        document.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', () => {
                writeCmsItems(readCmsItems().filter((item) => item.id !== button.dataset.deleteId));
                renderAdmin();
            });
        });
    };

    const openModal = async (key, type = 'course') => {
        const isTeacher = type === 'teacher';
        restoreTeacherModalLayout();
        const title = isTeacher
            ? (teacherTitleMap[key] || '강사진 포트폴리오')
            : (titleMap[key] || '수강생');

        modalTitle.innerHTML = `${title} <span class="text-purple">결과물</span>`;
        document.getElementById('portfolio-expanded-panel')?.remove();

        gallery.innerHTML = '<p class="portfolio-empty">포트폴리오를 불러오는 중입니다...</p>';

        modal.classList.add('active');
        modal.classList.remove('is-dismissing');
        modalContent?.classList.remove('is-shutting-down');
        isModalClosing = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        let data = [];

        try {
            data = await loadPortfolioItems(isTeacher ? 'teacher' : 'course', key);
        } catch (error) {
            gallery.innerHTML = `<p class="portfolio-empty">${error.message || '포트폴리오 데이터를 불러오지 못했습니다.'}</p>`;
            return;
        }

        gallery.innerHTML = data.length ? data.map((item, index) => {
            const enriched = enrichPortfolioItem(item, index);
            const hasImage = Boolean(enriched.img);

            return `
            <article class="portfolio-item" data-portfolio-index="${index}">
                <div class="frame-inner ${hasImage ? '' : 'is-missing-image'}"${hasImage ? ` style="background-image: url('${enriched.img}')"` : ''}>
                    ${hasImage ? '' : '<div class="portfolio-image-fallback">No Image</div>'}
                    <div class="play-overlay">
                        <div class="play-icon">+</div>
                    </div>
                </div>
                <div class="item-caption">
                    <span class="media-pill">${enriched.category || enriched.mediaType}</span>
                    <h4>${enriched.title}</h4>
                    <p>${enriched.desc}</p>
                    <div class="portfolio-card-meta">
                        ${enriched.date ? `<span>${enriched.date}</span>` : ''}
                    </div>
                    ${enriched.audioUrl ? `<audio class="portfolio-card-audio" controls src="${enriched.audioUrl}"></audio>` : ''}
                    ${enriched.externalUrl ? `<a class="portfolio-external-link" href="${enriched.externalUrl}" target="_blank" rel="noopener noreferrer">External Link</a>` : ''}
                </div>
            </article>
        `;
        }).join('') : '<p class="portfolio-empty">No visible portfolio items yet.</p>';

        if (isTeacher && modalContent && gallery) {
            const profile = getTeacherProfile(key);
            const state = getTeacherProfileViewState('detail');
            const stage = document.createElement('div');
            stage.className = 'teacher-modal-stage';
            stage.innerHTML = `
                <button type="button" class="teacher-tab teacher-tab-works" data-teacher-panel="works" aria-label="${state.worksLabel}">
                    <span>${state.worksLabel}</span>
                </button>
                <button type="button" class="teacher-tab teacher-tab-detail" data-teacher-panel="detail" aria-label="${state.detailLabel}">
                    <span>${state.detailLabel}</span>
                </button>
                <div class="teacher-panel-track">
                    <section class="teacher-panel teacher-detail-panel">
                        ${renderTeacherProfileMarkup(profile)}
                    </section>
                    <section class="teacher-panel teacher-works-panel">
                        <div class="teacher-works-heading">
                            <span class="section-kicker">Representative Works</span>
                            <h3>${profile.name} 대표작품</h3>
                        </div>
                        <div class="teacher-portfolio-panel"></div>
                    </section>
                </div>
            `;
            modalContent.insertBefore(stage, modalHeader || gallery);
            stage.querySelector('.teacher-portfolio-panel')?.appendChild(gallery);
            modalContent.classList.add('teacher-mode');
            setTeacherModalMode('detail');

            stage.addEventListener('click', (event) => {
                const panelButton = event.target.closest('[data-teacher-panel]');
                if (!panelButton) return;
                setTeacherModalMode(panelButton.dataset.teacherPanel);
            });
        }

        gallery.insertAdjacentHTML('beforebegin', '<div id="portfolio-detail-kicker" class="portfolio-detail-kicker" aria-hidden="true"></div>');
        gallery.insertAdjacentHTML('afterend', '<div id="portfolio-expanded-panel" class="portfolio-expanded-panel" aria-live="polite"></div>');
        const detailKicker = document.getElementById('portfolio-detail-kicker');
        const expandedPanel = document.getElementById('portfolio-expanded-panel');
        const cyberChars = '01#$%&*+-=<>[]{}?/\\|';

        const decodeText = (element, delay = 0) => {
            const original = element.textContent || '';
            const letters = Array.from(original);
            let frame = 0;
            const frames = 16;

            window.setTimeout(() => {
                const timer = window.setInterval(() => {
                    const progress = frame / frames;
                    element.textContent = letters.map((letter, index) => {
                        if (letter === ' ') return ' ';
                        if (index / Math.max(letters.length, 1) < progress) return letter;
                        return cyberChars[Math.floor(Math.random() * cyberChars.length)];
                    }).join('');

                    frame += 1;
                    if (frame > frames) {
                        window.clearInterval(timer);
                        element.textContent = original;
                    }
                }, 24);
            }, delay);
        };

        const decodePanelText = () => {
            expandedPanel.querySelectorAll('.decode-text').forEach((element, index) => {
                decodeText(element, index * 38);
            });
        };

        const getYouTubeEmbedUrl = (url) => {
            if (!url) return '';

            try {
                const rawUrl = String(url).trim();
                const idFromText = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|[?&]v=)([a-zA-Z0-9_-]{11})/)?.[1]
                    || (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl) ? rawUrl : '');

                if (idFromText) {
                    return `https://www.youtube.com/embed/${idFromText}?rel=0`;
                }

                const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
                const parsed = new URL(normalizedUrl);
                const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
                const pathParts = parsed.pathname.split('/').filter(Boolean);
                let videoId = '';

                if (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl)) {
                    videoId = rawUrl;
                } else if (host === 'youtu.be') {
                    videoId = pathParts[0] || '';
                } else if (host.includes('youtube.com')) {
                    if (['shorts', 'embed', 'live', 'v'].includes(pathParts[0])) {
                        videoId = pathParts[1] || '';
                    } else {
                        videoId = parsed.searchParams.get('v') || '';
                    }
                }

                return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1` : '';
            } catch {
                return '';
            }
        };

        const getYouTubeVideoId = (url) => {
            const embedUrl = getYouTubeEmbedUrl(url);
            return embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
        };

        const getYouTubeSourceUrl = (item) => [
            item.youtubeUrl,
            item.videoUrl,
            item.externalUrl,
            item.detail,
            item.format
        ].find((value) => getYouTubeEmbedUrl(value));

        const renderExpandedMedia = (item) => {
            const youtubeSourceUrl = getYouTubeSourceUrl(item);
            const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeSourceUrl);
            const youtubeVideoId = getYouTubeVideoId(youtubeSourceUrl);
            const hasImage = Boolean(item.img);
            const imageStyle = hasImage ? ` style="background-image: url('${item.img}')"` : '';
            const fallbackMarkup = hasImage ? '' : '<div class="portfolio-image-fallback">No Image</div>';

            if (youtubeEmbedUrl) {
                return `
                    <div class="expanded-media-frame has-player" style="background-image: url('https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg')">
                        <iframe
                            src="${youtubeEmbedUrl}"
                            title="${item.title} YouTube preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allowfullscreen
                        ></iframe>
                        <div class="expanded-player-badge">YouTube Preview</div>
                    </div>
                `;
            }

            if (item.audioUrl) {
                return `
                    <div class="expanded-media-frame has-audio ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
                        ${fallbackMarkup}
                        <audio controls src="${item.audioUrl}"></audio>
                        <div class="expanded-player-badge">Audio Preview</div>
                    </div>
                `;
            }

            return `
                <div class="expanded-media-frame ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
                    ${fallbackMarkup}
                    <div class="expanded-player-badge">${item.mediaType === 'Audio' ? 'Audio Preview' : item.mediaType === 'Video' ? 'Video Preview' : 'Project Preview'}</div>
                </div>
            `;
        };

        const renderExpandedPanel = (item, index) => {
            const enriched = enrichPortfolioItem(item, index);
            const points = enriched.points.map((point) => `<li class="decode-text">${point}</li>`).join('');
            const isAlreadyOpen = expandedPanel.classList.contains('is-open');
            expandedPanel.dataset.portfolioInterestTitle = enriched.title;
            const contextLabel = `${title} 결과물`;

            if (detailKicker) {
                detailKicker.textContent = contextLabel;
            }

            if (isAlreadyOpen) {
                expandedPanel.classList.remove('is-closing', 'is-arriving', 'is-glitch-in', 'is-switching');
                void expandedPanel.offsetWidth;
                expandedPanel.classList.add('is-glitch-out');
            }

            const panelMarkup = `
                <div class="expanded-media">
                    ${renderExpandedMedia(enriched)}
                </div>
                <div class="expanded-copy">
                    <span class="media-pill">${enriched.mediaType} · ${enriched.format}</span>
                    <h3 class="decode-text">${enriched.title}</h3>
                    <p class="decode-text">${enriched.detail}</p>
                    <dl>
                        <div>
                            <dt>장르/형식</dt>
                            <dd class="decode-text">${enriched.desc}</dd>
                        </div>
                        <div>
                            <dt>제작 포인트</dt>
                            <dd>장면에 맞는 사운드, 멜로디 밀도, 완성 후 피드백까지 함께 봅니다.</dd>
                        </div>
                    </dl>
                    <ul>${points}</ul>
                    <button type="button" class="portfolio-back">목록으로 돌아가기</button>
                    <a href="#contact" class="portfolio-detail-cta">이런 스타일 배우기</a>
                </div>
            `;

            if (isAlreadyOpen) {
                window.setTimeout(() => {
                    expandedPanel.innerHTML = panelMarkup;
                    expandedPanel.classList.remove('is-glitch-out', 'is-switching', 'is-arriving');
                    expandedPanel.classList.add('is-open', 'is-glitch-in');
                    decodePanelText();

                    window.setTimeout(() => {
                        expandedPanel.classList.remove('is-glitch-in');
                    }, 720);
                }, 280);
                return;
            }

            expandedPanel.innerHTML = panelMarkup;
            expandedPanel.classList.remove('is-arriving', 'is-closing');
            window.requestAnimationFrame(() => {
                expandedPanel.classList.add('is-open', 'is-arriving', 'is-glitch-in');
                decodePanelText();

                window.setTimeout(() => {
                    expandedPanel.classList.remove('is-glitch-in');
                }, 720);
            });
        };

        modal.classList.add('active');
        modal.classList.remove('is-dismissing');
        modalContent?.classList.remove('is-shutting-down');
        isModalClosing = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        gallery.querySelectorAll('.portfolio-item').forEach((item) => {
            item.addEventListener('click', (event) => {
                if (event.target.closest('audio, .portfolio-external-link')) {
                    return;
                }

                if (event.target.closest('.portfolio-detail-cta')) {
                    closeModal();
                    return;
                }

                const itemIndex = Number(item.dataset.portfolioIndex);

                gallery.querySelectorAll('.portfolio-item.active, .portfolio-item.is-sending').forEach((activeItem) => {
                    activeItem.classList.remove('active', 'is-sending');
                });

                item.classList.add('active', 'is-sending');
                modal?.classList.add('detail-active');
                modalContent?.classList.remove('is-reopening');
                modalContent?.classList.add('detail-mode');

                window.setTimeout(() => {
                    renderExpandedPanel(data[itemIndex], itemIndex);
                }, 180);
            });
        });

        expandedPanel.addEventListener('click', (event) => {
            const interestCta = event.target.closest('.portfolio-detail-cta');
            if (interestCta) {
                event.preventDefault();
                moveToContactWithPortfolioInterest({
                    title: expandedPanel.dataset.portfolioInterestTitle || ''
                });
                return;
            }

            if (event.target.closest('.portfolio-back')) {
                expandedPanel.classList.remove('is-arriving');
                expandedPanel.classList.add('is-closing');
                modalContent?.classList.remove('is-restoring');
                gallery.classList.remove('is-returning');
                modalContent?.classList.remove('is-reopening');
                modalContent?.classList.add('is-collapsing');

                window.setTimeout(() => {
                    modal?.classList.remove('detail-active');
                    modalContent?.classList.remove('detail-mode', 'is-restoring', 'is-collapsing');
                    gallery.classList.remove('is-returning');
                    expandedPanel.classList.remove('is-open', 'is-closing', 'is-switching', 'is-arriving');
                    expandedPanel.innerHTML = '';
                    if (detailKicker) {
                        detailKicker.textContent = '';
                    }
                    gallery.querySelectorAll('.portfolio-item.active, .portfolio-item.is-sending').forEach((activeItem) => {
                        activeItem.classList.remove('active', 'is-sending');
                    });

                    window.requestAnimationFrame(() => {
                        modalContent?.classList.add('is-reopening');
                    });
                }, 250);
            }
        });
    };

    const closeModal = () => {
        if (!modal?.classList.contains('active') || isModalClosing) return;

        isModalClosing = true;
        modal.classList.add('is-dismissing');
        modalContent?.classList.add('is-shutting-down');

        window.setTimeout(() => {
            modal.classList.remove('active', 'detail-active', 'is-dismissing');
            modal.setAttribute('aria-hidden', 'true');
            modalContent?.classList.remove('detail-mode', 'is-restoring', 'is-collapsing', 'is-reopening', 'is-shutting-down');
            restoreTeacherModalLayout();
            gallery?.classList.remove('is-returning');
            document.getElementById('portfolio-detail-kicker')?.remove();
            document.body.style.overflow = '';
            document.getElementById('portfolio-expanded-panel')?.remove();
            isModalClosing = false;
        }, 320);
    };

    document.addEventListener('click', (event) => {
        const portfolioButton = event.target.closest('.btn-portfolio');

        if (portfolioButton) {
            event.preventDefault();
            event.stopPropagation();

            if (portfolioButton.dataset.teacher) {
                openModal(portfolioButton.dataset.teacher, 'teacher');
                return;
            }

            if (portfolioButton.dataset.course) {
                openModal(portfolioButton.dataset.course);
            }

            return;
        }

        const courseCard = event.target.closest('.course-card');

        if (courseCard?.dataset.course) {
            openModal(courseCard.dataset.course);
            return;
        }

        const artistCard = event.target.closest('.artist-card[data-teacher]');

        if (artistCard?.dataset.teacher) {
            openModal(artistCard.dataset.teacher, 'teacher');
        }

    });

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite, { once: true });
} else {
    initSite();
}
