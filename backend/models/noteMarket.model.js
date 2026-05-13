const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

var productsSchema = new Schema({ 
    id: { type: 'ObjectId', ref: 'Product' },
    code: String,
    name: String,
    presentation: String,
    price: Number,
    lastPrice: Number,
    regularPrice: Number,
    wholesalePrice: Number,
    lastWholesalePrice: Number,
    minWeight: Number,
    wholesaleDiscountPrice: Number,
    applyWholesaleDiscount: Boolean,
    minWeightWholesaleDiscount: Number,
    differential: Number,
    isOffer:Boolean,                    
    isWholesale:Boolean,                            //  Si es una venta al mayor para el calculo del diferencial
    appliedWholesaleDiscount: Boolean,      // Si aplicó el descuento por venta al mayor de algún producto
    wholesaleDiscountDifferential: Number,  // El diferemcial por descuento de venta al mayor de algun producto
    totalDifferential: Number,              // Diferencial total -> Venta al mayor + Descuento por venta de producto al mayor
    kg:Number,
    units:Number,
    total:Number,
    decrease: Boolean,
    reweigh: Boolean,
    mincemeat: Boolean,
    exempt: Boolean,
    taxed: Boolean,
    pz: Number,
    image: String,
    updateDate: Date
},{ _id : false });

const schema = new Schema({
    products: [productsSchema], 
    // Historial de modificaciones por producto (antes y después)
    modifiedProducts: [{
        type: { type: String },
        before: productsSchema,
        after: productsSchema
    }],
    agency: { type: 'ObjectId', ref: 'Agency'},
    user: { type: 'ObjectId', ref: 'User'},//Cajero
    userName: { type: String, default: '' },               //  Nombre del usuario/cajero
    total: { type: Number },
    isWholesale: { type: Boolean, default: false },         //  Si es una venta al mayor
    appliedWholesaleDiscount: { type: Boolean, default: false },    // Si aplicó el descuento por venta al mayor de algún producto
    differential: { type: Number },                         //  Diferencial, en caso de que sea una venta al mayor
    combosDifferential: { type: Number, default: 0 },                   //  Diferencial por combos
    wholesaleDiscountDifferential: { type: Number, default: 0 },    // El diferemcial por descuento de venta al mayor
    totalDifferential: { type: Number, default: 0 },        //  Diferencial total
    totalWeight: { type: Number },//total peso
    valueDollar:{ type: Number, default:0 },//valor registrado en dolares
    valueEur:{ type: Number, default:0 },//valor registrado en euros
    valueCop:{ type: Number, default:0 },//valor registrado en pesos
    totalDollar:{ type: Number, default:0 },//total en dolares
    order: { type: Number },//referencia
    seller: { type: 'ObjectId', ref: 'Seller'},             //  Código del vendedor de la venta 
    operator: { type: 'ObjectId', ref: 'Operator'},           //  Código del operador de la venta (solo para ventas al detal)
    comment: { type: String, default:'' }, //forma de pago
    // Campos para ventas al detal (opcionales)
    marketId: { type: 'ObjectId', ref: 'Market', required: false, default: null },           //  ID del mercado (solo para ventas al detal)
    marketName: { type: String, default: '' },               //  Nombre del mercado (solo para ventas al detal)
    marketCompany: { type: String, default: '' },            //  Compañía del mercado (solo para ventas al detal)
    marketAttendant: { type: String, default: '' },          //  Atendiente del mercado (solo para ventas al detal)
    marketAddress: { type: String, default: '' },            //  Dirección del mercado (solo para ventas al detal)
    driverId: { type: 'ObjectId', ref: 'Driver', required: false, default: null },           //  ID del conductor (solo para ventas al detal)
    driverName: { type: String, default: '' },               //  Nombre del conductor (solo para ventas al detal)
    idTicket: { type: String, required: false, default: null },               //  ID del ticket (solo para ventas al detal)
    status: { type: String, default: 'pending' },            //  Estado de la nota de mercado (pending, completed, cancelled, etc.)
    audit: { type: Boolean, default: false },                //  Si la nota ha sido auditada
    commentAudit: { type: String, default: '' },             //  Comentario de la auditoría
    createdDate: { type: Date, default: getTimeZoneDate }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

schema.plugin(AutoIncrement, {id:'notemarket_order_seq',inc_field: 'order'});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('NoteMarket', schema);

