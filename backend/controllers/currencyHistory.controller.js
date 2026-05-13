const express = require('express');
const router = express.Router();
const obtainCurrencyData = require('../services/currency.service');

// Rutas
router.get('/obtener-divisas', getDataDollar);


module.exports = router;

async function getDataDollar(req, res) {
  try {
    const data = await obtainCurrencyData();
    res.json(data); 
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos de divisas' });
  }
}
