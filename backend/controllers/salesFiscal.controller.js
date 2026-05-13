const express = require('express');
const router = express.Router();
const salesFiscalService = require('../services/salesFiscal.service')
const salesService = require('../services/sales.service')

// routes
router.post('/create-sale-special', create);
router.put('/update-sale-special/:id', update);
router.get('/get-sales-special/', getAll);
router.post('/table-sale-special/', getTable);
router.post('/table-sale-special-daily/', getTableDaily);
router.get('/get-sale-special/:id',getSale);
router.get('/get-sales-special-data/:id',dataFormSale);
router.post('/report-special-payment-methods-close/', reportPaymentMethodsClose);
router.post('/report-special-payment-methods-history/', reportPaymentMethodsHistory);
router.post('/report-special-payment-methods-chart/', reportPaymentMethodsChart);
router.post('/report-special-payment-methods-general-report-history/', reportPaymentMethodsGeneralReportHistory);
router.post('/report-special-payment-methods/', reportPaymentMethods);
router.post('/detail-payment-methods/', detailPaymentMethods);
router.post('/process-sales-special-offline', processSalesFiscal);
router.post('/sales-special-table', getSalesFiscalTable);
router.post('/commission-reports', commissionReports);
router.post('/telesales-commission-reports', telesalesCommissionReports);
router.post('/invoice-totals-by-company', getInvoiceTotalsByCompany);
router.post('/sales-special-combos-chart/', salesCombosChart);
router.post('/payment-fiscal-methods-stats-by-company-branch', getPaymentFiscalMethodsStatsByCompanyAndBranch);


module.exports = router;

/**
 * POST create
 */

function create(req, res, next) {
    salesFiscalService.create(req.body)
        .then(fiscalSale => {
            // Si salesFiscal es exitoso, entonces creamos el sale
            return salesService.create(req.body).then(sale => {
                res.json({
                    fiscalSale,
                    sale
                });
            });
        })
        .catch(err => {
            // Si ocurre un error en la creación de salesFiscal, lo manejamos
            next(err);
        });
}

/**
 * POST processSales Procesar ventas offline
 */
function processSalesFiscal(req, res, next) {
    salesFiscalService.processDataOffline(req.body)
        .then(fiscalSale => {
            // Si salesFiscal es exitoso, entonces procesamos sales
            return salesService.processDataOffline(req.body).then(sale => {
                res.json({
                    fiscalSale,
                    sale
                });
            });
        })
        .catch(err => {
            // Si ocurre un error en salesFiscal, manejamos el error
            next(err);
        });
}

/**
 * PUT update
 */
function update(req, res, next) {
    salesFiscalService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    salesFiscalService.getAll()
        .then(sales => res.json(sales))
        .catch(err => next(err));
}

/**
 * GET
 */
function getSale(req, res, next) {
    salesFiscalService.getSale(req.params.id)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

//ventas generales
function getTable(req, res, next) {

    salesFiscalService.dataTable()
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//ventas por usuario
function getSalesFiscalTable(req, res, next) {
    salesFiscalService.salesFiscalTable(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//ventas del dia
function getTableDaily(req, res, next) {
    salesFiscalService.dataTableDaily(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//Obtener información necesaria para la venta
function dataFormSale(req, res, next) {
    salesFiscalService.dataFormSale(req.params.id)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function reportPaymentMethods(req, res, next) {
    salesFiscalService.reportPaymentMethods(req.body)
        .then(salesFiscal => salesFiscal ? res.json(salesFiscal) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function reportPaymentMethodsClose(req, res, next) {
    salesFiscalService.reportPaymentMethodsClose(req.body)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

function reportPaymentMethodsHistory(req, res, next) {
    salesFiscalService.reportPaymentMethodsHistory(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => {console.log(err) ; next(err)});
}

function reportPaymentMethodsChart(req, res, next) {
    salesFiscalService.reportPaymentMethodsChart(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => {next(err)});
}

function reportPaymentMethodsGeneralReportHistory(req, res, next) {
    salesFiscalService.reportPaymentMethodsGeneralReportHistory(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => {console.log(err) ; next(err)});
}

function detailPaymentMethods(req, res, next) {
    salesFiscalService.detailPaymentMethods(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}


function commissionReports(req, res, next) {
    salesFiscalService.getCommissionReports(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function telesalesCommissionReports(req, res, next) {
    salesFiscalService.telesalesCommissionReports(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}


//  Data para los graficos de las ventas de los productos
function salesCombosChart(req, res, next) {
    salesFiscalService.salesCombosChart(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function getInvoiceTotalsByCompany(req, res, next) {
    salesFiscalService.invoiceTotalsByCompany(req.body)
      .then((totals) => {
        totals
          ? res.json(totals)
          : res.status(400).json({ message: "No hay información disponible" });
      })
      .catch((err) => {
        res
          .status(500)
          .json({ message: "Error interno del servidor", error: err.message });
      });
  }

function getPaymentFiscalMethodsStatsByCompanyAndBranch(req, res, next) {
  salesFiscalService
    .paymentFiscalMethodsStatsByCompanyAndBranch(req.body)
    .then(stats => {
      stats
        ? res.json(stats)
        : res.status(400).json({ message: "No hay información disponible" });
    })
    .catch(err => {
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    });
}