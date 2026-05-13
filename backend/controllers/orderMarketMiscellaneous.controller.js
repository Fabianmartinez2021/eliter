const express = require('express');
const router = express.Router();
const orderMarketMiscellaneousService = require('../services/orderMarketMiscellaneous.service');

// routes
router.get('/get-order-market-miscellaneous/:id', getOrderMarketMiscellaneous);
router.post('/table-order-market-miscellaneous/', getTable);
router.put('/update-order-market-miscellaneous/:id', update);

module.exports = router;

/**
 * GET una orden de mercado misceláneos
 */
function getOrderMarketMiscellaneous(req, res, next) {
  orderMarketMiscellaneousService
    .getOrderMarketMiscellaneous(req.params.id)
    .then((order) => res.json(order))
    .catch((err) => next(err));
}

/**
 * POST tabla de órdenes de mercado misceláneos con paginación y filtros
 */
function getTable(req, res, next) {
  orderMarketMiscellaneousService
    .dataTable(req.body)
    .then((orders) =>
      orders
        ? res.json(orders)
        : res.status(400).json({ message: 'No hay información disponible' })
    )
    .catch((err) => next(err));
}

/**
 * PUT actualizar orden de mercado misceláneos
 */
function update(req, res, next) {
  orderMarketMiscellaneousService
    .update(req.params.id, req.body)
    .then((order) => res.json(order))
    .catch((err) => next(err));
}
