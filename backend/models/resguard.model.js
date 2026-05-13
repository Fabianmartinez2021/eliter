const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');


const schema = new Schema({
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    user: { type: 'ObjectId', ref: 'User'},
    //authorizationUser: { type: 'ObjectId', ref: 'User'},    // El usuario que autoriza el retiro (solo para retiros) 
    confirmationUser: { type: 'ObjectId', ref: 'User'},     // El usuario que confirma el retiro (solo para retiros) 
    responsible: { type: String, default:''},               // Responsable de llevarse el dinero (solo para retiros) 
    confirmationStatus: { type: Boolean, required: true},   // Si el retiro ya fue confirmado o no (solo para retiros) 
    
    in: { type: Boolean, required: true},       // Si es un ingreeso
    out: { type: Boolean, required: true},      // Si es un retiro

    amountBs: { type: Number},                           // Valor registrado en Bs
    amountBsBefore: { type: Number, required: true },    //Monto anterior en Bs
    amountBsTotal: { type: Number, required: true },     //Monto final en Bs
    amountBsDescription: { type: String, default:''},    // Descripción del monto ingresado en Bs
    amountDollar: { type: Number},                           // Valor registrado en dólares
    amountDollarBefore: { type: Number, required: true },    //Monto anterior en dólares
    amountDollarTotal: { type: Number, required: true },     //Monto final en dólares
    amountDollarDescription: { type: String, default:''},     // Descripción del monto ingresado en dólares
    amountEur: { type: Number},                          // Valor registrado en Euros
    amountEurBefore: { type: Number, required: true },   //Monto anterior en Euros
    amountEurTotal: { type: Number, required: true },    //Monto final en Euros
    amountEurDescription: { type: String, default:''},   // Descripción del monto ingresado en Euros
    amountCop: { type: Number},                              // Valor registrado en Pesos
    amountCopBefore: { type: Number, required: true },       //Monto anterior en Pesos
    amountCopTotal: { type: Number, required: true },        //Monto final en Pesos
    amountCopDescription: { type: String, default:''},       // Descripción del monto ingresado en Pesos


    order: { type: Number },    // Nro dereferencia
    comment: { type: String, default:''},
    confirmationDate: { type: Date }, //  Fecha de confirmacion (solo para retiros)
    createdDate: { type: Date, default: getTimeZoneDate },
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().utc().subtract(4, 'hours');
}

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Resguard', schema);