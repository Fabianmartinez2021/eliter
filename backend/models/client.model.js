const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    agency: { type: 'ObjectId', ref: 'Agency' },
    document: { type: String, required: true },
    names: { type: String, required: true },
    phone: { type: String, default:'' },
    createdDate: { type: Date, default: getTimeZoneDate },
});

//Agregar virutal id, y quitar _id y contraseña de los responses
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

module.exports = mongoose.model('Client', schema);