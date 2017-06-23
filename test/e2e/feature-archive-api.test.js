'use strict';

const { test } = require('ava');
const { setupApp } = require('./helpers/test-helper');
const logger = require('../../lib/logger');

test.beforeEach(() => {
    logger.setLevel('FATAL');
});

test.serial('returns three archived toggles', async t => {
    const { request, destroy } = await setupApp('archive_serial');
    return request
        .get('/api/archive/features')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
            t.true(res.body.features.length === 3);
        })
        .then(destroy);
});

test.serial('revives a feature by name', async t => {
    const { request, destroy } = await setupApp('archive_serial');
    return request
        .post('/api/archive/revive/featureArchivedX')
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(destroy);
});

test.serial('must set name when reviving toggle', async t => {
    const { request, destroy } = await setupApp('archive_serial');
    return request
        .post('/api/archive/revive/')
        .expect(404)
        .then(destroy);
});
