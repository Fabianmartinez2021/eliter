const express = require('express');
const router = express.Router();
const accountsPayableService = require('../services/accountsPayable.service');

router.post('/create-accounts-payable', create);
router.post('/table-accounts-payable', table);
router.patch('/pay-accounts-payable/:id', pay);
router.patch('/edit-payment-accounts-payable/:id', editPayment);

module.exports = router;

function create(req, res, next) {
    accountsPayableService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function table(req, res, next) {
    accountsPayableService.dataTable(req.body)
        .then(data => (data ? res.json(data) : res.status(400).json({ message: 'No hay información disponible' })))
        .catch(err => next(err));
}

function pay(req, res, next) {
    accountsPayableService.markPaid(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function editPayment(req, res, next) {
    accountsPayableService.updatePayment(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}
