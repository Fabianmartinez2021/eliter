const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

/**
 * Historial de uso de cupones. Un registro por cada vez que se canjea un cupón en una venta.
 * Guarda la información del cliente y la referencia a la venta (order) para auditoría y reportes.
 */
const schema = new Schema({
    // Código del cupón usado (normalizado, ej. "00", "42")
    couponCode: { type: String, required: true },
    // Número único de la venta (campo order del modelo Sales). Se rellena cuando es venta normal.
    saleOrder: { type: Number, default: null },
    // Número único de la venta fiscal (campo order del modelo SalesFiscal). Se rellena cuando es venta especial.
    saleFiscalOrder: { type: Number, default: null },
    // Datos del cliente al momento del uso
    clientNames: { type: String, default: '' },
    document: { type: String, default: '' },
    phone: { type: String, default: '' },
    // Totales para auditoría
    totalBeforeDiscount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 10 },
    totalAfterDiscount: { type: Number, default: 0 },
    // Sucursal y cajero que registró la venta
    agency: { type: Schema.Types.ObjectId, ref: 'Agency', default: null },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Fecha/hora del uso (zona Venezuela -4)
    createdDate: { type: Date, default: getTimeZoneDate }
});

function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('PromoCouponUse', schema);
