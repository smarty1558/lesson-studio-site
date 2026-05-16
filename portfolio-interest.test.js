import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createPortfolioInterest,
    clearPortfolioInterest
} from './portfolio-interest.js';

test('creates consultation interest copy from the selected portfolio title', () => {
    const interest = createPortfolioInterest({ title: 'Neon Anime Opening' });

    assert.deepEqual(interest, {
        label: '이런 스타일 배우기',
        title: 'Neon Anime Opening',
        text: '이런 스타일 배우기 : Neon Anime Opening'
    });
});

test('clears consultation interest back to the normal contact state', () => {
    assert.equal(clearPortfolioInterest(), null);
});
