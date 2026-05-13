const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

var virtualValuesSchema = new Schema({
    agency: { type: String, required: true},
    totalSales: { type: Number, required: true },
    totalIVA: { type: Number, required: true },
    totalBaseImponible: { type: Number, required: true },
    totalExento: { type: Number, required: true },
    date: { type: Date, required: true }
});

const schema = new Schema({
    totalBaseImponible: { type: String , required: true }, // Base imponible
    totalIVA: { type: String , required: true }, // Impuesto al valor agregado (IVA)
    totalExento: { type: String , required: true }, // Monto exento de impuestos
    totalSales: { type: String , required: true }, // Monto total de la caja
    comment: { type: String, default: '' }, // Comentarios opcionales
    date: { type: Date, required: true }, // Fecha correspondiente
    createdDate: { type: Date, default: getTimeZoneDate }, // Fecha de creación
    virtualValues:  virtualValuesSchema // Virtual Values
});

// Obtener fecha con hora de Venezuela
function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

// Agregar virtual ID y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('ClosingFiscal', schema);
