const express = require('express');
const router = express.Router();
const assetsService = require('../services/assets.service');

// routes
router.post('/register', registerAssets);       // Registrar un activo
router.delete('/delete/:id', deleteAssets);     // Eliminar un activo
router.put('/restore/:id', restoreAssets);   // Restaurar un activo de la papelera      
router.get('/:id', getAssetsById);              // Obtener un activo por su id
router.put('/update/:id', updateAssets);        // Actualizar un activo
router.post('/table/', getTableAssets);         // Obtener los activos
router.post('/dump-table/', getDumpTableAssets);// Obtener los activos de la papelera
router.post('/table-record/', getTableAssetsRecord);    // Obtener el registro de activos

module.exports = router;

function registerAssets(req, res, next) {
    assetsService.registerAssets(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function deleteAssets(req, res, next) {
    assetsService.deleteAssets(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function restoreAssets(req, res, next) {
    assetsService.restoreAssets(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAssetsById(req, res, next) {
    assetsService.getAssetsById(req.params.id)
        .then(assets => assets ? res.json(assets) : res.sendStatus(404))
        .catch(err => next(err));
}

function updateAssets(req, res, next) {
    assetsService.updateAssets(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getTableAssets(req, res, next) {
    assetsService.getTableAssets(req.body)
        .then(assets => assets ? res.json(assets) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function getDumpTableAssets(req, res, next) {
    assetsService.getDumpTableAssets(req.body)
        .then(assets => assets ? res.json(assets) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function getTableAssetsRecord(req, res, next) {
    assetsService.getTableAssetsRecord(req.body)
        .then(assets => assets ? res.json(assets) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}
