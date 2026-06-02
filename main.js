import { renderD1Admin } from './admin-d1.js';
import {
    clearPortfolioInterest,
    createPortfolioInterest
} from './portfolio-interest.js';
import {
    getTeacherProfile,
    getTeacherProfileWithOverride,
    getTeacherProfileViewState
} from './teacher-profiles.js';
import { getPortfolioItemsForTarget } from './portfolio-data.js';

const uploadTesterMarkup = '';
const DEFAULT_PORTFOLIO_IMAGE = new URL('./portfolio-default-cover.png', import.meta.url).href;
const AUDIO_PREVIEW_VOLUME_KEY = 'osumAudioPreviewVolume';
const DEFAULT_AUDIO_PREVIEW_VOLUME = 0.45;

const readAudioPreviewVolume = () => {
    try {
        const storedVolume = Number(localStorage.getItem(AUDIO_PREVIEW_VOLUME_KEY));
        return Number.isFinite(storedVolume) ? Math.min(1, Math.max(0, storedVolume)) : DEFAULT_AUDIO_PREVIEW_VOLUME;
    } catch {
        return DEFAULT_AUDIO_PREVIEW_VOLUME;
    }
};

const writeAudioPreviewVolume = (volume) => {
    try {
        localStorage.setItem(AUDIO_PREVIEW_VOLUME_KEY, String(Math.min(1, Math.max(0, Number(volume)))));
    } catch {
        // localStorage can be unavailable in private or embedded contexts.
    }
};

const applyAudioPreviewVolume = (volume, sourceAudio = null) => {
    document.querySelectorAll('audio[data-osum-audio-preview]').forEach((audio) => {
        if (audio !== sourceAudio) audio.volume = volume;
    });
};

const setAudioVolumeFill = (input, volume) => {
    if (!input) return;
    const clampedVolume = Math.min(1, Math.max(0, Number(volume) || 0));
    const percent = `${Math.round(clampedVolume * 100)}%`;
    input.style.setProperty('--volume-fill', percent);
    input.setAttribute('aria-valuetext', percent);
};

const formatAudioTime = (seconds = 0) => {
    if (!Number.isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
};

const renderOsumAudioPlayer = (item) => `
    <div class="osum-audio-player" data-osum-audio-player>
        <audio data-osum-audio-preview preload="metadata" src="${item.audioUrl}"></audio>
        <div class="osum-audio-chip">
            <div class="osum-audio-main">
                <div class="osum-audio-topline">
                    <div class="osum-audio-title-group">
                        <button type="button" class="osum-audio-play" aria-label="음원 재생" data-audio-toggle>▶</button>
                        <div>
                            <strong>${item.title || 'Portfolio Audio'}</strong>
                            <span>${item.credits || item.format || item.mediaType || 'Audio'}</span>
                        </div>
                    </div>
                    <div class="osum-audio-volume-inline">
                        <label>
                            <span>VOL</span>
                            <input type="range" min="0" max="1" step="0.01" value="${DEFAULT_AUDIO_PREVIEW_VOLUME}" aria-label="음원 볼륨" data-audio-volume>
                        </label>
                    </div>
                </div>
                <div class="osum-audio-bottomline">
                    <div class="osum-audio-progress" data-audio-seek>
                        <span data-audio-progress></span>
                    </div>
                    <div class="osum-audio-time-row">
                        <span data-audio-current>0:00</span>
                        <span data-audio-duration>0:00</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

const bindAudioPreviewVolume = (root = document) => {
    root.querySelectorAll('audio[data-osum-audio-preview]').forEach((audio) => {
        if (audio.dataset.volumeBound === 'true') return;

        audio.dataset.volumeBound = 'true';
        audio.volume = readAudioPreviewVolume();
        const player = audio.closest('[data-osum-audio-player]');
        const volumeInput = player?.querySelector('[data-audio-volume]');
        if (volumeInput) {
            volumeInput.value = String(audio.volume);
            setAudioVolumeFill(volumeInput, audio.volume);
        }
        audio.addEventListener('volumechange', () => {
            writeAudioPreviewVolume(audio.volume);
            applyAudioPreviewVolume(audio.volume, audio);
            document.querySelectorAll('[data-audio-volume]').forEach((input) => {
                input.value = String(audio.volume);
                setAudioVolumeFill(input, audio.volume);
            });
        });

        const playButton = player?.querySelector('[data-audio-toggle]');
        const progressFill = player?.querySelector('[data-audio-progress]');
        const seekTarget = player?.querySelector('[data-audio-seek]');
        const currentTarget = player?.querySelector('[data-audio-current]');
        const durationTarget = player?.querySelector('[data-audio-duration]');

        const syncProgress = () => {
            const duration = audio.duration || 0;
            const percent = duration ? Math.min(100, (audio.currentTime / duration) * 100) : 0;
            if (progressFill) progressFill.style.width = `${percent}%`;
            if (currentTarget) currentTarget.textContent = formatAudioTime(audio.currentTime);
            if (durationTarget) durationTarget.textContent = formatAudioTime(duration);
        };

        playButton?.addEventListener('click', () => {
            if (audio.paused) {
                document.querySelectorAll('audio[data-osum-audio-preview]').forEach((otherAudio) => {
                    if (otherAudio !== audio) otherAudio.pause();
                });
                audio.play();
            } else {
                audio.pause();
            }
        });

        audio.addEventListener('play', () => {
            if (playButton) playButton.textContent = 'Ⅱ';
        });
        audio.addEventListener('pause', () => {
            if (playButton) playButton.textContent = '▶';
        });
        audio.addEventListener('loadedmetadata', syncProgress);
        audio.addEventListener('timeupdate', syncProgress);
        seekTarget?.addEventListener('click', (event) => {
            if (!audio.duration) return;
            const rect = seekTarget.getBoundingClientRect();
            audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
        });
        volumeInput?.addEventListener('input', () => {
            audio.volume = Number(volumeInput.value);
            setAudioVolumeFill(volumeInput, audio.volume);
        });
        syncProgress();
    });
};

const toDisplayList = (...values) => values.flatMap((value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}).filter((value, index, list) => list.indexOf(value) === index);

const normalizeTagList = (...values) => toDisplayList(...values);
const formatTags = (...values) => normalizeTagList(...values).join(', ');
const renderPortfolioTags = (...values) => {
    const tags = normalizeTagList(...values);
    if (!tags.length) return '';

    return `
        <div class="portfolio-tag-list" aria-label="태그">
            ${tags.map((tag) => `<span class="portfolio-tag decode-text">${tag}</span>`).join('')}
        </div>
    `;
};

const renderMediaPill = (item) => {
    const mediaType = String(item.mediaType || '').trim();
    const format = String(item.format || '').trim();
    const shouldHideFormat = !format || /preview|프리뷰/i.test(format);

    return [mediaType, shouldHideFormat ? '' : format].filter(Boolean).join(' · ');
};

const getTeacherWorkEmbedUrl = (url) => {
    if (!url) return '';

    try {
        const rawUrl = String(url).trim();
        const idFromText = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|[?&]v=)([a-zA-Z0-9_-]{11})/)?.[1]
            || (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl) ? rawUrl : '');

        if (idFromText) return `https://www.youtube-nocookie.com/embed/${idFromText}?rel=0&playsinline=1`;

        const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        const parsed = new URL(normalizedUrl);
        const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        let videoId = '';

        if (host === 'youtu.be') {
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

const getTeacherWorkVideoId = (url) => getTeacherWorkEmbedUrl(url).match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || '';
const getTeacherWorkSourceUrl = (item) => [
    item.youtubeUrl,
    item.videoUrl,
    item.externalUrl,
    item.detail,
    item.format
].find((value) => getTeacherWorkEmbedUrl(value));

const enrichTeacherPortfolioItem = (item, index) => {
    const fallbackCredits = index % 3 === 0 ? '음원 데모' : index % 3 === 1 ? '영상' : '프로젝트';
    const credits = item.credits || item.metadata?.credits || item.format || item.metadata?.format || fallbackCredits;
    const description = item.description || item.metadata?.description || item.metadata?.detail || item.desc || '';
    const tags = normalizeTagList(item.tags, item.metadata?.tags, item.category);
    const imageUrl = item.img || item.imageUrl || DEFAULT_PORTFOLIO_IMAGE;

    return {
        mediaType: index % 3 === 0 ? 'Audio' : index % 3 === 1 ? 'Video' : 'Project',
        format: credits,
        detail: description,
        description,
        img: imageUrl,
        imageUrl,
        tags,
        cta: 'Portfolio consultation',
        ...item,
        format: credits,
        detail: description,
        description,
        credits,
        img: imageUrl,
        imageUrl,
        tags
    };
};

const renderTeacherWorkMedia = (item) => {
    const youtubeSourceUrl = getTeacherWorkSourceUrl(item);
    const youtubeEmbedUrl = getTeacherWorkEmbedUrl(youtubeSourceUrl);
    const youtubeVideoId = getTeacherWorkVideoId(youtubeSourceUrl);
    const imageUrl = item.img || item.imageUrl || DEFAULT_PORTFOLIO_IMAGE;
    const hasImage = Boolean(imageUrl);
    const imageStyle = hasImage ? ` style="background-image: url('${imageUrl}')"` : '';

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
            </div>
        `;
    }

    if (item.audioUrl) {
        return `
            <div class="expanded-media-frame has-audio ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
                ${renderOsumAudioPlayer(item)}
            </div>
        `;
    }

    return `
        <div class="expanded-media-frame ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
        </div>
    `;
};

const renderTeacherWorkDetail = (item, index) => {
    const enriched = enrichTeacherPortfolioItem(item, index);
    const tags = renderPortfolioTags(enriched.tags, enriched.category);

    return `
        <div class="expanded-media">
            ${renderTeacherWorkMedia(enriched)}
        </div>
        <div class="expanded-copy">
            <h3>${enriched.title}</h3>
            <p class="portfolio-credit-line decode-text">${enriched.credits || '-'}</p>
            <dl>
                <div>
                    <dt>설명</dt>
                    <dd>${enriched.description || enriched.detail || enriched.desc || '-'}</dd>
                </div>
            </dl>
            ${tags}
            <div class="portfolio-detail-actions">
                <button type="button" class="portfolio-back">목록으로 돌아가기</button>
                <a href="#contact" class="portfolio-detail-cta">이런 스타일 배우기</a>
            </div>
        </div>
    `;
};

document.body.classList.add('is-loading');

const pageLoadReady = new Promise((resolve) => {
    if (document.readyState === 'complete') {
        resolve();
        return;
    }

    window.addEventListener('load', resolve, { once: true });
});
const introMinimumReady = new Promise((resolve) => window.setTimeout(resolve, 1550));
const finishIntroLoader = () => {
    const loader = document.querySelector('.intro-loader');

    document.body.classList.remove('is-loading');
    document.body.classList.add('site-ready');
    loader?.classList.add('is-hidden');
};

const renderStandaloneAdminPage = () => {
    const getTeacherYouTubeEmbedUrl = (url) => {
        if (!url) return '';

        try {
            const rawUrl = String(url).trim();
            const idFromText = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|[?&]v=)([a-zA-Z0-9_-]{11})/)?.[1]
                || (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl) ? rawUrl : '');

            if (idFromText) return `https://www.youtube-nocookie.com/embed/${idFromText}?rel=0&playsinline=1`;

            const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
            const parsed = new URL(normalizedUrl);
            const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
            const pathParts = parsed.pathname.split('/').filter(Boolean);
            let videoId = '';

            if (host === 'youtu.be') {
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

    const getTeacherYouTubeVideoId = (url) => getTeacherYouTubeEmbedUrl(url).match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] || '';

    const getTeacherYouTubeSourceUrl = (item) => [
        item.youtubeUrl,
        item.videoUrl,
        item.externalUrl,
        item.detail,
        item.format
    ].find((value) => getTeacherYouTubeEmbedUrl(value));

    const renderTeacherWorkMedia = (item) => {
        const youtubeSourceUrl = getTeacherYouTubeSourceUrl(item);
        const youtubeEmbedUrl = getTeacherYouTubeEmbedUrl(youtubeSourceUrl);
        const youtubeVideoId = getTeacherYouTubeVideoId(youtubeSourceUrl);
        const imageUrl = item.img || item.imageUrl || DEFAULT_PORTFOLIO_IMAGE;
        const hasImage = Boolean(imageUrl);
        const imageStyle = hasImage ? ` style="background-image: url('${imageUrl}')"` : '';

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
                </div>
            `;
        }

        if (item.audioUrl) {
            return `
                <div class="expanded-media-frame has-audio ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
                    ${renderOsumAudioPlayer(item)}
                </div>
            `;
        }

        return `
            <div class="expanded-media-frame ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
            </div>
        `;
    };

    const toDisplayList = (...values) => values.flatMap((value) => {
        if (Array.isArray(value)) return value.filter(Boolean);
        return String(value || '')
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    });

    const renderTeacherWorkDetail = (item, index) => {
        const enriched = enrichPortfolioItem(item, index);
        const tags = renderPortfolioTags(enriched.tags, enriched.category);

        return `
            <div class="expanded-media">
                ${renderTeacherWorkMedia(enriched)}
            </div>
            <div class="expanded-copy">
                <h3>${enriched.title}</h3>
                <p class="portfolio-credit-line decode-text">${enriched.credits || '-'}</p>
                <dl>
                    <div>
                        <dt>설명</dt>
                        <dd>${enriched.description || enriched.detail || enriched.desc || '-'}</dd>
                    </div>
                </dl>
                ${tags}
                <a href="#contact" class="portfolio-detail-cta">이 스타일 상담하기</a>
            </div>
        `;
    };

    const cmsStorageKey = 'osumPortfolioCmsItems';
    const targets = {
        course: {
            jpop: 'J-POP · 보카로',
            game: '게임 BGM',
            anime: '애니메이션 · 영화 OST',
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
                        <span>오타쿠 뮤직 스튜디오 CMS</span>
                        <h1>포트폴리오 모달 관리</h1>
                        <p>아이템 하나에 여러 분류를 달면, 해당 분류를 쓰는 클래스/강사 모달에 자동으로 노출됩니다.</p>
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
                                <span>노출 분류</span>
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
                                <input name="img" placeholder="./portfolio-default-cover.png">
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
                        <label>설명
                            <textarea name="detail" rows="5" placeholder="결과물의 방향과 작업 과정을 적어주세요."></textarea>
                        </label>
                        <label>태그
                            <input name="points" placeholder="jpop, indie, game">
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
                alert('노출 분류를 하나 이상 선택해주세요.');
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
                img: formData.get('img') || './portfolio-default-cover.png',
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
                        <span>오타쿠 뮤직 스튜디오 CMS</span>
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
                            <input name="title" required placeholder="예: Opening Demo">
                            </label>
                            <label>장르
                                <select name="genreKey">
                                    ${Object.entries(genreOptions).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
                                </select>
                            </label>
                            <label>참여 강사
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
                                <input name="img" placeholder="./portfolio-default-cover.png">
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
                        <label>설명
                            <textarea name="detail" rows="5" placeholder="작업 방향과 수업 과정을 적어주세요."></textarea>
                        </label>
                        <label>태그
                            <input name="points" placeholder="jpop, indie, game">
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
                format: mediaType === 'Video' ? '유튜브 영상' : mediaType === 'Audio' ? '음원 데모' : '프로젝트',
                img: formData.get('img') || './portfolio-default-cover.png',
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

    bindAudioPreviewVolume();
    const audioPreviewObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof Element) bindAudioPreviewVolume(node);
            });
        });
    });
    audioPreviewObserver.observe(document.body, { childList: true, subtree: true });

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

    const freePluginPortal = document.querySelector('[data-free-plugin-portal]');
    const freePluginFrame = freePluginPortal?.querySelector('[data-free-plugin-frame]');
    const freePluginLaunchers = document.querySelectorAll('[data-free-plugin-launch]');
    const appShell = document.getElementById('app');
    const openFreePluginPortal = (event) => {
        if (!freePluginPortal || !freePluginFrame) return;

        event.preventDefault();
        freePluginPortal.classList.remove('is-active');
        freePluginFrame.src = './free-plugin-transition-options.html?autostart=1&embed=1';
        freePluginPortal.hidden = false;
        document.body.classList.add('free-plugin-portal-open');
        appShell?.classList.add('is-free-plugin-launching');
        window.requestAnimationFrame(() => {
            freePluginPortal.classList.add('is-active');
        });
    };
    freePluginLaunchers.forEach((launcher) => {
        launcher.addEventListener('click', openFreePluginPortal);
    });

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
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const button = contactForm.querySelector('button');
            const originalText = button.textContent;

            button.textContent = '상담 신청 접수 중...';
            button.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: formData.get('name'),
                        phone: formData.get('phone'),
                        email: formData.get('email'),
                        course: formData.get('course'),
                        lessonMode: formData.get('lessonMode'),
                        message: formData.get('message'),
                        portfolioInterest: activePortfolioInterest?.title || activePortfolioInterest?.text || ''
                    })
                });
                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(data.error || '상담 신청을 보내지 못했습니다.');
                }

                alert('상담 신청이 접수되었습니다. 곧 연락드릴게요.');
                contactForm.reset();
                renderPortfolioInterest(clearPortfolioInterest());
            } catch (error) {
                alert(error.message || '상담 신청을 보내지 못했습니다.');
            } finally {
                button.textContent = originalText;
                button.disabled = false;
            }
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

        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data;
            if (!data || typeof data !== 'object') return;

            if (data.type === 'free-plugin-cursor') {
                mouseX = Number(data.x) || mouseX;
                mouseY = Number(data.y) || mouseY;
                activeCursorTarget = data.active ? freePluginPortal : null;
                document.body.classList.toggle('view-cursor-active', Boolean(data.active));
                cursorPill.classList.toggle('is-visible', Boolean(data.active));
            }

            if (data.type === 'free-plugin-cursor-press') {
                cursorPill.classList.toggle('is-pressed', Boolean(data.pressed));
            }

        });

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
    const teacherModal = document.getElementById('teacher-modal');
    const teacherModalContent = teacherModal?.querySelector('.teacher-dedicated-content');
    const teacherModalBody = document.getElementById('teacher-modal-body');
    const teacherCloseBtn = teacherModal?.querySelector('.teacher-modal-close');
    const teacherOverlay = teacherModal?.querySelector('.teacher-modal-overlay');
    let isModalClosing = false;
    let modalOpenToken = 0;
    let teacherOpenToken = 0;
    const restoreTeacherModalLayout = () => {
        const stage = modalContent?.querySelector('.teacher-modal-stage');
        if (stage && gallery && modalContent) {
            modalContent.appendChild(gallery);
            stage.remove();
        }

        modalContent?.classList.remove('teacher-mode', 'teacher-works-active');
    };
    const titleMap = {
        jpop: 'J-POP · 보카로',
        game: '게임 BGM',
        anime: '애니메이션 · 영화 OST',
        sound: 'Sound Design'
    };
    const teacherTitleMap = {
        kim: '김정환 포트폴리오',
        lee: '이서윤 포트폴리오',
        han: '한유나 포트폴리오',
        cho: '조은오 포트폴리오'
    };

    const fetchWithTimeout = async (url, options = {}, timeoutMs = 4500) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            window.clearTimeout(timeout);
        }
    };

    const courseDataKeys = Object.keys(titleMap);
    const teacherDataKeys = Object.keys(teacherTitleMap);
    const siteDataCache = {
        teacherOverrides: null,
        portfolioItems: undefined,
        teacherProfiles: new Map(),
        portfolioByTarget: new Map(),
        preloadPromise: null
    };
    const getPortfolioCacheKey = (type, key) => `${type}:${key}`;

    const loadTeacherOverrides = async () => {
        if (siteDataCache.teacherOverrides) return siteDataCache.teacherOverrides;

        try {
            const response = await fetchWithTimeout('/api/teachers', { cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok || !payload.success) throw new Error('Teacher profile API failed');
            siteDataCache.teacherOverrides = payload.items || [];
        } catch {
            siteDataCache.teacherOverrides = [];
        }

        return siteDataCache.teacherOverrides;
    };

    const loadTeacherProfile = async (key) => {
        if (siteDataCache.teacherProfiles.has(key)) return siteDataCache.teacherProfiles.get(key);

        const overrides = await loadTeacherOverrides();
        const override = overrides.find((item) => item.key === key);
        const profile = getTeacherProfileWithOverride(key, override);
        siteDataCache.teacherProfiles.set(key, profile);
        return profile;
    };

    const syncTeacherCardsFromProfiles = async () => {
        const cards = Array.from(document.querySelectorAll('.artist-card[data-teacher]'));
        if (!cards.length) return;

        await Promise.all(cards.map(async (card) => {
            const key = card.dataset.teacher;
            if (!key) return;

            const profile = await loadTeacherProfile(key);
            const visual = card.querySelector('.artist-image');
            const roleTarget = card.querySelector('.artist-role');
            const nameTarget = card.querySelector('h3');
            const summaryTarget = card.querySelector('.artist-info p');

            if (visual && profile.image) {
                visual.style.backgroundImage = `url("${String(profile.image).replaceAll('"', '%22')}")`;
            }
            if (roleTarget) roleTarget.textContent = profile.role;
            if (nameTarget) nameTarget.textContent = profile.name;
            if (summaryTarget) summaryTarget.textContent = profile.summary;
        }));
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
                <div class="teacher-profile-note">
                    <strong>Class Direction</strong>
                    <p>${profile.note}</p>
                </div>
                <button type="button" class="teacher-panel-action" data-dedicated-teacher-panel="works" data-teacher-panel="works" aria-label="대표작 보기">
                    대표작 보기
                </button>
            </div>
        </section>
    `;

    const setTeacherModalMode = (mode) => {
        const state = getTeacherProfileViewState(mode);
        modalContent?.classList.toggle('teacher-works-active', state.isWorks);
        modalContent?.querySelector('[data-teacher-panel="detail"]')?.setAttribute('aria-pressed', state.isWorks ? 'false' : 'true');
        modalContent?.querySelector('[data-teacher-panel="works"]')?.setAttribute('aria-pressed', state.isWorks ? 'true' : 'false');
    };

    const enrichPortfolioItem = (item, index) => {
        const fallbackCredits = index % 3 === 0 ? '음원 데모' : index % 3 === 1 ? '영상 싱크' : '제작 패키지';
        const credits = item.credits || item.metadata?.credits || item.format || item.metadata?.format || fallbackCredits;
        const description = item.description || item.metadata?.description || item.detail || item.metadata?.detail || item.desc || '';
        const tags = normalizeTagList(item.tags, item.metadata?.tags, item.category);
        const imageUrl = item.img || item.imageUrl || DEFAULT_PORTFOLIO_IMAGE;

        return {
            mediaType: index % 3 === 0 ? 'Audio' : index % 3 === 1 ? 'Video' : 'Project',
            format: credits,
            detail: description,
            desc: description,
            description,
            img: imageUrl,
            imageUrl,
            credits,
            tags,
            cta: '이런 결과물 상담하기',
            ...item,
            format: credits,
            detail: description,
            desc: description,
            description,
            img: imageUrl,
            imageUrl,
            credits,
            tags
        };
    };

    const cmsStorageKey = 'osumPortfolioCmsItems';
    const cmsTargets = {
        course: {
            jpop: 'J-POP · 보카로',
            game: '게임 BGM',
            anime: '애니메이션 · 영화 OST',
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
            jpop: 'J-POP · 보카로',
            game: '게임 BGM',
            anime: '애니메이션 · 영화 OST',
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
        const toKeyList = (value) => {
            if (Array.isArray(value)) return value.filter(Boolean);
            return String(value || '')
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean);
        };
        const courseGenres = {
            game: ['gameBgm', 'filmOst'],
            anime: ['anime'],
            jpop: ['jpop'],
            sound: ['soundDesign']
        };

        const teacherKeys = [
            ...toKeyList(item.teacherKeys),
            ...toKeyList(item.metadata?.teacherKeys),
            ...toKeyList(item.teacherKey)
        ];
        const courseKeys = [
            ...toKeyList(item.courseKeys),
            ...toKeyList(item.targetKeys),
            ...toKeyList(item.metadata?.targetKeys),
            ...toKeyList(item.teacherKey ? '' : item.targetKey)
        ];

        if (teacherKeys.length || courseKeys.length) {
            if (type === 'teacher') return teacherKeys.includes(key);
            return courseKeys.includes(key);
        }

        if (item.genreKey || item.teacherKey) {
            if (type === 'teacher') return item.teacherKey === key;
            return (courseGenres[key] || []).includes(item.genreKey);
        }

        const targetKeys = [
            ...toKeyList(item.targetKeys),
            ...toKeyList(item.metadata?.targetKeys),
            ...toKeyList(item.targetKey)
        ];

        return item.type === type && targetKeys.includes(key);
    };
    const normalizeKeyList = (...values) => toDisplayList(...values);

    const normalizeApiPortfolioItem = (item = {}) => ({
        id: item.id || '',
        title: item.title || 'Untitled',
        desc: item.description || item.metadata?.description || item.metadata?.detail || '',
        description: item.description || item.metadata?.description || item.metadata?.detail || '',
        category: item.category || '',
        date: item.date || '',
        img: item.imageUrl || DEFAULT_PORTFOLIO_IMAGE,
        imageUrl: item.imageUrl || DEFAULT_PORTFOLIO_IMAGE,
        audioUrl: item.audioUrl || '',
        youtubeUrl: item.youtubeUrl || item.metadata?.youtubeUrl || '',
        externalUrl: item.externalLink || '',
        externalLink: item.externalLink || '',
        visible: item.visible !== false,
        sortOrder: Number(item.sortOrder || 0),
        mediaType: item.mediaType || item.metadata?.mediaType || (item.audioUrl ? 'Audio' : item.youtubeUrl ? 'Video' : 'Project'),
        credits: item.credits || item.metadata?.credits || item.format || item.metadata?.format || '',
        format: item.credits || item.metadata?.credits || item.format || item.metadata?.format || '',
        detail: item.detail || item.metadata?.detail || item.description || item.metadata?.description || '',
        tags: normalizeTagList(item.tags, item.metadata?.tags, item.category),
        teacherKeys: normalizeKeyList(item.teacherKeys, item.metadata?.teacherKeys, item.teacherKey),
        courseKeys: normalizeKeyList(item.courseKeys, item.targetKeys, item.metadata?.targetKeys, item.targetKey),
        targetKeys: normalizeKeyList(item.targetKeys, item.metadata?.targetKeys, item.targetKey),
        teacherNames: item.teacherNames || item.metadata?.teacherNames || [],
        targetLabels: item.targetLabels || item.metadata?.targetLabels || [],
        cta: 'Portfolio consultation'
    });

    const loadAllPortfolioItems = async () => {
        if (Array.isArray(siteDataCache.portfolioItems)) return siteDataCache.portfolioItems;
        if (siteDataCache.portfolioItems === null) return null;

        try {
            const response = await fetchWithTimeout('/api/portfolio', { cache: 'no-store' });
            const payload = await response.json();

            if (!response.ok || !payload.success) {
            throw new Error(payload.error || '포트폴리오 데이터를 불러오지 못했습니다.');
            }

            siteDataCache.portfolioItems = (payload.items || []).map(normalizeApiPortfolioItem);
            return siteDataCache.portfolioItems;
        } catch {
            siteDataCache.portfolioItems = null;
            return null;
        }
    };

    const loadPortfolioItems = async (type, key) => {
        const cacheKey = getPortfolioCacheKey(type, key);
        if (siteDataCache.portfolioByTarget.has(cacheKey)) {
            return siteDataCache.portfolioByTarget.get(cacheKey);
        }

        const items = await loadAllPortfolioItems();
        const filtered = items
            ? items.filter((item) => itemMatchesTarget(item, type, key))
            : getPortfolioItemsForTarget(type, key);

        siteDataCache.portfolioByTarget.set(cacheKey, filtered);
        return filtered;
    };

    const preloadSiteData = () => {
        if (siteDataCache.preloadPromise) return siteDataCache.preloadPromise;

        siteDataCache.preloadPromise = Promise.all([
            ...teacherDataKeys.map((key) => loadTeacherProfile(key)),
            ...teacherDataKeys.map((key) => loadPortfolioItems('teacher', key)),
            ...courseDataKeys.map((key) => loadPortfolioItems('course', key))
        ]).then(syncTeacherCardsFromProfiles).catch(() => {});

        return siteDataCache.preloadPromise;
    };

    const waitForInitialSiteReady = async () => {
        try {
            await Promise.all([
                pageLoadReady,
                introMinimumReady,
                preloadSiteData()
            ]);
        } finally {
            finishIntroLoader();
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
                        <span>오타쿠 뮤직 스튜디오 CMS</span>
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
                                <span>참여 강사</span>
                                <div class="admin-checks">${checkedList('teacherKeys', cmsLabels.teacher, selectedTeacherKeys)}</div>
                            </div>
                            <div class="admin-field admin-field-wide">
                                <span>표시될 클래스</span>
                                <div class="admin-checks">${checkedList('courseKeys', cmsLabels.course, selectedCourseKeys)}</div>
                            </div>
                            <label>표시 형식<input name="format" value="${editingItem?.format || ''}" placeholder="예: 유튜브 영상 / 음원 데모"></label>
                            <label>이미지 URL<input name="img" value="${editingItem?.img || ''}" placeholder="./portfolio-default-cover.png"></label>
                            <label>YouTube URL<input name="youtubeUrl" value="${editingItem?.youtubeUrl || ''}" placeholder="https://youtube.com/..."></label>
                            <label>Audio URL<input name="audioUrl" value="${editingItem?.audioUrl || ''}" placeholder="https://.../demo.mp3"></label>
                            <label>외부 링크<input name="externalUrl" value="${editingItem?.externalUrl || ''}" placeholder="SoundCloud, Drive, 음원 링크"></label>
                        </div>
                        <label>설명<textarea name="detail" rows="5" placeholder="작업 의도와 담당 파트를 적어주세요.">${editingItem?.detail || ''}</textarea></label>
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
                format: formData.get('format') || (mediaType === 'Video' ? '유튜브 영상' : mediaType === 'Audio' ? '음원 데모' : '프로젝트'),
                img: formData.get('img') || './portfolio-default-cover.png',
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
                        <span>오타쿠 뮤직 스튜디오 CMS</span>
                        <h1>포트폴리오 모달 관리</h1>
                        <p>강사는 강사별, 클래스는 장르/분류별로 포트폴리오 항목을 추가합니다.</p>
                    </div>
                    <a href="/" class="admin-link">사이트 보기</a>
                </header>
                <section class="admin-layout">
                    <form id="admin-portfolio-form" class="admin-panel">
                        <h2>모달 항목 추가</h2>
                        <div class="admin-grid">
                            <div class="admin-field admin-field-wide">
                                <span>노출 분류</span>
                                <div class="admin-checks" data-target-checks>${targetCheckboxes('course')}</div>
                            </div>
                            <label>구분<select name="type"><option value="course">클래스 CMS</option><option value="teacher">강사 CMS</option></select></label>
                            <label>표시 위치<select name="targetKey">${targetOptions('course')}</select></label>
                            <label>제목<input name="title" required placeholder="예: Rhythm Game Original"></label>
                            <label>짧은 설명<input name="desc" required placeholder="예: J-POP / Electronic"></label>
                            <label>미디어 타입<select name="mediaType"><option>Audio</option><option>Video</option><option>Project</option></select></label>
                            <label>형식<input name="format" placeholder="예: 유튜브 영상 / 음원 데모"></label>
                            <label>썸네일 이미지 URL<input name="img" placeholder="./portfolio-default-cover.png"></label>
                            <label>YouTube URL<input name="youtubeUrl" placeholder="https://youtube.com/..."></label>
                            <label>Audio URL<input name="audioUrl" placeholder="https://.../demo.mp3"></label>
                            <label>외부 링크<input name="externalUrl" placeholder="SoundCloud, Melon, Drive 등"></label>
                        </div>
                        <label>설명<textarea name="detail" rows="5" placeholder="결과물의 방향과 작업 과정을 적어주세요."></textarea></label>
                        <label>태그<input name="points" placeholder="jpop, indie, game"></label>
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
                img: formData.get('img') || './portfolio-default-cover.png',
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

    document.querySelectorAll('.teacher-portfolio').forEach((button) => {
        button.textContent = '강사 상세 보기';
    });

    let teacherModeSwitchTimer = 0;
    let teacherModeReadyTimer = 0;
    const setDedicatedTeacherMode = (mode, options = {}) => {
        const isWorks = mode === 'works';
        const applyMode = () => {
            teacherModalContent?.classList.toggle('teacher-works-active', isWorks);
            teacherModalContent?.classList.remove('detail-mode', 'teacher-work-detail-mode');
            teacherModal?.classList.remove('detail-active');
            teacherModalContent?.querySelector('.teacher-dedicated-works-panel')?.classList.remove('teacher-work-detail-active');
            const worksDetail = teacherModalContent?.querySelector('.teacher-works-detail');
            if (worksDetail) {
                worksDetail.classList.remove('is-open');
                worksDetail.innerHTML = '';
            }
            teacherModalContent?.querySelectorAll('.teacher-works-gallery .portfolio-item.active, .teacher-works-gallery .portfolio-item.is-sending').forEach((activeItem) => {
                activeItem.classList.remove('active', 'is-sending');
            });
            teacherModalContent?.querySelector('[data-dedicated-teacher-panel="detail"]')?.setAttribute('aria-pressed', isWorks ? 'false' : 'true');
            teacherModalContent?.querySelector('[data-dedicated-teacher-panel="works"]')?.setAttribute('aria-pressed', isWorks ? 'true' : 'false');
        };

        window.clearTimeout(teacherModeSwitchTimer);
        window.clearTimeout(teacherModeReadyTimer);

        if (options.immediate) {
            teacherModalContent?.classList.remove('teacher-view-switching', 'teacher-view-ready');
            applyMode();
            return;
        }

        teacherModalContent?.classList.add('teacher-view-switching');
        teacherModeSwitchTimer = window.setTimeout(() => {
            applyMode();
            teacherModalContent?.classList.remove('teacher-view-switching');
            teacherModalContent?.classList.add('teacher-view-ready');
            teacherModeReadyTimer = window.setTimeout(() => {
                teacherModalContent?.classList.remove('teacher-view-ready');
            }, 260);
        }, 220);
    };

    const closeTeacherModal = () => {
        if (!teacherModal?.classList.contains('active')) return;

        teacherOpenToken += 1;
        teacherModal.classList.add('is-dismissing');
        teacherModalContent?.classList.add('is-shutting-down');

        window.setTimeout(() => {
            teacherModal.classList.remove('active', 'is-dismissing');
            teacherModal.setAttribute('aria-hidden', 'true');
            teacherModalContent?.classList.remove('teacher-works-active', 'is-shutting-down', 'teacher-view-switching', 'teacher-view-ready', 'detail-mode', 'teacher-work-detail-mode');
            if (teacherModalBody) teacherModalBody.innerHTML = '';
            document.body.style.overflow = modal?.classList.contains('active') ? 'hidden' : '';
        }, 260);
    };

    const openTeacherModal = async (key) => {
        if (!teacherModal || !teacherModalContent || !teacherModalBody) return;

        const openToken = ++teacherOpenToken;
        teacherModalBody.innerHTML = '<p class="portfolio-empty">강사 정보를 불러오는 중입니다...</p>';
        teacherModalContent.classList.remove('teacher-works-active', 'is-shutting-down', 'teacher-view-switching', 'teacher-view-ready', 'detail-mode', 'teacher-work-detail-mode');

        let profile;
        let data = [];

        try {
            [profile, data] = await Promise.all([
                loadTeacherProfile(key),
                loadPortfolioItems('teacher', key)
            ]);
        } catch (error) {
            teacherModalBody.innerHTML = `<p class="portfolio-empty">${error.message || '강사 정보를 불러오지 못했습니다.'}</p>`;
            return;
        }

        if (openToken !== teacherOpenToken) return;
        teacherModal.classList.add('active');
        teacherModal.classList.remove('is-dismissing');
        teacherModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const worksMarkup = data.length ? data.map((item, index) => {
            const enriched = enrichPortfolioItem(item, index);
            const hasImage = Boolean(enriched.img);

            return `
                <article class="portfolio-item" data-teacher-work-index="${index}">
                    <div class="frame-inner ${hasImage ? '' : 'is-missing-image'}"${hasImage ? ` style="background-image: url('${enriched.img}')"` : ''}>
                        <div class="play-overlay">
                            <div class="play-icon">+</div>
                        </div>
                    </div>
                    <div class="item-caption">
                        <h4>${enriched.title}</h4>
                        <p>${enriched.credits}</p>
                    </div>
                </article>
            `;
        }).join('') : '<p class="portfolio-empty">CMS에 연결된 대표작이 아직 없습니다.</p>';

        teacherModalBody.innerHTML = `
            <div class="teacher-modal-stage teacher-dedicated-stage">
                <div class="teacher-panel-track teacher-dedicated-track">
                    <section class="teacher-panel teacher-detail-panel">
                        ${renderTeacherProfileMarkup(profile)}
                    </section>
                    <section class="teacher-panel teacher-works-panel teacher-dedicated-works-panel">
                        <div class="modal-header teacher-works-heading">
                            <span class="section-kicker">Representative Works</span>
                            <h3 id="teacher-modal-title">${profile.name} 대표작</h3>
                            <button type="button" class="teacher-panel-action teacher-panel-action-secondary" data-dedicated-teacher-panel="detail" data-teacher-panel="detail" aria-label="강사 상세 정보 보기">
                                강사 상세 정보 보기
                            </button>
                        </div>
                        <div class="teacher-dedicated-portfolio">
                            <div class="portfolio-gallery teacher-works-gallery">${worksMarkup}</div>
                            <div class="portfolio-expanded-panel teacher-works-detail" aria-live="polite"></div>
                        </div>
                    </section>
                </div>
            </div>
        `;

        setDedicatedTeacherMode('detail', { immediate: true });

        teacherModalBody.querySelectorAll('[data-dedicated-teacher-panel]').forEach((button) => {
            button.addEventListener('click', () => setDedicatedTeacherMode(button.dataset.dedicatedTeacherPanel));
        });

        const worksGallery = teacherModalBody.querySelector('.teacher-works-gallery');
        const worksDetail = teacherModalBody.querySelector('.teacher-works-detail');
        const worksPanel = teacherModalBody.querySelector('.teacher-dedicated-works-panel');
        const closeTeacherWorkDetail = () => {
            worksPanel?.classList.remove('teacher-work-detail-active');
            teacherModal?.classList.remove('detail-active');
            teacherModalContent?.classList.remove('detail-mode', 'teacher-work-detail-mode');
            worksDetail?.classList.remove('is-open');
            if (worksDetail) worksDetail.innerHTML = '';
            worksGallery?.classList.add('is-returning');
            worksGallery?.querySelectorAll('.portfolio-item.active, .portfolio-item.is-sending').forEach((activeItem) => {
                activeItem.classList.remove('active', 'is-sending');
            });
            window.setTimeout(() => {
                worksGallery?.classList.remove('is-returning');
            }, 280);
        };
        const openTeacherWorkDetail = (item, itemIndex) => {
            worksGallery?.querySelectorAll('.portfolio-item.active, .portfolio-item.is-sending').forEach((activeItem) => {
                activeItem.classList.remove('active', 'is-sending');
            });
            item.classList.add('active', 'is-sending');
            teacherModal?.classList.add('detail-active');
            teacherModalContent?.classList.add('detail-mode', 'teacher-work-detail-mode');
            teacherModalContent?.classList.remove('teacher-view-switching', 'teacher-view-ready');
            worksPanel?.classList.add('teacher-work-detail-active');
            window.setTimeout(() => {
                if (worksDetail) {
                    worksDetail.innerHTML = renderTeacherWorkDetail(data[itemIndex], itemIndex);
                    worksDetail.classList.add('is-open', 'is-arriving', 'is-glitch-in');
                    window.setTimeout(() => {
                        worksDetail.classList.remove('is-arriving', 'is-glitch-in');
                    }, 720);
                }
            }, 180);
        };

        worksGallery?.querySelectorAll('[data-teacher-work-index]').forEach((item) => {
            item.addEventListener('click', (event) => {
                if (event.target.closest('audio, .portfolio-external-link')) return;

                const itemIndex = Number(item.dataset.teacherWorkIndex);
                openTeacherWorkDetail(item, itemIndex);
            });
        });

        teacherModalBody.onclick = (event) => {
            const back = event.target.closest('.portfolio-back');
            if (back) {
                event.preventDefault();
                closeTeacherWorkDetail();
                return;
            }

            const cta = event.target.closest('.portfolio-detail-cta');
            if (!cta) return;

            event.preventDefault();
            const activeIndex = Number(worksGallery?.querySelector('.portfolio-item.active')?.dataset.teacherWorkIndex || 0);
            moveToContactWithPortfolioInterest({
                title: data[activeIndex]?.title || profile.name
            });
            closeTeacherModal();
        };
    };

    const openModal = async (key, type = 'course') => {
        const openToken = ++modalOpenToken;
        const isTeacher = type === 'teacher';
        restoreTeacherModalLayout();
        if (isTeacher) {
            modal.classList.remove('active', 'detail-active', 'is-dismissing');
            modal.setAttribute('aria-hidden', 'true');
            modalContent?.classList.add('teacher-preparing');
            gallery?.classList.add('teacher-gallery-preparing');
        }
        const title = isTeacher
            ? (teacherTitleMap[key] || '강사진 포트폴리오')
            : (titleMap[key] || '수강생');

        modalTitle.innerHTML = `${title} <span class="text-purple">결과물</span>`;
        document.getElementById('portfolio-expanded-panel')?.remove();

        gallery.innerHTML = '';
        if (isTeacher) {
            gallery.innerHTML = '';
        }

        let data = [];

        try {
            data = await loadPortfolioItems(isTeacher ? 'teacher' : 'course', key);
        } catch (error) {
            modalContent?.classList.remove('teacher-preparing');
            gallery?.classList.remove('teacher-gallery-preparing');
            gallery.innerHTML = `<p class="portfolio-empty">${error.message || '포트폴리오 데이터를 불러오지 못했습니다.'}</p>`;
            return;
        }

        if (openToken !== modalOpenToken) return;

        gallery.innerHTML = data.length ? data.map((item, index) => {
            const enriched = enrichPortfolioItem(item, index);
            const hasImage = Boolean(enriched.img);

            return `
            <article class="portfolio-item" data-portfolio-index="${index}">
                <div class="frame-inner ${hasImage ? '' : 'is-missing-image'}"${hasImage ? ` style="background-image: url('${enriched.img}')"` : ''}>
                    <div class="play-overlay">
                        <div class="play-icon">+</div>
                    </div>
                </div>
                <div class="item-caption">
                    <h4>${enriched.title}</h4>
                    <p>${enriched.credits}</p>
                </div>
            </article>
        `;
        }).join('') : '<p class="portfolio-empty">No visible portfolio items yet.</p>';

        if (!isTeacher) {
            modal.classList.add('active');
            modal.classList.remove('is-dismissing');
            modalContent?.classList.remove('is-shutting-down');
            isModalClosing = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        if (isTeacher && modalContent && gallery) {
            const profile = await loadTeacherProfile(key);
            if (openToken !== modalOpenToken) return;
            const state = getTeacherProfileViewState('detail');
            const stage = document.createElement('div');
            stage.className = 'teacher-modal-stage';
            stage.innerHTML = `
                <div class="teacher-panel-track">
                    <section class="teacher-panel teacher-detail-panel">
                        ${renderTeacherProfileMarkup(profile)}
                    </section>
                    <section class="teacher-panel teacher-works-panel">
                        <div class="teacher-works-heading">
                            <span class="section-kicker">Representative Works</span>
                            <h3>${profile.name} 대표작품</h3>
                            <button type="button" class="teacher-panel-action teacher-panel-action-secondary" data-teacher-panel="detail" aria-label="${state.detailLabel}">
                                ${state.detailLabel}
                            </button>
                        </div>
                        <div class="teacher-portfolio-panel"></div>
                    </section>
                </div>
            `;
            modalContent.insertBefore(stage, modalHeader || gallery);
            stage.querySelector('.teacher-portfolio-panel')?.appendChild(gallery);
            modalContent.classList.add('teacher-mode');
            setTeacherModalMode('detail');
            modalContent.classList.remove('teacher-preparing');
            gallery.classList.remove('teacher-gallery-preparing');
            modal.classList.add('active');
            modal.classList.remove('is-dismissing');
            modalContent.classList.remove('is-shutting-down');
            isModalClosing = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

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
            const imageUrl = item.img || item.imageUrl || DEFAULT_PORTFOLIO_IMAGE;
            const hasImage = Boolean(imageUrl);
            const imageStyle = hasImage ? ` style="background-image: url('${imageUrl}')"` : '';

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
                    </div>
                `;
            }

            if (item.audioUrl) {
                return `
                    <div class="expanded-media-frame has-audio ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
                        ${renderOsumAudioPlayer(item)}
                    </div>
                `;
            }

            return `
                <div class="expanded-media-frame ${hasImage ? '' : 'is-missing-image'}"${imageStyle}>
                </div>
            `;
        };

        const renderExpandedPanel = (item, index) => {
            const enriched = enrichPortfolioItem(item, index);
            const tags = renderPortfolioTags(enriched.tags, enriched.category);
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
                    <h3 class="decode-text">${enriched.title}</h3>
                    <p class="portfolio-credit-line decode-text">${enriched.credits || '-'}</p>
                    <dl>
                        <div>
                            <dt>설명</dt>
                            <dd class="decode-text">${enriched.description || enriched.detail || enriched.desc || '-'}</dd>
                        </div>
                    </dl>
                    ${tags}
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

        if (!modal.classList.contains('active')) {
            modal.classList.add('active');
            modal.classList.remove('is-dismissing');
            modalContent?.classList.remove('is-shutting-down');
            isModalClosing = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

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

        modalOpenToken += 1;
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
                openTeacherModal(portfolioButton.dataset.teacher);
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
            openTeacherModal(artistCard.dataset.teacher);
        }

    });

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
    teacherCloseBtn?.addEventListener('click', closeTeacherModal);
    teacherOverlay?.addEventListener('click', closeTeacherModal);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
            closeTeacherModal();
        }
    });

    waitForInitialSiteReady();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite, { once: true });
} else {
    initSite();
}
