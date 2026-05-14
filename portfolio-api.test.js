import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet as publicList } from './functions/api/portfolio.js';
import {
    onRequestGet as adminList,
    onRequestPost as adminCreate
} from './functions/api/admin/portfolio.js';

const fakeDb = ({ rows = [], runResult = { meta: { changes: 1 } }, queries = [] } = {}) => ({
    prepare(sql) {
        queries.push(sql);
        return {
            bind(...values) {
                queries.push(values);
                return this;
            },
            async all() {
                return { results: rows };
            },
            async run() {
                return runResult;
            }
        };
    }
});

test('public portfolio API returns only mapped public items', async () => {
    const response = await publicList({
        env: {
            DB: fakeDb({
                rows: [{
                    id: 'id-1',
                    title: 'Demo',
                    visible: 1,
                    sort_order: 0,
                    image_url: 'https://static.osum.kr/demo.webp'
                }]
            })
        }
    });
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.items[0].imageUrl, 'https://static.osum.kr/demo.webp');
    assert.equal(json.items[0].visible, true);
});

test('admin list requires password', async () => {
    const response = await adminList({
        request: new Request('http://localhost/api/admin/portfolio'),
        env: {
            ADMIN_PASSWORD: 'secret',
            DB: fakeDb()
        }
    });

    assert.equal(response.status, 401);
});

test('admin create inserts normalized portfolio data', async () => {
    const queries = [];
    const response = await adminCreate({
        request: new Request('http://localhost/api/admin/portfolio', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-admin-password': 'secret'
            },
            body: JSON.stringify({
                title: '  Midnight Concerto  ',
                visible: false,
                sortOrder: 3,
                imageUrl: 'https://static.osum.kr/image.webp',
                metadata: {
                    youtubeUrl: 'https://youtube.com/watch?v=abcdefghijk',
                    teacherKeys: ['kim'],
                    targetKeys: ['anime']
                }
            })
        }),
        env: {
            ADMIN_PASSWORD: 'secret',
            DB: fakeDb({ queries })
        }
    });
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.item.title, 'Midnight Concerto');
    assert.equal(json.item.visible, false);
    assert.equal(queries[1][1], 'Midnight Concerto');
    assert.equal(queries[1][8], 0);
    assert.equal(queries[1][9], 3);
    assert.match(queries[1][10], /youtube/);
});
