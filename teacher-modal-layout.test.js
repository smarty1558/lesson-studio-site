import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');

const getRuleBody = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
    return match?.[1] || '';
};

test('teacher modal keeps its stage layout when portfolio detail mode is active', () => {
    const teacherDetailRule = getRuleBody('.modal-content.teacher-mode.detail-mode');

    assert.match(teacherDetailRule, /display:\s*block\s*;/);
});

test('teacher page controls are large enough to read as next-page edges', () => {
    const teacherTabRule = getRuleBody('.teacher-tab');
    const closeRule = getRuleBody('.modal-close');

    assert.match(teacherTabRule, /width:\s*clamp\(52px,\s*5vw,\s*72px\)\s*;/);
    assert.match(teacherTabRule, /min-height:\s*calc\(100%\s*-\s*72px\)\s*;/);
    assert.match(teacherTabRule, /writing-mode:\s*vertical-rl\s*;/);
    assert.match(closeRule, /z-index:\s*30\s*;/);
});
