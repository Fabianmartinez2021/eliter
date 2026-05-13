const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

//1. Apertura - Ingreso
//2. Ventas - Ingreso
//3. Cambio - Egreso
//4. Retiro - Egreso
//5. Gasto  - Egreso
const schema = new Schema({
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    user: { type: 'ObjectId', ref: 'User'},
    totalBefore: { type: Number, required: true },//Monto anterior
    in: { type: Number, required: true },
    out: { type: Number, default:0 },
    total: { type: Number },
    comment: { type: String, default:''},
    authorization: { type: String, default:''},
    authorizationCode: { type: 'ObjectId', ref: 'AuthorizationCode'},  // Código de autorización generado por sistema
    coin: { type: Number, require: true},
    valueDollar:{ type: Number},//valor registrado en dolares
    valueEur:{ type: Number},//valor registrado en euros
    valueCop:{ type: Number},//valor registrado en pesos
    coinDescription: { type: String, require: true},
    type: { type: Number, default:''},//ingreso, egreso
    isWholesale: { type: Boolean, default: false },         //  Si es una venta al mayor
    isSumation: { type: Boolean, default: false },          //  Si es un abono a un crédito
    changeType: { type: Number},                            //  El código del tipo de cambio Detal, Mayor, Abono
    typeDescription: { type: String, require: true},
    order: { type: String, default:''},//referencia de venta
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

module.exports = mongoose.model('Box', schema);