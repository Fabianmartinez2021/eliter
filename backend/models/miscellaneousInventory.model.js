const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    product: { type: 'ObjectId', ref: 'Miscellaneous' },
    agency: { type: 'ObjectId', ref: 'Agency' },
    kg: { type: Number, required: true },
    physical: { type: Number }, //inventario fisico
    minimumStock: { type: Number, default: 0 }, // Mínimo de Stock recomendado para ese producto en esa tienda
    order: { type: Number, default: 0 },                    // Cantidad pedida en la orden
    orderWasConfirmed: { type: Boolean, default: false },   // Si la orden fue confirmada
    modification: { type: Number, default: 0 },                 // Cantidad pedida en el anexo
    modificationWasConfirmed: { type: Boolean, default: false },// Si el anexo fue confirmado
    confirmation: { type: Boolean, default: false },           // Si la orden fue confirmada
    createdDate: { type: Date, default: getTimeZoneDate },
    updatedDate: { type: Date },

});

//Obtener fecha con hora venezuela
function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('InventoryMiscellaneous', schema);