const express = require('express');
const router = express.Router();
const WholesaleClientService = require('../services/wholesale-client.service');

// routes
router.get('/', getAll);
router.get('/:id', getById);
router.post('/create-client/', create);
router.put('/update-client/:id', update);
router.post('/table-clients/', getTable);
router.post('/search-document/', search);   //  POST buscar cliente typeahead
router.post('/search-code/', searchByCode); //  POST buscar cliente typeahead
module.exports = router;

function getAll(req, res, next) {
    WholesaleClientService.getAll()
        .then(clients => res.json(clients))
        .catch(err => next(err));
}


function getById(req, res, next) {
    WholesaleClientService.getById(req.params.id)
        .then(client => client ? res.json(client) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    WholesaleClientService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    WholesaleClientService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST funcion para obtener la tabla de los clientes al mayor
 */
function getTable(req, res, next) {
    WholesaleClientService.dataTable(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST buscar cliente typeahead por numero de documento
 */
function search(req, res, next) {
    WholesaleClientService.search(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST buscar cliente typeahead por código del cliente
 */
 function searchByCode(req, res, next) {
    WholesaleClientService.searchByCode(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}