const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    product: { type: 'ObjectId', ref: 'Miscellaneous' },
    agency: { type: 'ObjectId', ref: 'Agency' },
    amountBefore: { type: Number,},
    in: { type: Number, default: 0 },
    out: { type: Number, default: 0 },
    adjustment: { type: Number, default:0 },
    amountAfter: { type: Number,},
    note: { type: String, default: '' },
    price: { type: Number, default: 0 },
    comment: { type: String, default: '' },
    type: { type: Number, default: 0 },//tipo de salida, 0 si es entrada, ver typeOut
    typeIn: { type: Number, default:0 },//tipo de entrada si es entrada, ver typeIn
    createdDate: { type: Date, default: getTimeZoneDate },
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

module.exports = mongoose.model('InventoryMiscellaneousRecord', schema);