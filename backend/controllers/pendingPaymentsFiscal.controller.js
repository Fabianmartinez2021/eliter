const express = require('express');
const router = express.Router();
const pendingPaymentsFiscalService = require('../services/pendingPaymentsFiscal.service');
const pendingPaymentsService = require('../services/pendingPayments.service')

// routes
router.post('/create-pending-payments', create);     //  Crear un crédito
router.post('/table-pending-payments/', getTable);   //  Obtener todos los créditos
router.put('/update-pending-payments/:id', update);  //  Realizar abonos o directamente pagar el crédito
router.post('/typeahead-pending-payments/', search);  // POST buscar pago pendiente typeahead por numero de documento

module.exports = router;

/**
 * POST create pending payment
 */
function create(req, res, next) {
    Promise.all([
        pendingPaymentsFiscalService.create(req.body),
        pendingPaymentsService.create(req.body)
    ])
    .then(([fiscalTicket, ticket]) => {
        res.json({ fiscalTicket, ticket });
    })
    .catch(err => next(err));
}

function update(req, res, next) {
   
    Promise.all([
        pendingPaymentsFiscalService.update(req.params.id, req.body),
        pendingPaymentsService.update(req.params.id, req.body)
    ])
    .then(([fiscalTicket, ticket]) => {
        res.json({ fiscalTicket, ticket });
    })
    .catch(err => next(err));
}
/**
 * POST getTable obtiene todos los datos de los pagos pendiente
 */
function getTable(req, res, next) {
    pendingPaymentsFiscalService.dataTable(req.body)
        .then(pendingPayments => pendingPayments ? res.json(pendingPayments) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST buscar pago pendiente typeahead por numero de documento
 */
function search(req, res, next) {
    pendingPaymentsFiscalService.searchTypeahead(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

