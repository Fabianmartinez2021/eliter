const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticket.service');
const userService = require('../services/user.service');

// routes
router.post('/create-ticket', create);
router.post('/table-ticket/', getTable);
router.post('/table-ticket-wholesale/', getTableWholesale);
router.put('/update-ticket/:id', update);
router.delete('/remove-ticket/:id', removeTicket);

module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    ticketService.create(req.body)
        .then(ticket => res.json(ticket))
        .catch(err => next(err));
}

/**
 * PUT update ticket
 */
function update(req, res, next) {
    ticketService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable obtiene ventas en espera 
 */
function getTable(req, res, next) {
    ticketService.dataTable(req.body)
        .then(tickets => tickets ? res.json(tickets) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST getTableWholesale obtiene ventas al Mayor en espera 
 */
 function getTableWholesale(req, res, next) {
    ticketService.dataTableWholesale(req.body)
        .then(tickets => tickets ? res.json(tickets) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * DELETE removeTicket elimina ventas en espera 
 */
function removeTicket(req, res, next) {
    if (!req.user || !req.user.sub) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    userService.getById(req.user.sub)
        .then(user => ticketService.removeTicket(req.params.id, { ...req.body, user }))
        .then(tickets => tickets ? res.json(tickets) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}