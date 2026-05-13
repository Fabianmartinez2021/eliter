const express = require('express');
const router = express.Router();
const pendingPaymentsService = require('../services/pendingPayments.service');
const userService = require('../services/user.service');
const roleEnum = require('../enums/roles.enum');

// routes
router.post('/create-pending-payments',  create);     //  Crear un crédito
router.post('/table-pending-payments/', getTable);   //  Obtener todos los créditos
router.put('/update-pending-payments/:id', update);  //  Realizar abonos o directamente pagar el crédito
router.post('/typeahead-pending-payments/', search);  // POST buscar pago pendiente typeahead por numero de documento
router.put('/admin-update-pending/:id', adminUpdatePending);
router.delete('/admin-delete-unpaid-pending/:id', adminDeleteUnpaidPending);

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

function adminUpdatePending(req, res, next) {
    if (!req.user || !req.user.sub) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    userService.getById(req.user.sub)
        .then(user => {
            if (!user || user.role !== roleEnum.rol.Admin) {
                return res.status(403).json({ message: 'Solo administradores pueden editar cuentas pendientes' });
            }
            return pendingPaymentsService.adminUpdatePendingPayment(req.params.id, req.body);
        })
        .then(result => res.json(result))
        .catch(err => next(err));
}

function adminDeleteUnpaidPending(req, res, next) {
    if (!req.user || !req.user.sub) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    userService.getById(req.user.sub)
        .then(user => {
            if (!user || user.role !== roleEnum.rol.Admin) {
                return res.status(403).json({ message: 'Solo administradores pueden eliminar cuentas pendientes' });
            }
            return pendingPaymentsService.adminDeleteUnpaidPendingById(req.params.id);
        })
        .then(result => res.json(result))
        .catch(err => next(err));
}

