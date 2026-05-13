const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var productsSchema = new Schema({ 

    id: { type: 'ObjectId'},         // Creador del combo
    code: String,
    name: String,
    price: Number,
    regularPrice: Number,
    wholesalePrice: Number,
    isWholesale: Boolean, 
    differential: Number,
    isOffer: Boolean,                    
    isWholesale: Boolean,                            //  Si es una venta al mayor para el calculo del diferencial
    kg: Number,
    total: Number,
    totalDollars: Number,

    decrease: Boolean,
    reweigh: Boolean,
    mincemeat: Boolean,
    minWeight: Number,
    presentation: String,

    createdDate: { type: Date, default: Date.now },

},{ _id : false });

const schema = new Schema({
    
    recordType: { type: Number, required: true }, //    Adicion = 1, modificación = 2, eliminacion = 3

    items: [productsSchema], 
    toAllAgencies: { type: Boolean, default: true}, // Si aplica para toda las agencias o solo la especificada
    agency: { type: 'ObjectId', ref: 'Agency'},     // Se almacena la agencia a la que aplica el combo (si es el caso)
    user: { type: 'ObjectId', ref: 'User'},         // Creador del combo
    userAgency: { type: 'ObjectId', ref: 'Agency'},     // Agencia del usuario creador 
    code: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    regularPrice: { type: Number, required: true },
    totalWeight: { type: Number },//total peso
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

module.exports = mongoose.model('CombosRecord', schema);