const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

var productsSchema = new Schema({ 
    product: { type: 'ObjectId', ref: 'Terminal' }, //  Punto por el cual se pasó
    quantity: { type: Number}
    
},{ _id : false });

const schema = new Schema({
    products: [productsSchema],                 // Productos
    agency: { type: 'ObjectId', ref: 'Agency' },// Agencia donde se pidió el credito
    user: { type: 'ObjectId', ref: 'User' },    // Usuario que realizó la modificación
    orderType: { type: Number, default: 0 },    // Frecuencia de la orden
    
    createdDate: { type: Date, default: getTimeZoneDate }
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

module.exports = mongoose.model('OrderHelper', schema);