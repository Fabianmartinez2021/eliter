const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);

const moment = require('moment');  

var productsSchema = new Schema({ 
    id: ObjectID,
    code: String,
    decrease: Boolean,//Merma por empaque
    reweigh: Boolean,
    name: String,
    price: Number,
    regularPrice: Number,
    differential: Number,
    wholesalePrice: Number,
    wholesalePriceBs: Number,
    wholesaleDiscountPrice: Number,
    wholesaleDiscountPriceBs: Number,
    isOffer:Boolean,  
    isWholesale: Boolean,//Merma por empaque
    kg:Number,
    total:Number,
    totalDollars:Number,
    applyWholesaleDiscount: Boolean

},{ _id : false });


/*  function() { return (this.isWholesale === true);} 
    Esta funcion implica que los valores serán requeridos unicamente si isWholesale es verdadera
*/
const schema = new Schema({
    
    products: [productsSchema], 
    agency: { type: 'ObjectId', ref: 'Agency'},
    user: { type: 'ObjectId', ref: 'User'},
    clientCode: { type: String, required: ()=>{ return (this.isWholesale === true);} },   //  Código del cliente
    documentType: { type: String, required: function() { return (this.isWholesale === true);} }, //  Si es V, J, E,G, P, R
    document: { type: String, required: true },
    names: { type: String, required: true },
    businessName: { type: String, required: function() { return (this.isWholesale === true)} }, //  Nombre del negocio
    clientType: { type: String, required: function() { return (this.isWholesale === true);} },  //  Si es revendedor independiente, restaurant, charcuteria, etc
    taxpayer: { type: String, required: function() { return (this.isWholesale === true);} },    //  Tipo de contribuyente: Especial y Ordinario
    phone:{ type: String, default:'' },
    address: { type: String, required: function() { return (this.isWholesale === true);} },     //  La direccion del cliente
    isSolvent: { type: Boolean, required: function() { return (this.isWholesale === true);} },  //  Si el cliente está solvente
    isWholesale: { type: Boolean, default: false },
    isTelesale: { type: Boolean, default: false },
    total: { type: Number },
    totalWeight: { type: Number },//total peso
    order: { type: Number },//referencia
    valueDollar: { type: Number }, // Tasa fijada cuando el ticket se creó tras cierre de forma de pago
    valueEur: { type: Number },
    valueCop: { type: Number },

    createdDate: { type: Date, default: getTimeZoneDate },
    updatedDate: { type: Date }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

schema.plugin(AutoIncrement, {id:'order_ticket',inc_field: 'order'});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Ticket', schema);