const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const enumBox = require('../enums/box.enum'); 
var moment = require('moment');


var terminalAmmountsSchema = new Schema({ 

    terminal: { type: 'ObjectId', ref: 'Terminal'}, // Código del terminal
    debit: Number,                                  // Monto total de débito mostrado al cerrar el punto de venta
    credit: Number,                                 // Monto total de crédito mostrado al cerrar el punto de venta
    total: Number,                                  // Monto total mostrado al cerrar el punto de venta
    lote: String,                                   // lote del punto de venta

},{ _id : false });


const schema = new Schema({

    agency: { type: 'ObjectId', ref: 'Agency'},         // Agencia

    applyStack: [terminalAmmountsSchema],                   // Montos de los puntos de venta que aplican
    notApplyStack: [terminalAmmountsSchema],                // Montos de los puntos de venta que NO aplican
    
    totalApplyAmmount:{ type: Number, required: true },     // Sumatoria total de los montos de los puntos de venta que aplican
    totalNotApplyAmmount:{ type: Number, required: true },  // Sumatoria total de los montos de los puntos de venta que NO aplican
    total:{ type: Number, required: true },  // Total por puntos

    date: { type: Date, required: true},                    // Fecha correspondiente

    createdDate: { type: Date, default: getTimeZoneDate },  // Fecha de creación del reporte (puede ser el dia siguiente)
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

module.exports = mongoose.model('TerminalRecord', schema);