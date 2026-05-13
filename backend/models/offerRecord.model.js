const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    user: { type: 'ObjectId', ref: 'User'},//Usuario Creador
    agency: { type: 'ObjectId', ref: 'Agency'},
    product: { type: 'ObjectId', ref: 'Product'}, 
    price: { type: Number, required: true },
    regularPrice: { type: Number, required: true },
    comment:{ type: String, default:'' },
    createdDate: { type: Date, default: getTimeZoneDate },
    endDate: { type: Date, required: false }
});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('OfferRecord', schema);