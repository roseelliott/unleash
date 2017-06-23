'use strict';

const { test } = require('ava');
const store = require('./fixtures/store');
const supertest = require('supertest');
const logger = require('../../../lib/logger');
const getApp = require('../../../lib/app');

const { EventEmitter } = require('events');
const eventBus = new EventEmitter();

test.beforeEach(() => {
    logger.setLevel('FATAL');
});

function getSetup () {
    const base = `/random${Math.round(Math.random() * 1000)}`;
    const stores = store.createStores();
    const app = getApp({
        baseUriPath: base,
        stores,
        eventBus,
    });

    return {
        base,
        featureToggleStore: stores.featureToggleStore,
        request: supertest(app),
    };
}

test('should get api defintion', t => {
    const { request, base } = getSetup();
    return request
        .get(`${base}/api/`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
            t.truthy(res.body);
            t.true(res.body.links['api-admin'].uri === '/api/admin');
        });
});

test('should get admin api defintion', t => {
    const { request, base } = getSetup();
    return request
        .get(`${base}/api/admin`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
            t.truthy(res.body);
            t.true(res.body.links['feature-toggles'].uri === '/api/admin/features');
        });
});

test('should get client api defintion', t => {
    const { request, base } = getSetup();
    return request
        .get(`${base}/api/client`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
            t.truthy(res.body);
            t.true(res.body.links['client-metrics'].uri === '/api/client/metrics');
        });
});
