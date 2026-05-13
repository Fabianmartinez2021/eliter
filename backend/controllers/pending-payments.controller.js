const express = require('express');
const router = express.Router();
const pendingPaymentsService = require('../services/pendingPayments.service');

// routes
router.post('/create-pending-payments',  create);     //  Crear un crédito
router.post('/table-pending-payments/', getTable);   //  Obtener todos los créditos
router.put('/update-pending-payments/:id', update);  //  Realizar abonos o directamente pagar el crédito
router.post('/typeahead-pending-payments/', search);  // POST buscar pago pendiente typeahead por numero de documento

module.exports = router;

/**
 * POST create pending payment
 */
function create(req, res, next) {
    pendingPaymentsService.create(req.body)
        .then(ticket => res.json(ticket))
        .catch(err => next(err));
}

/**
 * PUT update para realizar pagos
 */
function update(req, res, next) {
    pendingPaymentsService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable obtiene todos los datos de los pagos pendiente
 */
function getTable(req, res, next) {
    pendingPaymentsService.dataTable(req.body)
        .then(pendingPayments => pendingPayments ? res.json(pendingPayments) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST buscar pago pendiente typeahead por numero de documento
 */
function search(req, res, next) {
    pendingPaymentsService.searchTypeahead(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

