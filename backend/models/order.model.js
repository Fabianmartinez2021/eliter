const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);

const moment = require('moment');  

var productsSchema = new Schema({ 
    product: ObjectID,
    kg: Number,
    wasModified: Boolean,       // Si el articulo fué modificado
    kgDifferential: Number,     // Diferencial de la modificación
    kgTotal: Number,            // Los kg del primer pedido, más el diferencial de las modificaciones
    pz: Number,

},{ _id : false });

const schema = new Schema({
    
    products: [productsSchema], 
    agency: { type: 'ObjectId', ref: 'Agency'},
    user: { type: 'ObjectId', ref: 'User'},         // Usuario que realizó la orden
    confirmationUser: { type: 'ObjectId', ref: 'User'},  // Usuario de ventas que modificó la orden
    isModification: { type: Boolean, default: false },      // Si la orden corresponde a un anexo
    wasModified: { type: Boolean, default: false },     // Si la orden fue modificada por el gerente
    wasConfirmed: { type: Boolean, default: false },    // Si la orden ya fue confirmada por el departamento de ventas
    order: { type: Number },//referencia
    
    comment: { type: String, default: '' },             // Comentario al momento de realizar la orden
    modifierUserComment: { type: String, default: '' },  // Comentario del usuario de ventas
    
    createdDate: { type: Date, default: getTimeZoneDate },
    updatedDate: { type: Date }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

schema.plugin(AutoIncrement, {id:'order_order',inc_field: 'order'});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Order', schema);