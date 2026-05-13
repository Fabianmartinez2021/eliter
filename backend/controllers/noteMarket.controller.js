const express = require('express');
const router = express.Router();
const noteMarketService = require('../services/noteMarket.service');

// routes
router.post('/create-note-market', create);
router.get('/get-note-markets/', getAll);
router.post('/table-note-market/', getTable);
router.get('/get-note-market/:id', getNoteMarket);
router.put('/update-note-market/:id', update);

module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    noteMarketService.create(req.body)
        .then(noteMarket => res.json(noteMarket))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    noteMarketService.getAll()
        .then(noteMarkets => res.json(noteMarkets))
        .catch(err => next(err));
}

/**
 * POST getTable - Obtener tabla con paginación y filtros
 */
function getTable(req, res, next) {
    noteMarketService.dataTable(req.body)
        .then(noteMarkets => noteMarkets ? res.json(noteMarkets) : res.status(400).json({ message: 'No hay información disponible' }))
        .catch(err => next(err));
}

/**
 * GET getNoteMarket
 */
function getNoteMarket(req, res, next) {
    noteMarketService.getNoteMarket(req.params.id)
        .then(noteMarket => res.json(noteMarket))
        .catch(err => next(err));
}

/**
 * PUT update note market
 */
function update(req, res, next) {
    noteMarketService.update(req.params.id, req.body)
        .then(noteMarket => res.json(noteMarket))
        .catch(err => next(err));
}

