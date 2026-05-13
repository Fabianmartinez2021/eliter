const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    code: { type: String, required: true },
    name: { type: String, required: true },
    presentation: { type: String, required: true },
    decrease: { type: Boolean, default:false },//Merma por empaque
    reweigh: { type: Boolean, default:false },//Merma por humedad - repesaje
    mincemeat: { type: Boolean, default:false },//Merma por picadillo
    exempt:{ type: Boolean, default:false},//Producto excento
    taxed:{ type: Boolean, default:false},//Producto gravado
    price: { type: Number, required: true },
    wholesalePrice: { type: Number, default: 0 },   //  Precio al mayor
    minWeight: { type: Number, default: 0 },        //  Minimo peso para comprar al mayor
    wholesaleDiscountPrice: { type: Number, default: 0 },      // Precio al mayor
    applyWholesaleDiscount: { type: Boolean, default: false }, // Aplica para oferta al mayor
    minWeightWholesaleDiscount: { type: Number, default: 0 },  // Mínimo peso para que aplique la oferta al mayor
    image: {type: String, default: null},
    user: { type: 'ObjectId', ref: 'User'},//Usuario
    //Si es true endPrice este precio sera tomado para el reporte de inventarios a la fecha de createdDate
    endPrice: { type: Boolean, default:true }, 
    createdDate: { type: Date, default: getTimeZoneDate },
});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('ProductRecord', schema);