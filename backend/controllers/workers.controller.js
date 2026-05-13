const express = require('express');
const router = express.Router();
const workerService = require('../services/worker.service');

// routes
/* Operadores */
router.get('/operators/:id', getOperatorById);
router.get('/operators', getOperators);
/* Operadores */
router.post('/register-operator', registerOperator);
router.put('/update-operator/:id', updateOperator);


/* Reportes */
router.post('/operators-performance-report', operatorPerformanceReport);
router.post('/cashiers-performance-report', cashierPerformanceReport);

module.exports = router;


// Sección para los operadores


function registerOperator(req, res, next) {
    workerService.registerOperator(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getOperators(req, res, next) {
    workerService.getOperators()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getOperatorById(req, res, next) {
    workerService.getOperatorById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function updateOperator(req, res, next) {
    workerService.updateOperator(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

// Rendimiento de los operadores
function operatorPerformanceReport(req, res, next) {
    workerService.operatorPerformanceReport(req.body)
        .then(users => users ? res.json(users) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

// Rendimiento de los cajeros
function cashierPerformanceReport(req, res, next) {
    workerService.cashierPerformanceReport(req.body)
        .then(users => users ? res.json(users) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}