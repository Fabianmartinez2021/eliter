const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

var productsSchema = new Schema({ 
    name: String,
    price: Number,
    regularPrice: Number,
    differential: Number,
    isOffer:Boolean,
    kg:Number,
    total:Number
},{ _id : false });

const schema = new Schema({
    products: [productsSchema], 
    agency: { type: 'ObjectId', ref: 'Agency'},
    user: { type: 'ObjectId', ref: 'User'},//Usuario que registra
    type: { type: Number, required: true },
    typeDescription: { type: String, required: true },
    names: { type: String, required: true },
    phone:{ type: String, default:'' },
    comment:{ type: String, default:'' },
    authorizedBy:{ type: String, default:'' },
    withdrawnBy:{ type: String, default:'' },
    reason:{ type: String, default:'' },
    total: { type: Number },
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

module.exports = mongoose.model('DepartureMiscellaneous', schema);