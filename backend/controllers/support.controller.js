const express = require('express');
const router = express.Router();
const supportService = require('../services/support.service');

// RUTAS
router.post('/register', register); 
router.post('/delete-batch', deleteBatch);
router.get('/', getAll);            
router.get('/:id', getById);        
router.post('/:id/reply', addReply); 

// --- NUEVO: Ruta para cerrar el ticket ---
router.put('/:id/close', closeTicket);
router.put('/:id/mark-seen', markSeen);
// --- Ruta para eliminar el ticket ---
router.delete('/:id', deleteTicket); 

module.exports = router;

// --- FUNCIONES ---

function register(req, res, next) {
    const params = { 
        ...req.body, 
        user: req.user.sub 
    };

    supportService.create(params)
        .then(support => res.json(support))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    supportService.getAll(req.user.sub)
        .then(supports => res.json(supports))
        .catch(err => next(err));
}

function getById(req, res, next) { 
    supportService.getById(req.params.id, req.user?.sub)
        .then(support => support ? res.json(support) : res.sendStatus(404))
        .catch(err => next(err));
}

function addReply(req, res, next) {
    supportService.addReply(req.params.id, req.body, req.user.sub)
        .then(support => res.json(support))
        .catch(err => next(err));
}

// --- NUEVA FUNCIÓN: Cerrar el ticket ---
function closeTicket(req, res, next) {
    const closedByUserId = req.user?.sub || null;
    supportService.closeTicket(req.params.id, closedByUserId)
        .then(support => res.json(support))
        .catch(err => next(err));
}

function markSeen(req, res, next) {
    supportService.markSeen(req.params.id, req.user?.sub)
        .then(support => support ? res.json(support) : res.sendStatus(404))
        .catch(err => next(err));
}

// --- Eliminar el ticket ---
function deleteTicket(req, res, next) {
    const userId = req.user?.sub || null;
    supportService._delete(req.params.id, userId)
        .then(() => res.json({ message: 'Ticket eliminado correctamente' }))
        .catch(err => next(err));
}

// --- Eliminar tickets por lotes ---
function deleteBatch(req, res, next) {
    const userId = req.user?.sub || null;
    const ids = req.body?.ids || [];
    supportService.deleteBatch(ids, userId)
        .then(result => res.json({ message: `${result.deletedCount} ticket(s) eliminado(s) correctamente`, deletedCount: result.deletedCount }))
        .catch(err => next(err));
}