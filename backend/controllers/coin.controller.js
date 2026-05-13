const express = require('express');
const router = express.Router();
const coinService = require('../services/coin.service');

// routes
router.post('/create-coin', create);
router.put('/update-coin/:id', update);
router.get('/get-coins/', getAll);
router.post('/table-coin/', getTable);
router.get('/get-coin/:id',getCoin);
router.post('/table-coin-history/', getTableHistoryCoin);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    coinService.create(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

/**
 * PUT update
 */
function update(req, res, next) {
    coinService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    coinService.getAll()
        .then(coins => res.json(coins))
        .catch(err => next(err));
}

/**
 * GET getCoin
 */
function getCoin(req, res, next) {
    coinService.getCoin(req.params.id)
        .then(coin => res.json(coin))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    coinService.dataTable()
        .then(coins => coins ? res.json(coins) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}
function getTableHistoryCoin(req, res, next) {
    coinService.dataTableHistoryCoin(req.body)
        .then(coins => coins ? res.json(coins) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}