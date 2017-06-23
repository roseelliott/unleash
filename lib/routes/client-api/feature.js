'use strict';

const { Router } = require('express');
const commonFeatureToggle = require('../common/feature.js');

exports.router = (config) => {
    const router = Router(); // eslint-disable-line new-cap

    router.get('/', commonFeatureToggle.router(config));

    return router;
};
