'use strict';

const { Router } = require('express');

const adminApi = require('./admin-api');
const clientApi = require('./client-api');

const health = require('./health-check');
const backstage = require('./backstage.js');

exports.router = function(config) {
    const router = Router(); // eslint-disable-line new-cap

    router.use('/health', health.router(config));
    router.use('/internal-backstage', backstage.router(config));

    router.get('/api', (req, res) => {
        res.json({
            version: 1,
            links: Object.assign(
                {
                    'api-admin': { uri: '/api/admin' },
                    'api-client': { uri: '/api/client' },
                },
                adminApi.apiDef.links,
                clientApi.apiDef.links
            ),
        });
    });

    router.use('/api/admin', adminApi.router(config));
    router.use('/api/client', clientApi.router(config));

    return router;
};
