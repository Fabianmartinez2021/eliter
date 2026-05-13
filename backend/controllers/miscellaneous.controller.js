const express = require('express');
const router = express.Router();
const miscellaneousService = require('../services/miscellaneous.service');

// routes
router.post('/create', create);
router.put('/update-miscellaneous/:id', update);
router.post('/table-miscellaneous', getTable);
router.get('/get-miscellaneous/:id', getProduct);
router.post('/table-miscellaneous-history/', getTableHistory);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    miscellaneousService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * PUT update
 */
function update(req, res, next) {
    miscellaneousService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    miscellaneousService.dataTable()
        .then(products => products ? res.json(products) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * GET getProduct
 */
function getProduct(req, res, next) {
    miscellaneousService.getProduct(req.params.id)
        .then(product => res.json(product))
        .catch(err => next(err));
}

/**
 * POST getTableHistory
 */
function getTableHistory(req, res, next) {
    miscellaneousService.dataTableHistory(req.body)
        .then(products => products ? res.json(products) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => {console.log(err) ; next(err)});
}

