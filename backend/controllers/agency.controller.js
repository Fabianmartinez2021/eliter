const express = require('express');
const router = express.Router();
const agencyService = require('../services/agency.service');

// routes
router.post('/create-agency', create);
router.put('/update-agency/:id', update);
router.get('/get-agencies/', getAll);
router.post('/table-agency/', getTable);
router.get('/get-agency/:id',getAgency);
//router.get('/inventory-close-history', getInventoryCloseHistory);
router.post('/agency-close-history', agencyCloseHistory);
router.post('/close-agency/', closeAgency);

module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    agencyService.create(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

/**
 * PUT update
 */
function update(req, res, next) {
    agencyService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    agencyService.getAll()
        .then(agencies => res.json(agencies))
        .catch(err => next(err));
}

/**
 * GET getAgency
 */
function getAgency(req, res, next) {
    agencyService.getAgency(req.params.id)
        .then(agency => res.json(agency))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    agencyService.dataTable()
        .then(agencies => agencies ? res.json(agencies) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}


/**
 * Funcion para cerrar la tienda
 */

function closeAgency(req, res, next) {
    agencyService.closeAgency(req.body)
        .then(agencies => res.json(agencies))
        .catch(err => next(err));
}


/**
 * GET Historial de cierre de las tiendas
 */

function agencyCloseHistory(req, res, next) {
    agencyService.agencyCloseHistory(req.body)
        .then(agencies => res.json(agencies))
        .catch(err => next(err));
}
