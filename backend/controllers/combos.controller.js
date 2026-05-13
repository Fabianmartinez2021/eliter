const express = require('express');
const router = express.Router();
const Combos = require('../services/combos.service');

// routes
router.get('/', getAll);
router.post('/create', create);
router.get('/get-combo/:id', getCombo);
router.put('/update/:id', update);
router.delete('/delete/:id', deleteCombo);
router.get('/get-combos', getTable);
router.post('/history-combo', getHistoryCombo);

module.exports = router;

function getAll(req, res, next) {
    Combos.getAll()
        .then(clients => res.json(clients))
        .catch(err => next(err));
}

function create(req, res, next) {
    Combos.create(req.body)
        .then(clients => res.json(clients))
        .catch(err => next(err));
}

function getCombo(req, res, next) {
    Combos.getCombo(req.params.id)
        .then(client => client ? res.json(client) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    Combos.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function deleteCombo(req, res, next) {
    Combos.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getTable(req, res, next) {
    Combos.getTable(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getHistoryCombo(req, res, next) {
    Combos.getHistoryCombo(req.body)
        .then(clients => res.json(clients))
        .catch(err => next(err));
}