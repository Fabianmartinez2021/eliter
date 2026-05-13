const express = require('express');
const invoiceService = require('../services/invoice.service');
const router = express.Router();


function getInvoiceTable(req, res, next) {
  invoiceService
    .invoiceTable(req.body)
    .then(invoice => {
      invoice
        ? res.json(invoice)
        : res.status(400).json({ message: "No hay información disponible" });
    })
    .catch(err => {
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    });
}

function getInvoiceTotalsByAgencyMonthly(req, res, next) {

  invoiceService
    .invoiceTotalsByAgencyMonthly(req.body)
    .then(totals => {
      totals
        ? res.json(totals)
        : res.status(400).json({ message: "No hay información disponible" });
    })
    .catch(err => {
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    });
}

function getInvoiceStatsByCompanyAndBranch(req, res, next) {
  invoiceService
    .invoiceStatsByCompanyAndBranch(req.body)
    .then(stats => {
      stats
        ? res.json(stats)
        : res.status(400).json({ message: "No hay información disponible" });
    })
    .catch(err => {
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    });
}

function updateInvoice(req, res, next) {
  const { id } = req.params;
  const updateFields = req.body;

  invoiceService
    .updateInvoice(id, updateFields)
    .then(updatedInvoice => {
      updatedInvoice
        ? res.json(updatedInvoice)
        : res.status(404).json({ message: "Factura no encontrada" });
    })
    .catch(err => {
      res.status(500).json({ message: "Error al actualizar la factura", error: err.message });
    });
}
function getInvoiceById(req, res, next) {
  const { id } = req.params;

  invoiceService
    .getInvoiceById(id)
    .then(invoice => {
      invoice
        ? res.json(invoice)
        : res.status(404).json({ message: "Factura no encontrada" });
    })
    .catch(err => {
      res.status(500).json({ message: "Error al obtener la factura", error: err.message });
    });
}
function anulateInvoice(req, res, next) {
  const { id } = req.params;
  const { comment } = req.body;
  
  invoiceService
    .anulateInvoice(id, comment)
    .then(invoice => res.json(invoice))
    .catch(err => {
      res.status(500).json({ message: "Error al anular la factura", error: err.message });
    });
}

//routes
router.patch('/anulate/:id', anulateInvoice);
router.get('/get/:id', getInvoiceById);
router.put('/update/:id', updateInvoice);
router.post('/invoice-table', getInvoiceTable);
router.post('/invoice-totals-by-agency-monthly', getInvoiceTotalsByAgencyMonthly);
router.post('/invoice-stats-by-company-branch', getInvoiceStatsByCompanyAndBranch);

module.exports = router;
