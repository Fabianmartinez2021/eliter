const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhook.service');
const config = require('../config.json');

// Middleware para validar el secret del webhook
function validateWebhookSecret(req, res, next) {
    const webhookSecret = req.headers['x-webhook-secret'];
    const expectedSecret = config.webhookSecret;

    // Si hay secret configurado, validarlo
    if (expectedSecret && expectedSecret !== '') {
        if (!webhookSecret || webhookSecret !== expectedSecret) {
            return res.status(401).json({ 
                success: false, 
                message: 'Webhook secret inválido' 
            });
        }
    }

    next();
}

// Ruta para recibir webhook de nota de mercado
router.post('/note-market', validateWebhookSecret, async (req, res, next) => {
    try {
        const payload = req.body;
        
        // Validar que el payload tenga la estructura esperada
        if (!payload || !payload.data) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo data'
            });
        }

        // Validar que tenga action
        if (!payload.action) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo action'
            });
        }

        // Validar que la acción sea válida
        const validActions = ['created', 'updated', 'deleted', 'audited'];
        if (!validActions.includes(payload.action)) {
            return res.status(400).json({
                success: false,
                message: `Acción no soportada: ${payload.action}. Solo se aceptan: ${validActions.join(', ')}`
            });
        }

        // Procesar el webhook
        const result = await webhookService.handleNoteMarketWebhook(payload);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en webhook de nota de mercado:', error);
        next(error);
    }
});

// Ruta para recibir webhook de invoice desde el backend de fábrica
router.post('/invoice', validateWebhookSecret, async (req, res, next) => {
    try {
        const payload = req.body;

        // Validar que el payload tenga la estructura esperada
        if (!payload || !payload.data) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo data'
            });
        }

        // Validar que tenga action
        if (!payload.action) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo action'
            });
        }

        // Solo procesar si la acción es 'created' (por ahora)
        // Las actualizaciones se pueden manejar después si es necesario
        if (payload.action !== 'created' && payload.action !== 'updated') {
            return res.status(400).json({
                success: false,
                message: `Acción no soportada: ${payload.action}. Solo se aceptan 'created' o 'updated'`
            });
        }

        // Procesar el webhook
        const result = await webhookService.handleInvoiceWebhook(payload);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en webhook de invoice:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error procesando webhook de invoice',
            error: error.message
        });
    }
});

// Ruta para recibir webhook de order-miscellaneous desde el backend de fábrica
router.put('/order-miscellaneous', validateWebhookSecret, async (req, res, next) => {
    try {
        const payload = req.body;

        // Validar que el payload tenga la estructura esperada
        if (!payload || !payload.data) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo data'
            });
        }

        // Validar que tenga action
        if (!payload.action) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo action'
            });
        }

        // Validar que la acción sea válida
        const validActions = ['created', 'updated', 'deleted'];
        if (!validActions.includes(payload.action)) {
            return res.status(400).json({
                success: false,
                message: `Acción no soportada: ${payload.action}. Solo se aceptan: ${validActions.join(', ')}`
            });
        }

        // Procesar el webhook
        const result = await webhookService.handleOrderMiscellaneousWebhook(payload);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en webhook de order-miscellaneous:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error procesando webhook de order-miscellaneous',
            error: error.message
        });
    }
});

// Ruta para recibir webhook de order-market-miscellaneous desde el backend de fábrica
router.post('/order-market-miscellaneous', validateWebhookSecret, async (req, res, next) => {
    try {
        const payload = req.body;

        // Validar que el payload tenga la estructura esperada
        if (!payload || !payload.data) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo data'
            });
        }

        // Validar que tenga action
        if (!payload.action) {
            return res.status(400).json({
                success: false,
                message: 'Payload inválido: falta campo action'
            });
        }

        // Acciones válidas para este webhook
        const validActions = ['created', 'updated', 'deleted', 'audited'];
        if (!validActions.includes(payload.action)) {
            return res.status(400).json({
                success: false,
                message: `Acción no soportada: ${payload.action}. Solo se aceptan: ${validActions.join(', ')}`
            });
        }

        // Procesar el webhook
        const result = await webhookService.handleOrderMarketMiscellaneousWebhook(payload);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error en webhook de order-market-miscellaneous:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error procesando webhook de order-market-miscellaneous',
            error: error.message
        });
    }
});

module.exports = router;

