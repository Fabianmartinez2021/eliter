const express = require('express');
const router = express.Router();

const authorizationCodeService = require('../services/authorizationCode.service');

// routes
router.post('/create', createCode);
router.post('/create-box-withdrawal-code', createBoxWithdrawalCode);
router.delete('/delete/:id', deleteCode);
router.post('/codes/', getCodes);
router.post('/get-code/', getCode);

module.exports = router;

/**
 * POST createCode
 */
function createCode(req, res, next) {
    authorizationCodeService.createCode(req.body)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No se pudo realizar el registro' }))
        .catch(err => next(err));
}

/**
 * POST createBoxWithdrawalCode
 */
function createBoxWithdrawalCode(req, res, next) {
    authorizationCodeService.createBoxWithdrawalCode(req.body)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No se pudo realizar el registro' }))
        .catch(err => next(err));
}


/**
 * DELETE deleteCode
 */
function deleteCode(req, res, next) {
    authorizationCodeService.deleteCode(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getCodes
 */
function getCodes(req, res, next) {
    authorizationCodeService.getCodes(req.body)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST getCode
 */
function getCode(req, res, next) {
    authorizationCodeService.getCode(req.body)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}