const express = require('express');
const router = express.Router();
const resguardService = require('../services/resguard.service');

// routes
router.post('/addition', addition);     // Ingresar dinero de caja a resguardo     
router.post('/withdrawal', withdrawal); // Retirar todo el dinero del resguardo
router.post('/resguard-report/', resguardReport);
router.post('/table-history/', resguardHistory);
router.post('/withdrawal-table-history/', resguardWithdrawalsHistory);
router.post('/get-operation/:id', getResguardOperation);
router.put('/confirm-withdrawal/:id', confirmWithdrawal);
router.put('/confirm-multiple-withdrawals', confirmMultipleWithdrawals);
//router.post('/get-withdrawal', getWithdrawal);
module.exports = router;

// Adición de dinero a resguardo
function addition(req, res, next) {
    resguardService.addition(req.body.user, req.body.resguard)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

// Retiro de resguardo
function withdrawal(req, res, next) {
    resguardService.withdrawal(req.body.user, req.body.resguard)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

// Confirmar un retiro que se haya realizado por un gerente, cuando el dinero llegue correctamente
function confirmWithdrawal(req, res, next) {
    resguardService.confirmWithdrawal(req.body, req.params.id)
        .then(data => data ? res.json(data) : res.sendStatus(404))
        .catch(err => next(err));
}
// confirmaciones multiples de retiros
function confirmMultipleWithdrawals(req, res, next) {
    resguardService.confirmMultipleWithdrawals(req.body, req.body.ids)
        .then(data => res.json({ updated: data.length }))
        .catch(err => next(err));
}

// Historial de resguardo
function resguardHistory(req, res, next) {
    resguardService.resguardHistory(req.body)
        .then(resguards => resguards ? res.json(resguards) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

// Historial retiros de resguardo
function resguardWithdrawalsHistory(req, res, next) {
    resguardService.resguardWithdrawalsHistory(req.body)
        .then(resguards => resguards ? res.json(resguards) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function getResguardOperation(req, res, next) {
    resguardService.getResguardOperation(req.body, req.params.id)
        .then(data => data ? res.json(data) : res.sendStatus(404))
        .catch(err => next(err));
}

// Obtener un retiro para confirmarlo
/*function getWithdrawal(req, res, next) {
    resguardService.getWithdrawal(req.body)
        .then(resguards => resguards ? res.json(resguards) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}*/

// Confirmar un retiro
/*function confirmWithdrawal(req, res, next) {
    resguardService.confirmWithdrawal(req.body)
        .then(resguards => resguards ? res.json(resguards) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}*/

//Reporte de resguardo (Para ver cuanto hay actualmente)
function resguardReport(req, res, next) {
    resguardService.resguardReport(req.body)
        .then(resguards => resguards ? res.json(resguards) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

