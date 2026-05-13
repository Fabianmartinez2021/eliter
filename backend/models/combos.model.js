const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var productsSchema = new Schema({ 

    id: { type: 'ObjectId'},         // id del producto 
    code: String,
    name: String,
    price: Number,
    regularPrice: Number,
    wholesalePrice: Number,
    isWholesale: Boolean, 
    differential: Number,
    isOffer: Boolean,                    
    isWholesale: Boolean,       //  Si es una venta al mayor para el calculo del diferencial
    kg: Number,
    total: Number,              //  Total en bs del producto, a precio regular
    totalDollars: Number,

    decrease: Boolean,
    reweigh: Boolean,
    mincemeat: Boolean,
    minWeight: Number,
    presentation: String,

    createdDate: { type: Date, default: Date.now },

    /*set multiplier(valor) {
        if (this.kg){
            this.kg *= valor    
        }
        if (this.total){
            this.total *= valor    
        }
        if (this.edad){
            this.edad *= valor    
        }
    },*/

},{ _id : false });

const schema = new Schema({
    items: [productsSchema], 
    toAllAgencies: { type: Boolean, default: true}, // Si aplica para toda las agencias o solo la especificada
    agency: { type: 'ObjectId', ref: 'Agency'},     // Se almacena la agencia a la que aplica el combo (si es el caso)
    user: { type: 'ObjectId', ref: 'User'},         // Creador del combo
    userAgency: { type: 'ObjectId', ref: 'Agency'},     // Agencia del usuario creador 
    code: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    regularPrice: { type: Number, required: true },
    totalWeight: { type: Number },                  // Total peso
    updatedDate: { type: Date},                     //  Fecha de actualización del combo
    createdDate: { type: Date, default: Date.now },

   /* set multiplier(valor) {
        if (this.totalWeight){
            this.totalWeight *= valor    
        }
        if (this.total){
            this.total *= valor    
        }
        if (this.edad){
            this.edad *= valor    
        }
    },*/
});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Combos', schema);