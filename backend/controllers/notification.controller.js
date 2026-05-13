const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');

router.get('/', getMine);
router.put('/ticket/:ticketId/read', markReadByTicket);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;

function getMine(req, res, next) {
    notificationService.getByUserId(req.user.sub)
        .then(list => res.json(list))
        .catch(err => next(err));
}

function markRead(req, res, next) {
    notificationService.markRead(req.params.id, req.user.sub)
        .then(n => n ? res.json(n) : res.status(404).json({ message: 'No encontrada' }))
        .catch(err => next(err));
}

function markReadByTicket(req, res, next) {
    notificationService.markReadByTicket(req.params.ticketId, req.user.sub)
        .then(() => res.json({ message: 'Marcadas como leídas' }))
        .catch(err => next(err));
}

function deleteNotification(req, res, next) {
    notificationService.delete(req.params.id, req.user.sub)
        .then(n => n ? res.json(n) : res.status(404).json({ message: 'No encontrada' }))
        .catch(err => next(err));
}
