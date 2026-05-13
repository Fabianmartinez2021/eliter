const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

/**
 * Modelo historial de inventario fisico
 */
const schema = new Schema({
    user: { type: 'ObjectId', ref: 'User'},//Usuario que hizo el ajuste
    product: { type: 'ObjectId', ref: 'Miscellaneous'}, 
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    kg: { type: Number, required: true },
    comment: { type: String, default:''},
    createdDate: { type: Date, default: getTimeZoneDate },
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
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

module.exports = mongoose.model('MiscellaneousAdjustmentRecord', schema);