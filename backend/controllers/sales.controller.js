const express = require('express');
const router = express.Router();
const salesService = require('../services/sales.service');
const weeklyReportService = require('../services/weeklyReport.service');
const userService = require('../services/user.service');
const roleEnum = require('../enums/roles.enum');

// routes
router.post('/create-sale', create);
router.put('/update-sale/:id', update);
router.get('/get-sales/', getAll);
router.post('/table-sale/', getTable);
router.post('/table-sale-daily/', getTableDaily);
router.get('/get-sale/:id', getSale);
router.get('/get-sales-data/:id', dataFormSale);
router.post('/report-payment-methods-close/', reportPaymentMethodsClose);
router.post('/report-payment-methods-history/', reportPaymentMethodsHistory);
router.post('/report-payment-methods-chart/', reportPaymentMethodsChart);
router.post('/report-payment-methods-general-report-history/', reportPaymentMethodsGeneralReportHistory);
router.post('/report-payment-methods/', reportPaymentMethods);
router.post('/detail-payment-methods/', detailPaymentMethods);
router.post('/process-sales-offline', processSales);
router.post('/sales-table', getSalesTable);
router.post('/commission-reports', commissionReports);
router.post('/telesales-commission-reports', telesalesCommissionReports);

router.post('/sales-combos-chart/', salesCombosChart);
router.post('/sales-chart/', salesTicketsChart);
router.post('/weekly-total-realtime/', getWeeklyTotalRealtime);
router.post('/weekly-wholesales-goal-realtime/', getWeeklyWholesalesGoalRealtime);
router.get('/coupon-history', getCouponHistory);
router.post('/validate-coupon', validateCoupon);
router.post('/seed-promo-coupons', seedPromoCoupons);

module.exports = router;

/**
 * POST create
 */
function create(req, res, next) {
    salesService.create(req.body)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

/**
 * POST processSales Procesar ventas offline
 */
function processSales(req, res, next) {
    salesService.processDataOffline(req.body)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

/**
 * PUT update
 */
function update(req, res, next) {
    salesService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * GET getAll
 */
function getAll(req, res, next) {
    salesService.getAll()
        .then(sales => res.json(sales))
        .catch(err => next(err));
}

/**
 * GET
 */
function getSale(req, res, next) {
    salesService.getSale(req.params.id)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

//ventas generales
function getTable(req, res, next) {
    salesService.dataTable()
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//ventas por usuario
function getSalesTable(req, res, next) {
    salesService.salesTable(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//ventas del dia
function getTableDaily(req, res, next) {
    salesService.dataTableDaily(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//Obtener información necesaria para la venta
function dataFormSale(req, res, next) {
    salesService.dataFormSale(req.params.id)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function reportPaymentMethods(req, res, next) {
    salesService.reportPaymentMethods(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function reportPaymentMethodsClose(req, res, next) {
    salesService.reportPaymentMethodsClose(req.body)
        .then(sale => res.json(sale))
        .catch(err => next(err));
}

function reportPaymentMethodsHistory(req, res, next) {
    salesService.reportPaymentMethodsHistory(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => { console.log(err); next(err) });
}

function reportPaymentMethodsChart(req, res, next) {
    salesService.reportPaymentMethodsChart(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => { next(err) });
}

function reportPaymentMethodsGeneralReportHistory(req, res, next) {
    salesService.reportPaymentMethodsGeneralReportHistory(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => { console.log(err); next(err) });
}

function detailPaymentMethods(req, res, next) {
    salesService.detailPaymentMethods(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}


function commissionReports(req, res, next) {
    salesService.getCommissionReports(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

function telesalesCommissionReports(req, res, next) {
    salesService.telesalesCommissionReports(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}


//  Data para los graficos de las ventas de los productos
function salesCombosChart(req, res, next) {
    salesService.salesCombosChart(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err));
}

//  Data para los graficos de tickets por tipo
function salesTicketsChart(req, res, next) {
    salesService.salesTicketsChart(req.body)
        .then(sales => sales ? res.json(sales) : res.status(400).json({ message: 'No hay información disponible' }))
        .catch(err => next(err));
}

//  Total semanal en tiempo real desde el lunes hasta hoy
function getWeeklyTotalRealtime(req, res, next) {
    weeklyReportService.getWeeklyTotalRealtime(req.body)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No hay información disponible' }))
        .catch(err => next(err));
}

//  Meta de mayoreo semanal en tiempo real desde el lunes hasta hoy
function getWeeklyWholesalesGoalRealtime(req, res, next) {
    weeklyReportService.getWeeklyWholesalesGoalRealtime(req.body)
        .then(data => data ? res.json(data) : res.status(400).json({ message: 'No hay información disponible' }))
        .catch(err => next(err));
}

/**
 * GET coupon-history
 * Historial de cupones usados con datos del cliente (nombre, teléfono, dirección).
 */
function getCouponHistory(req, res, next) {
    const date = req.query && req.query.date ? req.query.date : null;
    const dateFrom = req.query && req.query.dateFrom ? req.query.dateFrom : null;
    const dateTo = req.query && req.query.dateTo ? req.query.dateTo : null;
    salesService.getCouponHistory(date, dateFrom, dateTo)
        .then(data => res.json(data || []))
        .catch(err => next(err));
}

/**
 * POST validate-coupon
 * Valida si el cupón existe y está disponible (solo para UX; la reserva real es al crear la venta).
 */
function validateCoupon(req, res, next) {
    salesService.validateCoupon(req.body)
        .then(result => res.json(result))
        .catch(err => next(err));
}

/**
 * POST seed-promo-coupons
 * Crea los 3001 cupones ("00" a "3000"). Idempotente. Solo administradores.
 */
function seedPromoCoupons(req, res, next) {
    if (!req.user || !req.user.sub) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    userService.getById(req.user.sub)
        .then(user => {
            if (!user || user.role !== roleEnum.rol.Admin) {
                return res.status(403).json({ message: 'Solo administradores pueden ejecutar el seed de cupones' });
            }
            return salesService.seedPromoCoupons();
        })
        .then(result => res.json(result))
        .catch(err => next(err));
}