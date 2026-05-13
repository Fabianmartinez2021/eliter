const express = require('express');
const router = express.Router();
const seedService = require('../services/seed.service');

// routes
router.post('/seed-db/:id', seed);
//router.post('/seed-db-user/:id', seedUser);
router.post('/clean-db/:id', cleanDB);
router.post('/clean-offers/:id', cleanOffers);
module.exports = router;

/**
 * POST seed
 */
function seed(req, res, next) {
    seedService.seed(req.params.id)
        .then(() =>res.json({ message: 'Se insertó correctamente' }))
        .catch(err => next(err));
}

/**
 * POST seed admin no modificable
 */
function seedUser(req, res, next) {
    seedService.seedAdminUser(req.params.id)
        .then(() =>res.json({ message: 'Se insertó correctamente el usuario' }))
        .catch(err => next(err));
}


/**
 * POST limpiar todos los documentos
 */
function cleanDB(req, res, next) {
    seedService.cleanDB(req.params.id)
        .then(() =>res.json({ message: 'Se limpio la bd correctamente' }))
        .catch(err => next(err));
}

/**
 * POST limpiar ofertas
 */
function cleanOffers(req, res, next) {
    seedService.cleanOffers(req.params.id)
        .then(() =>res.json({ message: 'Se limpio la bd correctamente' }))
        .catch(err => next(err));
}