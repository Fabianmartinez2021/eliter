const express  = require('express');
const router = express.Router()
const reportMonthlyService = require('../services/reportMonthly.service');

router.post('/report-fiscal', getFiscalReport)

module.exports = router;


function getFiscalReport(req, res, next){
    reportMonthlyService.getFiscalReport(req.body)
        .then(reportsFiscal => reportsFiscal ? res.json(reportsFiscal) : res.status(400).json({ message: 'No hay información disponibe' }))
        .catch(err => next(err))
}