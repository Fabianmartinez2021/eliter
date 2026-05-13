const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    code: { type: String, required: true },
    name: { type: String, required: true },
    presentation: { type: String, required: true },
    decrease: { type: Boolean, default: false },//Merma por empaque
    reweigh: { type: Boolean, default: false },//Merma por humedad - repesaje
    mincemeat: { type: Boolean, default: false },//Merma por picadillo
    exempt: { type: Boolean, default: false },//Producto excento
    taxed: { type: Boolean, default: false },//Producto gravado
    price: { type: Number, required: true },            // Precio
    lastPrice: { type: Number, default: 0 },            // Ultimo precio
    wholesalePrice: { type: Number, default: 0 },       // Precio al mayor
    lastWholesalePrice: { type: Number, default: 0 },   // Ultimo precio al mayor
    minWeight: { type: Number, default: 0 },            // Minimo peso para comprar al mayor
    wholesaleDiscountPrice: { type: Number, default: 0 },      // Precio al mayor
    applyWholesaleDiscount: { type: Boolean, default: false }, // Aplica para oferta al mayor
    minWeightWholesaleDiscount: { type: Number, default: 0 },  // Mínimo peso para que aplique la oferta al mayor
    pz: { type: Number },                            //  Piezas (para ser usado en fábrica)
    image: { type: String, default: null },
    nextDayPrice: { type: Number, default: null },  // Precio del día siguiente
    updateDate: { type: Date, default: '' },    //  Fecha de actualización del producto
    createdDate: { type: Date, default: Date.now },
});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Product', schema);