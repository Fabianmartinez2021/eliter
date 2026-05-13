const express = require('express');
const router = express.Router();
const orderMiscellaneousService = require('../services/order-miscellaneous.service');

// routes
router.post('/create-order', create);
router.put('/update-order/:id', update);
router.post('/table-order/', getTable);
router.post('/get-order/:id', getOrder);
router.get('/get-order-helper/', getOrderHelper);
router.post('/set-order-helper/', setOrderHelper);

module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    orderMiscellaneousService.create(req.body)
        .then(order => res.json(order))
        .catch(err => next(err));
}


/**
 * PUT update
 */
function update(req, res, next) {
    orderMiscellaneousService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}


/**
 * POST
 */
function getOrder(req, res, next) {
    orderMiscellaneousService.getOrder(req.params.id)
        .then(order => res.json(order))
        .catch(err => next(err));
}

// Tabla de pedidos
function getTable(req, res, next) {
    orderMiscellaneousService.orderTable(req.body)
        .then(order => order ? res.json(order) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * GET
 */
function getOrderHelper(req, res, next) {
    orderMiscellaneousService.getOrderHelper()
        .then(order => res.json(order))
        .catch(err => next(err));
}


/**
 * POST
 */
function setOrderHelper(req, res, next) {
    orderMiscellaneousService.setOrderHelper(req.body)
        .then(order => res.json(order))
        .catch(err => next(err));
}
