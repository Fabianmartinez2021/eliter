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


var transferAmmountsSchema = new Schema({ 

    code: String,       // Nombre completo del banco y la cuenta
    bank: String,       // Nombre del banco de la cuenta
    account: String,    // Cuenta a la que se refiere
    total: Number,    // Monto de la transferencia

},{ _id : false });


var operatorsAmmountsSchema = new Schema({ 

    agency: { type: 'ObjectId', ref: 'Agency'},         // Agencia
    operator: { type: 'ObjectId', ref: 'Operator'},     // Agencia

    totalWholesales: Number,        // Total PROCESADO de ventas al MAYOR 
    totalWholesaleClients: Number,  // Total de CLIENTES de ventas al MAYOR
    totalRetail: Number,            // Total PROCESADO de ventas al DETAL 
    totalRetailClients: Number,     // Total de CLIENTES de ventas al DETAL
    total: Number,                  // Total PROCESADO
    totalClients: Number,           // Total de CLIENTES

},{ _id : false });


var usersAmmountsSchema = new Schema({ 

    agency: { type: 'ObjectId', ref: 'Agency'},         // Agencia
    user: { type: 'ObjectId', ref: 'User'},             // Usuario

    totalWholesales: Number,        // Total PROCESADO de ventas al MAYOR 
    totalWholesaleClients: Number,  // Total de CLIENTES de ventas al MAYOR
    totalRetail: Number,            // Total PROCESADO de ventas al DETAL 
    totalRetailClients: Number,     // Total de CLIENTES de ventas al DETAL
    total: Number,                  // Total PROCESADO
    totalClients: Number,           // Total de CLIENTES
    clientTime: Number,             // El promedio que tarda en atender un nuevo cliente

},{ _id : false });


var virtualValuesSchema = new Schema({  // Valores dados por el sistema en formas de pago
    totalAmount: Number,
    totalSell: Number,
    totalVes: Number,           // Total de bolivares en efectivo 
    totalDollar: Number,        // Total de dolares en efectivo 
    totalEur: Number,           // Total de euros en efectivo 
    totalCop: Number,           // Total de pesos en efectivo 
    totalTransfer: Number,      // Total por transferencia 
    totalPos: Number,           // Total por punto de venta
    totalDollarVes: Number,     
    totalEurVes: Number,
    totalCopVes: Number,
    totalCredit: Number,
    totalSumation: Number,
    valueDollar: Number,        
    valueEur: Number,
    valueCop: Number,
    totalAmountBox: Number,
    
},{ _id : false });

const schema = new Schema({

    agency: { type: 'ObjectId', ref: 'Agency'},         // Agencia
    user: { type: 'ObjectId', ref: 'User'},             // Usuario
    
    ves:{ type: Number, required: true },               // bolivares
    dollar:{ type: Number, required: true },            // dolares
    eur:{ type: Number, required: true },               // euros
    cop:{ type: Number, required: true },               // pesos
    tAmmount:{ type: Number, required: true },          // Total por transferencia
    transferAmmounts: [transferAmmountsSchema],         // Montos de transferencias por cuenta bancaria
    pAmmount:{ type: Number, required: true },          // Total por punto de venta
    terminalAmmounts: [terminalAmmountsSchema],         // Montos por punto de venta
    valueDollar:{ type: Number, required: true },       // Tipo de cambio de los dolares
    valueEur:{ type: Number, required: true },          // Tipo de cambio de los euros
    valueCop:{ type: Number, required: true },          // Tipo de cambio de los pesos
    comment: { type: String, default:''},

    totalClients: { type: Number, default: 0 },         // Número de clientes atendidos en el día      
    operatorsAmmount: [operatorsAmmountsSchema],       // Monto total procesado por cada operador
    cashiersAmmount: [usersAmmountsSchema],                // Monto total procesado por cada usuario/cajero

    virtualValues: virtualValuesSchema,

    total: { type: Number, required: true },            // Total en bolivares de lo ingresado en el dia
    differential:  { type: Number, required: true },     // Diferencia entre el valor agregado y el total de sistema           

    date: { type: Date, required: true},                // Fecha correspondiente

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

module.exports = mongoose.model('PaymentMethodsRecord', schema);