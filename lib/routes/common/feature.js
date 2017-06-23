'use strict';

const { Router } = require('express');
const version = 1;

const legacyFeatureMapper = require('../../data-helper/legacy-feature-mapper');

exports.router = (config) => {
    const { featureToggleStore } = config.stores;
    const router = Router(); // eslint-disable-line new-cap

    router.get('/', (req, res) => {
        featureToggleStore
            .getFeatures()
            .then(features =>
                features.map(legacyFeatureMapper.addOldFields)
            )
            .then(features => res.json({ version, features }));
    });

    return router;
};


