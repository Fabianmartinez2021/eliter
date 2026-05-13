const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

const schema = new Schema({
    code: { type: Number },
    name: { type: String, trim: true, required: true },
    presentation: { type: String, required: true },
    price: { type: Number, min: 0, required: true },        // Precio
    lastPrice: { type: Number, min: 0, default: 0 },        // Ultimo precio
    image: { type: String, default: null },
    updateDate: { type: Date, default: '' },        //  Fecha de actualización del producto
    createdDate: { type: Date, default: getTimeZoneDate }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

schema.plugin(AutoIncrement, {id:'supplies_sequ',inc_field: 'code'});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Miscellaneous', schema);