const express = require('express');
const router = express.Router();
const terminalService = require('../services/terminal.service');

// routes
router.post('/create-terminal', create);
router.put('/update-terminal/:id', update);
router.get('/get-terminals/', getAll);
router.get('/get-terminals-unused/', getUnused);
router.post('/get-terminal-records/', getTerminalRecords);
router.post('/table-terminal/', getTable);
router.get('/get-terminal/:id',getTerminal);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    terminalService.create(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

/**
 * PUT update
 */
function update(req, res, next) {
    terminalService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    terminalService.getAll()
        .then(terminals => res.json(terminals))
        .catch(err => next(err));
}

/**
 * GET getUnused
 */
function getUnused(req, res, next) {
    terminalService.getUnused()
        .then(terminals => res.json(terminals))
        .catch(err => next(err));
}

/**
 * POST getTerminalRecords
 */
function getTerminalRecords(req, res, next) {
    terminalService.getTerminalRecords(req.body)
        .then(records => res.json(records))
        .catch(err => next(err));
}

/**
 * GET getTerminal
 */
function getTerminal(req, res, next) {
    terminalService.getTerminal(req.params.id)
        .then(terminal => res.json(terminal))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    terminalService.dataTable()
        .then(terminals => terminals ? res.json(terminals) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}