const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');

// routes
router.post('/authenticate', authenticate);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/sellers/:id', getSellerById);
router.get('/sellers', getSellers);
router.get('/:id', getById);
router.put('/update-user/:id', update);
router.post('/table-users/', getTable);
router.post('/list-users/', listUserAgency);
/* Vendedores */
router.post('/register-seller', registerSeller);
router.put('/update-seller/:id', updateSeller);
module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'El usuario o contraseña son inválidos' }))
        .catch(err => next(err));
}

function getFrontendOrigin(req) {
    if (req.body?.origin && /^https?:\/\//i.test(req.body.origin)) return req.body.origin;
    if (req.headers.origin && /^https?:\/\//i.test(req.headers.origin)) return req.headers.origin;
    if (req.headers.referer) {
        try { return new URL(req.headers.referer).origin; } catch (e) {}
    }
    return '';
}

function forgotPassword(req, res, next) {
    const emailOrUsername = req.body.email || req.body.username || '';
    const origin = getFrontendOrigin(req);
    const option = req.body.option || 'password';
    userService.forgotPassword(emailOrUsername, origin, option)
        .then(() => res.json({ message: 'Si existe una cuenta con ese dato y tiene correo asociado, recibirás un correo en unos minutos.' }))
        .catch(err => next(err));
}

function resetPassword(req, res, next) {
    const { token, newPassword } = req.body;
    userService.resetPassword(token, newPassword)
        .then(() => res.json({ message: 'Contraseña actualizada correctamente.' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => {
            return user ? res.json(user) : res.sendStatus(404);
        })
        .catch(err => next(err));
}

function update(req, res, next) {
    const body = { ...req.body };
    body.origin = getFrontendOrigin(req) || body.origin;
    userService.update(req.params.id, body)
        .then((user) => res.json(user || {}))
        .catch(err => next(err));
}

function verifyEmail(req, res, next) {
    const token = req.body.token || req.query.token || '';
    userService.verifyEmail(token)
        .then((user) => res.json({ message: 'Correo verificado correctamente.', user }))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    userService.dataTable(req.body)
        .then(users => users ? res.json(users) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST listUserAgency
 * 
 * Obtener listado de usuarios de una agencia o todas
 */
function listUserAgency(req, res, next) {
    userService.getUsersAgency(req.body)
        .then(users => users ? res.json(users) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}


// Sección para los vendedores

function registerSeller(req, res, next) {
    userService.registerSeller(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getSellers(req, res, next) {
    userService.getSellers()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getSellerById(req, res, next) {
    userService.getSellerById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function updateSeller(req, res, next) {
    userService.updateSeller(req.params.id, req.body)
        .then(seller => res.json(seller || {}))
        .catch(err => next(err));
}