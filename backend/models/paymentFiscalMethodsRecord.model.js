const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

// Esquema para valores virtuales
const virtualValuesSchema = new Schema({
    totalAmount: { type: Number},
    totalSell: { type: Number},
    totalIVA: { type: Number},
    totalBaseImponible: { type: Number},
    totalExento: { type: Number},
    totalAmountBox: { type: Number},
    totalCop: { type: Number, default: 0 },
    totalDollar: { type: Number, default: 0 },
    totalEur: { type: Number, default: 0 },
    totalTransfer: { type: Number, default: 0 },
    totalPos: { type: Number, default: 0 },
    valueDollar: { type: Number},
    valueEur: { type: Number},
    valueCop: { type: Number},
    agency: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
        name: { type: String },
        company: { type: String },
        address: { type: String },
        attendant: { type: String },
        terminal: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Terminal' }],
        createdDate: { type: Date },
    }
}, { _id: false });

// Esquema principal
const schema = new Schema({
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency'}, // Agencia
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}, // Usuario
    baseImponible: { type: Number}, // Base imponible
    exento: { type: Number}, // Monto exento de impuestos
    IVA: { type: Number}, // Impuesto al valor agregado (IVA)
    total: { type: Number}, // Monto total de la caja
    comment: { type: String, default: '' }, // Comentarios opcionales
    date: { type: Date}, // Fecha correspondiente
    createdDate: { type: Date, default: getTimeZoneDate }, // Fecha de creación
    virtualValues: virtualValuesSchema // Valores virtuales del sistema
});

// Obtener fecha con hora de Venezuela
function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

// Configuración de salida JSON
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('PaymentFiscalMethodsRecord', schema);
