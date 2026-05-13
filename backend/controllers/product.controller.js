const express = require('express');
const router = express.Router();
const productService = require('../services/product.service');
const productNextDayPriceService = require('../services/productNextDayPrice.service');

// routes
router.post('/create-product', create);
router.put('/update-product/:id', update);
router.get('/get-products/', getAll);
router.get('/product-offer/:id', getProductOffer);//id de agencia para ofertas
router.post('/table-product/', getTable);
router.post('/table-product-history/', getTableHistory);
router.get('/get-product/:id', getProduct);
router.put('/update-prices-next-day', updatePricesNextDay);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    productService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * PUT update
 */
function update(req, res, next) {
    productService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    productService.getAll()
        .then(products => res.json(products))
        .catch(err => next(err));
}

/**
 * POST getProductOffer
 */
function getProductOffer(req, res, next) {
    productService.getProductOffer(req.params.id)
        .then(products => res.json(products))
        .catch(err => next(err));
}

/**
 * GET getAgency
 */
function getProduct(req, res, next) {
    productService.getProduct(req.params.id)
        .then(product => res.json(product))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    productService.dataTable()
        .then(products => products ? res.json(products) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}
/**
 * POST getTable
 */
function getTableHistory(req, res, next) {
    productService.dataTableHistory(req.body)
        .then(products => products ? res.json(products) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * PUT updatePricesNextDay
 */
function updatePricesNextDay(req, res, next) {
    // El frontend envía { rate, products }, pero solo necesitamos products
    const products = req.body.products || req.body;
    productNextDayPriceService.updatePrices(products)
        .then(result => res.json(result))
        .catch(err => next(err));
}