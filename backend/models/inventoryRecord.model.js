const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    product: { type: 'ObjectId', ref: 'Product'}, 
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    kg: { type: Number, required: true },
    in: { type: Number, required: true },
    out: { type: Number, default:0 },
    adjustment: { type: Number, default:0 },
    cut: { type: Number, default:0 },//Recorte salida o entrada para código de prod 31 ó 32
    total: { type: Number },
    note: { type: String, required: true },
    price: { type: Number, default:0 },
    regularPrice: { type: Number, default: 0 },
    differential: { type: Number, default: 0 },
    wholesaleDiscountDifferential: { type: Number, default: 0 },    // El diferemcial por descuento de venta al mayor
    totalDifferential: { type: Number, default: 0 },                //  Diferencial total
    isOffer: { type: Boolean, default: false },
    isWholesale: { type: Boolean, default: false },
    appliedWholesaleDiscount: { type: Boolean, default: false },    // Si en su venta aplicó el descuento por venta de algun producto al mayor
    isCredit: { type: Boolean, default: false },
    isCombo: { type: Boolean, default: false },            
    comment: { type: String, default:''},
    type: { type: Number, default:0 },//tipo de salida, 0 si es entrada, ver typeOut
    typeIn: { type: Number, default:0 },//tipo de entrada si es entrada, ver typeIn
    isInit: { type: Boolean, default:false },//identifica si es inventario inicial
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

module.exports = mongoose.model('InventoryRecord', schema);