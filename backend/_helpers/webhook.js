const axios = require('axios');
const config = require('../config.json');


const webhook = {
    /**
     * Envía un webhook de actualización de producto al backend de fábrica
     * @param {Object} data - Datos del producto actualizado
     * @param {String} data.productId - ID del producto
     * @param {String} data.code - Código del producto
     * @param {String} data.name - Nombre del producto
     * @param {Number} data.price - Nuevo precio
     * @param {Number} data.lastPrice - Precio anterior
     * @param {Number} data.wholesalePrice - Precio al mayor
     * @param {Number} data.lastWholesalePrice - Precio al mayor anterior
     * @param {Date} data.updateDate - Fecha de actualización
     * @param {String} data.user - Usuario que realizó la actualización
     */
    sendProductUpdate: async (data) => {
        try {

            if (!config.factoryWebhookUrl) {
                console.warn('[WEBHOOK][PRODUCT] No hay URL configurada para factoryWebhookUrl');
                return null;
            }

            const payload = {
                event: 'product.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                data: {
                    productId: data.productId,
                    code: data.code,
                    name: data.name,
                    presentation: data.presentation,
                    price: data.price,
                    lastPrice: data.lastPrice,
                    wholesalePrice: data.wholesalePrice,
                    lastWholesalePrice: data.lastWholesalePrice,
                    wholesaleDiscountPrice: data.wholesaleDiscountPrice,
                    applyWholesaleDiscount: data.applyWholesaleDiscount,
                    minWeight: data.minWeight,
                    minWeightWholesaleDiscount: data.minWeightWholesaleDiscount,
                    decrease: data.decrease,              // Merma por empaque
                    reweigh: data.reweigh,               // Merma por humedad/repesaje
                    mincemeat: data.mincemeat,           // Merma por picadillo
                    exempt: data.exempt,                  // Producto exento
                    taxed: data.taxed,                    // Producto gravado
                    pz: data.pz,                         // Piezas
                    image: data.image,
                    updateDate: data.updateDate,
                    user: data.user
                }
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };


            const response = await axios.post(config.factoryWebhookUrl, payload, {
                headers: headers,
                timeout: 5000 // 5 segundos de timeout
            });

            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][PRODUCT] Error en sendProductUpdate:');
            console.error('[WEBHOOK][PRODUCT] Error message:', error?.message || error);
            console.error('[WEBHOOK][PRODUCT] Error code:', error?.code);
            console.error('[WEBHOOK][PRODUCT] Error response status:', error?.response?.status);
            console.error('[WEBHOOK][PRODUCT] Error response data:', error?.response?.data);
            console.error('[WEBHOOK][PRODUCT] Error stack:', error?.stack);

            if (error.response) {
                console.error('[WEBHOOK][PRODUCT] El servidor respondió con error:', error.response.status, error.response.statusText);
            } else if (error.request) {
                console.error('[WEBHOOK][PRODUCT] No se recibió respuesta del servidor');
                console.error('[WEBHOOK][PRODUCT] Request:', error.request);
            } else {
                console.error('[WEBHOOK][PRODUCT] Error al configurar la petición:', error.message);
            }

            return null;
        }
    },

    /**
     * Envía un webhook de actualización de sucursal (market) al backend de fábrica
     * @param {Object} data - Datos de la sucursal
     */
    sendAgencyUpdate: async (data) => {
        try {
            if (!config.factoryWebhookUrl) {
                return null;
            }

            const payload = {
                event: 'agency.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                data: {
                    agencyId: data.agencyId,
                    name: data.name,
                    address: data.address,
                    company: data.company,
                    phone: data.phone,
                    rif: data.rif,
                    attendant: data.attendant,
                    terminals: data.terminals || [],
                    orderHelper: data.orderHelper || null,
                    createdDate: data.createdDate,
                    updatedDate: data.updatedDate,
                    action: data.action,
                    billingWeeklyGoal: data.billingWeeklyGoal,
                    invoiceWeeklyGoal: data.invoiceWeeklyGoal,
                    goalRatio: data.goalRatio,
                    billingWeeklyHistory: data.billingWeeklyHistory || [],
                    invoiceWeeklyHistory: data.invoiceWeeklyHistory || [],
                    lastUpdated: data.lastUpdated,
                    updatedBy: data.updatedBy
                }
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };

            const webhookUrl = config.factoryAgencyWebhookUrl || config.factoryWebhookUrl.replace('/product-update', '/agency-update');

            const response = await axios.post(webhookUrl, payload, { headers, timeout: 5000 });
            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][AGENCY] Error enviando webhook:', error?.message || error);
            return null;
        }
    },

    /**
     * Envía un webhook de actualización de nota de mercado al backend de fábrica
     * @param {Object} data - Datos de la nota de mercado
     */
    sendNoteMarketUpdate: async (data) => {
        try {
            const webhookUrl = config.factoryNoteMarketWebhookUrl || config.factoryWebhookUrl;

            if (!webhookUrl) {
                return null;
            }

            const payload = {
                event: 'note_market.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                data
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };

            const response = await axios.post(webhookUrl, payload, {
                headers,
                timeout: 5000
            });

            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][NOTE_MARKET] Error enviando webhook:', error?.message || error);
            return null;
        }
    },

    /**
     * Envía un webhook de actualización de moneda al backend de fábrica
     * @param {Object} data - Datos de la moneda actualizada y su historial
     * @param {String} data.coinId - ID de la moneda
     * @param {String} data.name - Nombre de la moneda
     * @param {Number} data.value - Nuevo valor de la moneda
     * @param {String} data.user - ID del usuario que actualizó
     * @param {String} data.username - Nombre del usuario que actualizó
     * @param {Date} data.createdDate - Fecha de creación del registro de historial
     * @param {String} data.action - Acción realizada ('updated')
     */
    sendCoinUpdate: async (data) => {
        try {
            const webhookUrl = config.factoryCoinWebhookUrl || config.factoryWebhookUrl;

            if (!webhookUrl) {
                return null;
            }

            const payload = {
                event: 'coin.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                action: data.action || 'updated',
                data: {
                    coinId: data.coinId,
                    name: data.name,
                    value: data.value,
                    user: data.user,
                    username: data.username,
                    createdDate: data.createdDate,
                    updatedDate: data.updatedDate
                }
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };

            const response = await axios.post(webhookUrl, payload, {
                headers,
                timeout: 5000
            });

            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][COIN] Error enviando webhook:', error?.message || error);
            return null;
        }
    },

    /**
     * Envía un webhook de actualización de producto misceláneo al backend de fábrica
     * @param {Object} data - Datos del producto misceláneo actualizado
     * @param {String} data.miscellaneousId - ID del producto misceláneo
     * @param {String} data.code - Código del producto
     * @param {String} data.name - Nombre del producto
     * @param {String} data.presentation - Presentación del producto (kg o unid)
     * @param {Number} data.price - Nuevo precio
     * @param {Number} data.lastPrice - Precio anterior
     * @param {Date} data.updateDate - Fecha de actualización
     * @param {String} data.user - Usuario que realizó la actualización
     */
    sendMiscellaneousUpdate: async (data) => {
        try {
            const webhookUrl = config.factoryMiscellaneousWebhookUrl || config.factoryWebhookUrl;

            if (!webhookUrl) {
                return null;
            }

            const payload = {
                event: 'miscellaneous.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                data: {
                    miscellaneousId: data.miscellaneousId,
                    code: data.code,
                    name: data.name,
                    presentation: data.presentation,
                    price: data.price,
                    lastPrice: data.lastPrice,
                    updateDate: data.updateDate,
                    user: data.user
                }
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };

            const response = await axios.post(webhookUrl, payload, {
                headers: headers,
                timeout: 5000 // 5 segundos de timeout
            });

            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][MISCELLANEOUS] Error en sendMiscellaneousUpdate:');
            console.error('[WEBHOOK][MISCELLANEOUS] Error message:', error?.message || error);
            console.error('[WEBHOOK][MISCELLANEOUS] Error code:', error?.code);
            console.error('[WEBHOOK][MISCELLANEOUS] Error response status:', error?.response?.status);
            console.error('[WEBHOOK][MISCELLANEOUS] Error response data:', error?.response?.data);
            console.error('[WEBHOOK][MISCELLANEOUS] Error stack:', error?.stack);

            if (error.response) {
                console.error('[WEBHOOK][MISCELLANEOUS] El servidor respondió con error:', error.response.status, error.response.statusText);
            } else if (error.request) {
                console.error('[WEBHOOK][MISCELLANEOUS] No se recibió respuesta del servidor');
                console.error('[WEBHOOK][MISCELLANEOUS] Request:', error.request);
            } else {
                console.error('[WEBHOOK][MISCELLANEOUS] Error al configurar la petición:', error.message);
            }

            return null;
        }
    },

    /**
     * Envía un webhook de creación/actualización de orden miscelánea al backend de fábrica
     * @param {Object} data - Datos de la orden miscelánea
     * @param {String} data.orderId - ID de la orden
     * @param {String} data.agencyId - ID de la agencia
     * @param {String} data.agencyName - Nombre de la agencia
     * @param {String} data.userId - ID del usuario que creó la orden
     * @param {String} data.userName - Nombre del usuario que creó la orden
     * @param {String} data.username - Username del usuario que creó la orden
     * @param {Array} data.products - Array de productos de la orden
     * @param {String} data.comment - Comentario de la orden
     * @param {Boolean} data.isModification - Si es una modificación/anexo
     * @param {Boolean} data.wasConfirmed - Si la orden fue confirmada
     * @param {Boolean} data.wasModified - Si la orden fue modificada
     * @param {Number} data.order - Número de orden
     * @param {Date} data.createdDate - Fecha de creación
     * @param {Date} data.updatedDate - Fecha de actualización
     * @param {String} data.action - Acción realizada ('created' o 'updated')
     */
    sendOrderMiscellaneousUpdate: async (data) => {
        try {
            const webhookUrl = config.factoryOrderMiscellaneousWebhookUrl || config.factoryWebhookUrl;

            if (!webhookUrl) {
                console.warn('[WEBHOOK][ORDER_MISCELLANEOUS] No hay URL configurada para factoryOrderMiscellaneousWebhookUrl');
                return null;
            }

            const payload = {
                event: 'order_miscellaneous.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                action: data.action || 'created',
                data: {
                    orderId: data.orderId,
                    agencyId: data.agencyId,
                    agencyName: data.agencyName,
                    userId: data.userId,
                    userName: data.userName,
                    username: data.username || '',
                    products: data.products || [],
                    comment: data.comment,
                    isModification: data.isModification || false,
                    wasConfirmed: data.wasConfirmed || false,
                    wasModified: data.wasModified || false,
                    order: data.order,
                    createdDate: data.createdDate,
                    updatedDate: data.updatedDate,
                    confirmationUser: data.confirmationUser || null,
                    modifierUserComment: data.modifierUserComment || ''
                }
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };

            const response = await axios.post(webhookUrl, payload, {
                headers: headers,
                timeout: 5000 // 5 segundos de timeout
            });

            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error en sendOrderMiscellaneousUpdate:');
            console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error message:', error?.message || error);
            console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error code:', error?.code);
            console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error response status:', error?.response?.status);
            console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error response data:', error?.response?.data);
            console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error stack:', error?.stack);

            if (error.response) {
                console.error('[WEBHOOK][ORDER_MISCELLANEOUS] El servidor respondió con error:', error.response.status, error.response.statusText);
            } else if (error.request) {
                console.error('[WEBHOOK][ORDER_MISCELLANEOUS] No se recibió respuesta del servidor');
                console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Request:', error.request);
            } else {
                console.error('[WEBHOOK][ORDER_MISCELLANEOUS] Error al configurar la petición:', error.message);
            }

            return null;
        }
    },

    /**
     * Envía un webhook de actualización de orden de mercado misceláneos al backend de fábrica
     * @param {Object} data - Datos de la orden de mercado misceláneos actualizada
     */
    sendOrderMarketMiscellaneousUpdate: async (data) => {
        try {
            const webhookUrl = config.factoryOrderMarketMiscellaneousWebhookUrl || config.factoryWebhookUrl;

            if (!webhookUrl) {
                console.warn('[WEBHOOK][ORDER_MARKET_MISCELLANEOUS] No hay URL configurada para factoryOrderMarketMiscellaneousWebhookUrl');
                return null;
            }

            const payload = {
                event: 'order_market_miscellaneous.updated',
                timestamp: new Date().toISOString(),
                source: 'tienda',
                data
            };

            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'tienda-backend',
                'X-Webhook-Secret': config.webhookSecret || ''
            };

            const response = await axios.post(webhookUrl, payload, {
                headers,
                timeout: 5000
            });

            return response.data;

        } catch (error) {
            console.error('[WEBHOOK][ORDER_MARKET_MISCELLANEOUS] Error enviando webhook:', error?.message || error);
            return null;
        }
    }
};

module.exports = webhook;

