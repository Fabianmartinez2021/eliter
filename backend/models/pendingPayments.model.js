const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

var productsSchema = new Schema({ 
    code: String,
    name: String,
    wholesalePrice: Number,
    isOffer:Boolean,
    isWholesale:Boolean, 
    kg:Number,
    totalDollars:Number
},{ _id : false });

var productsPaymentSchema = new Schema({ 
    code: String,
    name: String,
    oldTotal: Number,
    newTotal: Number,
    differential: Number,
    kg:Number,
    total:Number
},{ _id : false });

var paymentsSchema = new Schema({ 
    //products: [productsPaymentSchema],      //  Productos con los precios actualizados
    ves:{ type: Number, default:0 },        //  bolivares
    dollar:{ type: Number, default:0 },     //  dolares
    eur:{ type: Number, default:0 },        //  euros
    cop:{ type: Number, default:0 },        //  pesos
    vesChange:{ type: Number, default:0 },        //  Cambio en bolivares 
    dollarChange:{ type: Number, default:0 },     //  Cambio en dolares
    eurChange:{ type: Number, default:0 },        //  Cambio en euros
    copChange:{ type: Number, default:0 },        //  Cambio en pesos
    tAmmount:{ type: Number, default:0 },   //  Monto de transferencia
    tBank:{ type: String, default:'' },     //  Banco al que se realizó la transferencia
    tReference:{ type: String, default:'' },//  Numero de referencia de la transferencia    
    pAmmount:{ type: Number, default:0 },   //  Monto por punto
    terminal: { type: 'ObjectId', ref: 'Terminal'}, //  Punto por el cual se pasó
    pReference:{ type: String, default:'' }, // Numero de referencia del comprobante del punto
    pReferenceExtra:{ type: String, default:'' },
    total: { type: Number },                //  Monto total pagado
    valueDollar:{ type: Number, default:0 }, // Valor del Dolar en el dia
    valueEur:{ type: Number, default:0 },    // Valor del Euro en el dia
    valueCop:{ type: Number, default:0 },    // Valor del Peso en el dia
    order: { type: Number },    //referencia
    comment: { type: String, default:'' }, //forma de pago
    
    
    total: Number,              //  Total inicial de la venta 
    //currentPrice: { type: Number, default:0 },    //   otal actualizado de la venta
    //differential: { type: Number, default:0 },    //   Diferencial
    createdDate: { type: Date, default: getTimeZoneDate  }, //  Fecha del pago

},{ _id : false });

const schema = new Schema({
    products: [productsSchema],                 //  Productos
    agency: { type: 'ObjectId', ref: 'Agency'}, //  Agencia donde se pidió el credito
    user: { type: 'ObjectId', ref: 'User'},     //  Cajero
    
    //  Datos del cliente
    // clientCode: { type: String },   //  Código del cliente
    documentType: { type: String, required: true }, //  Si es V, J, E,G, P, R
    document: { type: String, required: true },
    names: { type: String, required: true },        //  Nombre del responsable del negocio
    businessName: { type: String }, //  Nombre del negocio
    clientType: { type: String, required: true },   //  Si es revendedor independiente, restaurant, charcuteria, etc
    taxpayer: { type: String, required: true },     //  Tipo de contribuyente: Especial y Ordinario
    phone:{ type: String, default:'' },
    address: { type: String, required: true },      
    comment: { type: String, default: '' },         //  Algun comentario acerca de su conducta
    isTelesale: { type: Boolean, default: false },  //  Si fué por televentas
    
    ves:{ type: Number, default:0 },        //  Total pagado con bolivares
    dollar:{ type: Number, default:0 },     //  Total pagado con dolares
    eur:{ type: Number, default:0 },        //  Total pagado con euros
    cop:{ type: Number, default:0 },        //  Total pagado con pesos
    vesChange:{ type: Number, default:0 },        //  Total pagado con pesos
    dollarChange:{ type: Number, default:0 },        //  Total pagado con pesos
    eurChange:{ type: Number, default:0 },        //  Total pagado con pesos
    copChange:{ type: Number, default:0 },        //  Total pagado con pesos
    tAmmount:{ type: Number, default:0 },   //  Total pagado por transferencia
    pAmmount:{ type: Number, default:0 },   //  Total pagado por punto
    //Punto de venta extra
    total: { type: Number },        //  Monto total del crédito
    differential: { type: Number, default: 0 }, //  Diferencial total
    payments: [paymentsSchema],     //  Listado de abonos o pagos realizados al crédito
    pending: { type: Number },      //  Monto restante a pagar expresado en dolares
    totalWeight: { type: Number },
    valueDollar:{ type: Number, default:0 },    //valor registrado en dolares
    valueEur:{ type: Number, default:0 },       //valor registrado en euros
    valueCop:{ type: Number, default:0 },       //valor registrado en pesos
    order: { type: Number, required: true },    //  Numero de identificacion
    daysCounter: { type: Number, default:0 },   //  Contador de dias que lleva sin pagar (aumenta cada día hasta que se pague)
    status: { type: Boolean, default: false },  //  Si el credito esta pago o no
    seller: { type: 'ObjectId', ref: 'Seller'},     //  Código del vendedor
    comment: { type: String, default:'' }, //forma de pago
    paymentDate: { type: Date },        //  Fecha en que pagó la totalidad del crédito  
    createdDate: { type: Date, default: getTimeZoneDate },
    baseImponible: { type: Number, default: 0 }, // Base imponible de la venta
    iva: { type: Number, default: 0 }, // IVA calculado
    exento: { type: Number, default: 0 }, // Total exento de impuestos
    type: { type: Number },                     //  Tipo de registro, Detal, Mayor, Abono o Crédito

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

module.exports = mongoose.model('pendingPayments', schema);