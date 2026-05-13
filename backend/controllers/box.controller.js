const express = require('express');
const router = express.Router();
const boxService = require('../services/box.service');

// routes
router.post('/box-opening', create);
router.post('/box-withdrawal', withdrawal);
router.post('/box-report', boxReport);
router.post('/box-details', boxDetails);
router.post('/box-to-close-report', boxToCloseReport);
router.post('/box-close', boxClose);
router.post('/box-close-report', boxCloseReport);
router.post('/box-correction', boxCorrection);
router.post('/table-history/', getTableHistory);
router.post('/box-addition', addition);
module.exports = router;

//Apertura de caja
function create(req, res, next) {
    boxService.create(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

//Retiro de caja
function withdrawal(req, res, next) {
    boxService.withdrawal(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

//Reporte de caja
function boxReport(req, res, next) {
    boxService.boxReport(req.body)
        .then(boxes => boxes ? res.json(boxes) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function boxDetails(req, res, next) {
    boxService.boxDetails(req.body)
        .then(boxes => boxes ? res.json(boxes) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//Reporte de caja para cierre
function boxToCloseReport(req, res, next) {
    boxService.boxToCloseReport(req.body)
        .then(boxes => boxes ? res.json(boxes) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function boxClose(req, res, next) {
    boxService.boxClose(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

//Reporte de caja para cierre
function boxCloseReport(req, res, next) {
    boxService.boxCloseReport(req.body)
        .then(boxes => boxes ? res.json(boxes) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//Correccion de caja
function boxCorrection(req, res, next) {
    boxService.boxCorrection(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

// Historial de caja
function getTableHistory(req, res, next) {
    boxService.getTableHistory(req.body)
        .then(boxes => boxes ? res.json(boxes) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

// Adición de dinero a caja
function addition(req, res, next) {
    boxService.addition(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}