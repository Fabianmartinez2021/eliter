const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    user: { type: 'ObjectId', ref: 'User'},         // Usuario que realiza el cierre de la tienda
    agency: { type: 'ObjectId', ref: 'Agency'},     // Agencia
    comment: { type: String, default: ''},           // Comentario adicional que se quiera agregar en el cierre de la tienda 
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

module.exports = mongoose.model('AgencyCloseRecord', schema);