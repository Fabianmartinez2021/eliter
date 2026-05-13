const express = require('express');
const router = express.Router();
const inventoryMiscellaneousService = require('../services/inventoryMiscellaneous.service');

// routes
router.post('/create-inventory', create);
router.post('/table-pending', getTablePending);
router.patch('/approve-inventory/:id', approvePending);
router.get('/get-pending/:id', getPendingById);
router.post('/table-inventory', getTable);
router.put('/update-pending/:id', updatePending);
router.put('/readjustment-inventory/:id', readjustment);
router.post('/create-departure', createDeparture);
router.post('/table-history/', getTableHistory);
router.post('/report-inventories/', getInventoryReport);
router.post('/report-inventories-mixed/', getInventoryReportMixed);
router.post('/report-inventories-weekly/', getInventoryReportWeekly);
module.exports = router;


router.get('/get-inventories/', getAll);
router.put('/update-inventory/:id', update);
router.get('/get-inventory/:id', getInventory);
router.post('/report-sales/', reportSales);
router.post('/report-offers/', reportOffers);
router.post('/report-balance/', getBalanceReport);
router.post('/report-inventories-daily/', getInventoryReportDaily);
router.post('/report-inventories-plus/', getInventoryReportPlus);
router.post('/detail-decrease/', detailDecreases);
router.post('/detail-departures/', detailDepartures);
router.post('/detail-cut/', detailCut);
router.post('/table-history-adjustment/', getTableAdjustmentHistory);
router.post('/table-entry-history', getTableEntryHistory);
router.put('/reset-inventory/:id', resetInventory);

/**
 * POST create
 */
function create(req, res, next) {
    inventoryMiscellaneousService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function approvePending(req, res, next) {
    const { id } = req.params;
    const { comment = '' } = req.body;


    inventoryMiscellaneousService.approvePendingToInventory(id, comment)
        .then(() => res.json({ message: 'Inventario registrado exitosamente' }))
        .catch(err => next(err));
}

function getTablePending(req, res, next) {
    inventoryMiscellaneousService.dataTablePending(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function getPendingById(req, res, next) {
  const { id } = req.params;

  inventoryMiscellaneousService.getPendingById(id)
    .then(pending => {
      // retornamos para evitar ejecución posterior
      return pending
        ? res.json(pending)
        : res.status(404).json({ message: "Producto no encontrado" });
    })
    .catch(err => {
      console.error('getPendingById error:', err);
      return res.status(500).json({ message: "Error interno del servidor", error: err.message });
    });
}

function updatePending(req, res, next) {
  const { id } = req.params;
  const pendingData = req.body; // <-- aquí tomamos todo el body
  const userId = req.user.id;


  inventoryMiscellaneousService.updatePending(id, pendingData, userId)
    .then(updated => {
      updated
        ? res.json(updated)
        : res.status(404).json({ message: "Producto no encontrado" });
    })
    .catch(err => {
      console.error('updatePending error:', err);
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    });
}

/**
 * POST getTable
 */
function getTable(req, res, next) {
    inventoryMiscellaneousService.dataTable(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * PUT update readjustment reajuste de inventario
 */
function readjustment(req, res, next) {
    inventoryMiscellaneousService.readjustment(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST create
 */
function createDeparture(req, res, next) {
    inventoryMiscellaneousService.createDeparture(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTableHistory(req, res, next) {
    inventoryMiscellaneousService.dataTableHistory(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * Reporte de inventarios
 */
function getInventoryReport(req, res, next) {
    inventoryMiscellaneousService.dataTableInventoryReport(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => {console.log(err); next(err)});
}

/**
 * Reporte de inventarios semanal (total usado por producto y sucursal)
 */
function getInventoryReportWeekly(req, res, next) {
    inventoryMiscellaneousService.dataTableInventoryReportWeekly(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => { console.log(err); next(err); });
}

/**
 * Reporte de inventarios con la data mexclada
 */
function getInventoryReportMixed(req, res, next) {
    inventoryMiscellaneousService.dataTableInventoryReportMixed(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => {console.log(err); next(err)});
}


















/**
 * PUT update
 */
function update(req, res, next) {
    inventoryMiscellaneousService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * PUT reset
 */
function resetInventory(req, res, next) {
    inventoryMiscellaneousService.resetInventory(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * PUT update readjustment reajuste de inventario
 */
function readjustment(req, res, next) {
    inventoryMiscellaneousService.readjustment(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    inventoryMiscellaneousService.getAll()
        .then(inventories => res.json(inventories))
        .catch(err => next(err));
}

/**
 * GET getInventory
 */
function getInventory(req, res, next) {
    inventoryMiscellaneousService.getInventory(req.params.id)
        .then(inventory => res.json(inventory))
        .catch(err => next(err));
}

/**
 * Reporte de ventas
 * POST reportSales
 */
function reportSales(req, res, next) {
    inventoryMiscellaneousService.reportSales(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * Reporte de ofertas
 * POST reportOffers
 */
function reportOffers(req, res, next) {
    inventoryMiscellaneousService.reportOffers(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}



/**
 * Reporte de balances
 */
function getBalanceReport(req, res, next) {
    inventoryMiscellaneousService.getBalanceReport(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * Reporte de inventarios diario
 */
function getInventoryReportDaily(req, res, next) {
    inventoryMiscellaneousService.dataTableInventoryReportDaily(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * Reporte de inventarios sin salidas basico
 */
function getInventoryReportPlus(req, res, next) {
    inventoryMiscellaneousService.dataTableInventoryReportPlus(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//detalle de mermas
function detailDecreases(req, res, next) {
    inventoryMiscellaneousService.detailDecreases(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//detalle de salidas
function detailDepartures(req, res, next) {
    inventoryMiscellaneousService.detailDepartures(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//detalle de recortes
function detailCut(req, res, next) {
    inventoryMiscellaneousService.detailCut(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST getTable
 */
function getTableAdjustmentHistory(req, res, next) {
    inventoryMiscellaneousService.dataTableAdjustmentHistory(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * POST Historial de salidas
 */
function getTableEntryHistory(req, res, next) {
    inventoryMiscellaneousService.dataTableEntryHistory(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}