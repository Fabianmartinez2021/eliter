const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    user: { type: 'ObjectId', ref: 'User'},
    initial: { type: Number }, 
    in: { type: Number },
    out: { type: Number },
    inUser: { type: Number },
    total: { type: Number },
    checked: { type: Number, default: false, require: true},
    coin: { type: Number, require: true},
    coinDescription: { type: String, require: true},
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

module.exports = mongoose.model('BoxCloseFiscal', schema);