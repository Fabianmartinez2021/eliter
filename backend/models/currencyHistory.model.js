const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');


const schema = new Schema({
    title: { type: String, required: true }, // Nombre de la divisa, e.g., "Dólar estadounidense" o "Euro"
    symbol: { type: String, required: true }, // Símbolo, e.g., 'USD', 'EUR'
    price: { type: Number, required: true }, // Precio actual
    price_old: { type: Number, required: true }, // Precio anterior
    change: { type: Number, required: true }, // Cambio absoluto en el precio
    percent: { type: Number, required: true }, // Porcentaje de cambio
    color: { type: String, required: true }, // Color que indica si subió o bajó ('green' o 'red')
    image: { type: String }, // URL de la imagen del país o divisa
    last_update: { type: Date}, // Fecha y hora de la última actualización
    created_at: { type: Date, default: Date.now } // Fecha de registro en la base de datos
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

module.exports = mongoose.model('CurrencyHistory', schema);
  