const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    code: { type: String, required: true },
    name: { type: String, required: true },
    presentation: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    image: { type: String, default: null },
    user: { type: 'ObjectId', ref: 'User' }, //Usuario
    createdDate: { type: Date, default: getTimeZoneDate },
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
function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('MiscellaneousRecord', schema);