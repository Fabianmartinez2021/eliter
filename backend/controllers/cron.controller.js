const express = require('express');
const router = express.Router();
const cronService = require('../services/cron.service');

// routes
router.post('/cron-inventory/:id', cronInventory);
router.post('/cron-history', cronHistory);
module.exports = router;

/**
 * POST Cron para actualizar inventario y actualizar totales 
 */
function cronInventory(req, res, next) {
    cronService.cronInventory(req.params.id)
        .then(() => res.json({ message: 'Se ejecuto el cron de inventario correctamente' }))
        .catch(err => next(err));
}

/**
 * POST Cron para reporte de historial de ejecucion del cron
 */
function cronHistory(req, res, next) {
    cronService.dataTableHistoryCron(req.body)
        .then(history => history ? res.json(history) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}