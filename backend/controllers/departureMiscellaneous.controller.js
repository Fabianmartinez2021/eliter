const express = require('express');
const router = express.Router();
const departureService = require('../services/departure.service');
const departureMiscellaneousService = require('../services/departureMiscellaneous.service');

// routes
router.post('/create-departure', create);
router.get('/get-departures/', getAll);
router.post('/table-departure/', getTable);
router.get('/get-departure/:id',getDeparture);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    departureMiscellaneousService.create(req.body)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    departureMiscellaneousService.getAll()
        .then(dep => res.json(dep))
        .catch(err => next(err));
}

/**
 * GET
 */
function getDeparture(req, res, next) {
    departureMiscellaneousService.getDeparture(req.params.id)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    departureMiscellaneousService.dataTable(req.body)
        .then(dep => dep ? res.json(dep) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}
