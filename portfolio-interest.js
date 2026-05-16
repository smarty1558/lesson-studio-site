export const createPortfolioInterest = (item = {}) => {
    const title = String(item.title || '').trim();

    if (!title) {
        return null;
    }

    return {
        label: '이런 스타일 배우기',
        title,
        text: `이런 스타일 배우기 : ${title}`
    };
};

export const clearPortfolioInterest = () => null;
