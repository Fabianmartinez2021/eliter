const express = require('express');
const router = express.Router();
const clientService = require('../services/client.service');

// routes
router.get('/', getAll);
router.get('/:id', getById);
router.put('/update-client/:id', update);
router.post('/table-clients/', getTable);
router.post('/search-document/', search);
module.exports = router;

function getAll(req, res, next) {
    clientService.getAll()
        .then(clients => res.json(clients))
        .catch(err => next(err));
}


function getById(req, res, next) {
    clientService.getById(req.params.id)
        .then(client => client ? res.json(client) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    clientService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    clientService.dataTable(req.body)
        .then(clients => {
            return clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponible' });
        })
        .catch(err => next(err));
}

/**
 * POST buscar cliente typeahead
 */
function search(req, res, next) {
    clientService.search(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}