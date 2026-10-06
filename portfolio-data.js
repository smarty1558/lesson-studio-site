export const portfolioItems = [
    {
        id: 'sample-anime-opening',
        title: 'Sugar Rush Opening',
        description: 'Anime OP / J-pop vocal production demo',
        category: 'jpop',
        date: '2026-05-14',
        imageUrl: './instructor-vocal-cover.png',
        audioUrl: '',
        externalLink: 'https://soundcloud.com/',
        visible: true,
        sortOrder: 1,
        teacherKeys: ['kim', 'lee'],
        courseKeys: ['jpop'],
        format: 'J-pop Vocal Preview',
        detail: 'Character-tone vocal direction, bright top-line writing, and polished anime opening arrangement.',
        points: ['Vocal tone guide', 'Opening-size chorus', 'Student portfolio direction']
    },
    {
        id: 'sample-game-ost',
        title: 'Pixel Dungeon Battle',
        description: 'Game OST / loopable battle cue',
        category: 'game',
        date: '2026-04-28',
        imageUrl: './portfolio-default-cover.png',
        audioUrl: '',
        externalLink: '',
        visible: true,
        sortOrder: 2,
        teacherKeys: ['cho'],
        format: 'Game OST Preview',
        detail: 'Loop-friendly battle music with hybrid rock, orchestral hits, and clear scene progression.',
        points: ['Loop structure', 'Boss-scene energy', 'Hybrid instrument design']
    },
    {
        id: 'sample-sound-pack',
        title: 'Magic Skill Pack',
        description: 'Fantasy game sound design pack',
        category: 'sound',
        date: '2026-03-16',
        imageUrl: '',
        audioUrl: '',
        externalLink: '',
        visible: true,
        sortOrder: 3,
        teacherKeys: ['han'],
        format: 'Sound Design Preview',
        detail: 'Layered spell impacts, UI accents, and short action sounds prepared for game audio practice.',
        points: ['Layered transients', 'UI sound polish', 'Fantasy effect palette']
    }
];

const emptyToString = (value) => value ? String(value) : '';

export const normalizePortfolioItem = (item = {}) => ({
    id: emptyToString(item.id),
    title: emptyToString(item.title) || 'Untitled',
    description: emptyToString(item.description || item.desc),
    desc: emptyToString(item.description || item.desc || item.genre),
    category: emptyToString(item.category || item.genreKey || item.targetKey),
    date: emptyToString(item.date),
    imageUrl: emptyToString(item.imageUrl || item.img),
    img: emptyToString(item.imageUrl || item.img),
    audioUrl: emptyToString(item.audioUrl),
    externalLink: emptyToString(item.externalLink || item.externalUrl),
    externalUrl: emptyToString(item.externalLink || item.externalUrl),
    visible: item.visible !== false,
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 999,
    teacherKeys: Array.isArray(item.teacherKeys) ? item.teacherKeys : [item.teacherKey].filter(Boolean),
    courseKeys: Array.isArray(item.courseKeys) ? item.courseKeys : [item.category || item.genreKey || item.targetKey].filter(Boolean),
    mediaType: emptyToString(item.mediaType) || (item.audioUrl ? 'Audio' : 'Project'),
    format: emptyToString(item.format) || 'Portfolio Preview',
    detail: emptyToString(item.detail || item.description || item.desc),
    points: Array.isArray(item.points) && item.points.length ? item.points : ['Portfolio direction', 'Production process', 'Result review'],
    cta: emptyToString(item.cta) || 'Portfolio consultation'
});

export const getVisibleSortedPortfolioItems = (items = portfolioItems) => items
    .map(normalizePortfolioItem)
    .filter((item) => item.visible)
    .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
        }

        return new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime();
    });

export const portfolioItemMatchesTarget = (item, type, key) => {
    if (type === 'teacher') {
        return item.teacherKeys.includes(key);
    }

    return item.courseKeys.includes(key) || item.category === key;
};

export const getPortfolioItemsForTarget = (type, key, items = portfolioItems) => getVisibleSortedPortfolioItems(items)
    .filter((item) => portfolioItemMatchesTarget(item, type, key));

const toKeys = (value) => (Array.isArray(value) ? value : String(value || '').split(','))
    .map((key) => String(key).trim())
    .filter(Boolean);

export const hasTeacherLink = (item = {}) => (
    toKeys(item.teacherKeys).length > 0
    || toKeys(item.metadata?.teacherKeys).length > 0
    || toKeys(item.teacherKey).length > 0
);

// Union of every public work linked to at least one teacher, de-duplicated by stable id.
// Input order (sortOrder/date) is preserved; items without an id are never merged by title.
export const getTeacherUnionPortfolioItems = (items = []) => {
    const seenIds = new Set();

    return items.filter((item) => {
        if (!item || item.visible === false || !hasTeacherLink(item)) return false;

        const id = item.id ? String(item.id) : '';
        if (!id) return true;
        if (seenIds.has(id)) return false;

        seenIds.add(id);
        return true;
    });
};

export const getTeacherUnionFallbackItems = (items = portfolioItems) => getTeacherUnionPortfolioItems(
    getVisibleSortedPortfolioItems(items)
);
