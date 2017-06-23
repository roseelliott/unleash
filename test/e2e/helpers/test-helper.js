'use strict';

process.env.NODE_ENV = 'test';

// because of db-migrate bug (https://github.com/Unleash/unleash/issues/171)
process.setMaxListeners(0);

const supertest = require('supertest');
const migrator = require('../../../migrator');
const { createStores } = require('../../../lib/db');
const { createDb } = require('../../../lib/db/db-pool');
const getApp = require('../../../lib/app');
require('db-migrate-shared').log.silence(true);

// because of migrator bug
delete process.env.DATABASE_URL;

const { EventEmitter } = require('events');
const eventBus = new EventEmitter();

function createApp(databaseSchema = 'test') {
    const options = {
        databaseUrl: require('./database-config').getDatabaseUrl(),
        databaseSchema,
        minPool: 0,
        maxPool: 0,
    };
    const db = createDb({
        databaseUrl: options.databaseUrl,
        minPool: 0,
        maxPool: 0,
    });

    return db
        .raw(`CREATE SCHEMA IF NOT EXISTS ${options.databaseSchema}`)
        .then(() => migrator(options))
        .then(() => {
            db.destroy();
            const stores = createStores(options);
            const app = getApp({ stores, eventBus });
            return {
                stores,
                request: supertest(app),
                destroy() {
                    return stores.db.destroy();
                },
            };
        });
}

function createStrategies(stores) {
    return [
        {
            name: 'default',
            description: 'Default on or off Strategy.',
            parameters: [],
        },
        {
            name: 'usersWithEmail',
            description:
                'Active for users defined  in the comma-separated emails-parameter.',
            parameters: [{ name: 'emails', type: 'string' }],
        },
    ].map(strategy => stores.strategyStore._createStrategy(strategy));
}

function createApplications(stores) {
    return [
        {
            appName: 'demo-app-1',
            strategies: ['default'],
        },
        {
            appName: 'demo-app-2',
            strategies: ['default', 'extra'],
            description: 'hello',
        },
    ].map(client => stores.clientApplicationsStore.upsert(client));
}

function createClientInstance(stores) {
    return [
        {
            appName: 'demo-app-1',
            instanceId: 'test-1',
            strategies: ['default'],
            started: Date.now(),
            interval: 10,
        },
        {
            appName: 'demo-seed-2',
            instanceId: 'test-2',
            strategies: ['default'],
            started: Date.now(),
            interval: 10,
        },
    ].map(client => stores.clientInstanceStore.insert(client));
}

function createFeatures(stores) {
    return [
        {
            name: 'featureX',
            description: 'the #1 feature',
            enabled: true,
            strategies: [{ name: 'default', parameters: {} }],
        },
        {
            name: 'featureY',
            description: 'soon to be the #1 feature',
            enabled: false,
            strategies: [
                {
                    name: 'baz',
                    parameters: {
                        foo: 'bar',
                    },
                },
            ],
        },
        {
            name: 'featureZ',
            description: 'terrible feature',
            enabled: true,
            strategies: [
                {
                    name: 'baz',
                    parameters: {
                        foo: 'rab',
                    },
                },
            ],
        },
        {
            name: 'featureArchivedX',
            description: 'the #1 feature',
            enabled: true,
            archived: true,
            strategies: [{ name: 'default', parameters: {} }],
        },
        {
            name: 'featureArchivedY',
            description: 'soon to be the #1 feature',
            enabled: false,
            archived: true,
            strategies: [
                {
                    name: 'baz',
                    parameters: {
                        foo: 'bar',
                    },
                },
            ],
        },
        {
            name: 'featureArchivedZ',
            description: 'terrible feature',
            enabled: true,
            archived: true,
            strategies: [
                {
                    name: 'baz',
                    parameters: {
                        foo: 'rab',
                    },
                },
            ],
        },
    ].map(feature => stores.featureToggleStore._createFeature(feature));
}

function resetDatabase(stores) {
    return Promise.all([
        stores.db('strategies').del(),
        stores.db('features').del(),
        stores.db('client_applications').del(),
        stores.db('client_instances').del(),
    ]);
}

function setupDatabase(stores) {
    return Promise.all(
        createStrategies(stores).concat(
            createFeatures(stores)
                .concat(createClientInstance(stores))
                .concat(createApplications(stores))
        )
    );
}

module.exports = {
    setupApp(name) {
        return createApp(name).then(app =>
            resetDatabase(app.stores)
                .then(() => setupDatabase(app.stores))
                .then(() => app)
        );
    },
};
