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
    isWholesale:Boolean,                            //  Si es una venta al mayor para el calculo del diferencial
    appliedWholesaleDiscount: Boolean,      // Si aplicó el descuento por venta al mayor de algún producto
    wholesaleDiscountDifferential: Number,  // El diferemcial por descuento de venta al mayor de algun producto
    totalDifferential: Number,              // Diferencial total -> Venta al mayor + Descuento por venta de producto al mayor
    kg:Number,
    total:Number
},{ _id : false });

const schema = new Schema({
    products: [productsSchema], 
    agency: { type: 'ObjectId', ref: 'Agency'},
    user: { type: 'ObjectId', ref: 'User'},//Cajero
    document: { type: String, required: true },
    names: { type: String, required: true },
    businessName: { type: String, default: '' },        // Razon social, si aplica
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
    terminalApply: { type: Boolean, default: false },       //  Si el terminal aplica o no
    pReference:{ type: String, default:'' },
    //Punto de venta extra
    pAmmountExtra:{ type: Number, default:0 },
    terminalExtra: { type: 'ObjectId', ref: 'Terminal'},
    terminalExtraApply: { type: Boolean, default: false },  //  Si el terminal extra aplica o no
    pReferenceExtra:{ type: String, default:'' },
    total: { type: Number },
    isWholesale: { type: Boolean, default: false },         //  Si es una venta al mayor
    appliedWholesaleDiscount: { type: Boolean, default: false },    // Si aplicó el descuento por venta al mayor de algún producto
    isCredit: { type: Boolean, default: false },            //  Si es crédito por una venta al mayor
    differential: { type: Number },                         //  Diferencial, en caso de que sea una venta al mayor
    combosDifferential: { type: Number, default: 0 },                   //  Diferencial por combos
    wholesaleDiscountDifferential: { type: Number, default: 0 },    // El diferemcial por descuento de venta al mayor
    totalDifferential: { type: Number, default: 0 },        //  Diferencial total
    isSumation: { type: Boolean, default: false },          //  Si es un abono a un crédito
    isPayment: { type: Boolean, default: false },           //  Si es el pago de un crédito
    type: { type: Number, default: 1 },                     //  Tipo de registro, Detal, Mayor, Abono o Crédito
    isTelesale: { type: Boolean, default: false },          //  Si fué por televentas
    totalWeight: { type: Number },//total peso
    valueDollar:{ type: Number, default:0 },//valor registrado en dolares
    valueEur:{ type: Number, default:0 },//valor registrado en euros
    valueCop:{ type: Number, default:0 },//valor registrado en pesos
    order: { type: Number },//referencia
    credit: { type: Number },//total credito
    seller: { type: 'ObjectId', ref: 'Seller'},             //  Código del vendedor de la venta 
    operator: { type: 'ObjectId', ref: 'Operator'},           //  Código del operador de la venta (solo para ventas al detal)
    comment: { type: String, default:'' }, //forma de pago
    createdDate: { type: Date, default: getTimeZoneDate },
    // Promo cupón (opcional): código usado y monto descontado
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

schema.plugin(AutoIncrement, {id:'sales_order_seq',inc_field: 'order'});

// Índice para reportes de formas de pago (detalle por fecha y agencia)
schema.index({ createdDate: -1, agency: 1 });

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Sales', schema);