const express = require('express');
const router = express.Router();
const pendingValesService = require('../services/pendingVales.service');

// routes
router.post('/create-pending-vales',  create);     //  Crear un crédito
router.post('/table-pending-vales/', getTable);   //  Obtener todos los créditos
router.put('/update-pending-vales/:id', update);  //  Realizar abonos o directamente pagar el crédito
router.post('/typeahead-pending-vales/', search);  // POST buscar pago pendiente typeahead por numero de documento

module.exports = router;

/**
 * POST create pending payment
 */
function create(req, res, next) {
    pendingValesService.create(req.body)
        .then(ticket => res.json(ticket))
        .catch(err => next(err));
}

/**
 * PUT update para realizar pagos
 */
function update(req, res, next) {
    pendingValesService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable obtiene todos los datos de los pagos pendiente
 */
function getTable(req, res, next) {
    pendingValesService.dataTable(req.body)
        .then(pendingVales => {
            // Verificar si hay resultados
            const hasResults = pendingVales && 
                               pendingVales.results && 
                               Array.isArray(pendingVales.results) && 
                               pendingVales.results.length > 0;
            
            if (hasResults) {
                res.json(pendingVales);
            } else {
                res.json({
                    results: [],
                    metadata: [{ total: 0 }],
                    totalPending: 0,
                    message: 'No hay registros para mostrar'
                });
            }
        })
        .catch(err => next(err));
}

/**
 * POST buscar pago pendiente typeahead por numero de documento
 */
function search(req, res, next) {
    pendingValesService.searchTypeahead(req.body)
        .then(clients => clients ? res.json(clients) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

