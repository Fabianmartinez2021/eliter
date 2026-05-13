
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

var productsSchema = new Schema({ 
    name: String,
    price: Number,
    regularPrice: Number,
    differential: Number,
    isOffer:Boolean,                    
    isWholesale:Boolean,  //  Si es una venta al mayor para el calculo del diferencial
    kg:Number,
    total:Number
},{ _id : false });

const schema = new Schema({
    products: [productsSchema], 
    agency: { type: 'ObjectId', ref: 'Agency'},
    user: { type: 'ObjectId', ref: 'User'},//Cajero
    document: { type: String, required: true },
    names: { type: String, required: true },
    phone:{ type: String, default:'' },
    ves:{ type: Number, default:0 },//bolivares
    dollar:{ type: Number, default:0 },//dolares
    eur:{ type: Number, default:0 },//euros
    cop:{ type: Number, default:0 },//pesos
    tAmmount:{ type: Number, default:0 },
    tBank:{ type: String, default:'' },
    tReference:{ type: String, default:'' },
    pAmmount:{ type: Number, default:0 },
    terminal: { type: 'ObjectId', ref: 'Terminal'},
    pReference:{ type: String, default:'' },
    //Punto de venta extra
    pAmmountExtra:{ type: Number, default:0 },
    terminalExtra: { type: 'ObjectId', ref: 'Terminal'},
    pReferenceExtra:{ type: String, default:'' },
    total: { type: Number },
    isWholesale: { type: Boolean, default: false },                 //  Si es una venta al mayor
    isCredit: { type: Boolean, default: false },            //  Si es crédito por una venta al mayor
    differential: { type: Number },                 //  Diferencial, en caso de que sea una venta al mayor
    isSumation: { type: Boolean, default: false },                     //  Si es un abono a un crédito
    isPayment: { type: Boolean, default: false },
    type: { type: Number, default: 1 },                     //  Tipo de registro, Detal, Mayor, Abono o Crédito
    totalWeight: { type: Number },//total peso
    valueDollar:{ type: Number, default:0 },//valor registrado en dolares
    valueEur:{ type: Number, default:0 },//valor registrado en euros
    valueCop:{ type: Number, default:0 },//valor registrado en pesos
    order: { type: Number, required: true },//referencia
    credit: { type: Number },//total credito
    comment: { type: String, default:'' }, //forma de pago
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

module.exports = mongoose.model('Wholesales', schema);