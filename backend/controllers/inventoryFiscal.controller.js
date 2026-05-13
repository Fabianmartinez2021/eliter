const express = require('express');
const router = express.Router();
const inventoryFiscalService = require('../services/invetoryFiscal.service');
const userService = require('../services/user.service');


// routes
router.post('/create-inventory-special', create);
router.put('/update-inventory-special/:id', update);
// router.put('/readjustment-inventory/:id', readjustment);
router.get('/get-inventories-special/', getAll);
router.post('/table-inventory-special/', getTable);
router.get('/get-inventory/:id',getInventory);
router.post('/report-sales-special/', reportSales);
// router.post('/report-offers/', reportOffers);
router.post('/table-history-special/', getTableHistory);
router.post('/report-inventories-special/', getInventoryReport);
// router.post('/report-balance/', getBalanceReport);
// router.post('/report-inventories-daily/', getInventoryReportDaily);
// router.post('/report-inventories-plus/', getInventoryReportPlus);
// router.post('/detail-decrease/', detailDecreases);
// router.post('/detail-departures/', detailDepartures);
// router.post('/detail-cut/', detailCut);
// router.post('/table-history-adjustment/', getTableAdjustmentHistory);
// router.post('/table-entry-history', getTableEntryHistory);
// router.put('/reset-inventory/:id', resetInventory);
module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    inventoryFiscalService.create(req.body)
        .then(() =>res.json({}))
        .catch(err => next(err));
}

// /**
//  * PUT update
//  */
function update(req, res, next) {
    inventoryFiscalService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

// /**
//  * PUT reset
//  */
// function resetInventory(req, res, next) {
//     inventoryService.resetInventory(req.params.id, req.body)
//         .then(() => res.json({}))
//         .catch(err => next(err));
// }

// /**
//  * PUT update readjustment reajuste de inventario
//  */
// function readjustment(req, res, next) {
//     inventoryService.readjustment(req.params.id, req.body)
//         .then(() => res.json({}))
//         .catch(err => next(err));
// }

// /**
//  * GET getAll
//  */
function getAll(req, res, next) {

    inventoryFiscalService.getAll()
        .then(inventories => res.json(inventories))
        .catch(err => next(err));
}

// /**
//  * GET getInventory
//  */
function getInventory(req, res, next) {
    inventoryFiscalService.getInventory(req.params.id)
        .then(inventory => res.json(inventory))
        .catch(err => next(err));
}

/**
 * POST getTable - Tabla de inventario fiscal / físico.
 * Asegura que el servicio reciba siempre el usuario (role/agency) desde el token si el body no lo envía.
 */
function getTable(req, res, next) {
    const params = { ...req.body };
    const ensureUser = !params.user && req.user
        ? userService.getById(req.user.sub).then((user) => {
            if (user) params.user = user;
            return inventoryFiscalService.dataTable(params);
        })
        : Promise.resolve(inventoryFiscalService.dataTable(params));

    ensureUser
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

/**
 * Reporte de ventas
 * POST reportSales
 */
function reportSales(req, res, next) {
    inventoryFiscalService.reportSalesFiscal(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

// /**
//  * Reporte de ofertas
//  * POST reportOffers
//  */
// function reportOffers(req, res, next) {
//     inventoryService.reportOffers(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// /**
//  * POST getTable
//  */
function getTableHistory(req, res, next) {
    
    inventoryFiscalService.dataTableHistory(req.body)
        .then(inventoriesFiscal => {
            return inventoriesFiscal 
                ? res.json(inventoriesFiscal) 
                : res.status(400).json({ message: 'No hay información disponible' });
        })
        .catch(err => next(err));
}

/**
 * Reporte de inventarios
 */
function getInventoryReport(req, res, next) {
    inventoryFiscalService.getInventoryFiscalReport(req.body)
        .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

// /**
//  * Reporte de balances
//  */
// function getBalanceReport(req, res, next) {
//     inventoryService.getBalanceReport(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// /**
//  * Reporte de inventarios diario
//  */
// function getInventoryReportDaily(req, res, next) {
//     inventoryService.dataTableInventoryReportDaily(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// /**
//  * Reporte de inventarios sin salidas basico
//  */
// function getInventoryReportPlus(req, res, next) {
//     inventoryService.dataTableInventoryReportPlus(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// //detalle de mermas
// function detailDecreases(req, res, next) {
//     inventoryService.detailDecreases(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// //detalle de salidas
// function detailDepartures(req, res, next) {
//     inventoryService.detailDepartures(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// //detalle de recortes
// function detailCut(req, res, next) {
//     inventoryService.detailCut(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// /**
//  * POST getTable
//  */
// function getTableAdjustmentHistory(req, res, next) {
//     inventoryService.dataTableAdjustmentHistory(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }

// /**
//  * POST Historial de salidas
//  */
// function getTableEntryHistory(req, res, next) {
//     inventoryService.dataTableEntryHistory(req.body)
//         .then(inventories => inventories ? res.json(inventories) : res.status(400).json({ message: 'No hay información disponibe' }))
//         .catch(err => next(err));
// }