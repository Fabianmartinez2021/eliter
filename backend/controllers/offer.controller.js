const express = require('express');
const router = express.Router();
const offerService = require('../services/offer.service');

// routes
router.post('/create-offer', create);
router.post('/table-offer/', getTable);
router.delete('/remove-offer/:id', removeOffer);
router.post('/report-offer/', reportOffers);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    offerService.create(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    offerService.dataTable(req.body)
        .then(products => products ? res.json(products) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * DELETE removeOffer elimina ofertas 
 */
function removeOffer(req, res, next) {
    offerService.removeOffer(req.params.id, req.body)
        .then(offers => offers ? res.json(offers) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST reportOffers
 */
function reportOffers(req, res, next) {
    offerService.reportOffers(req.body)
        .then(offers => offers ? res.json(offers) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}