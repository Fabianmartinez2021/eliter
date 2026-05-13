const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

var boxWithdrawalDataSchema = new Schema({
    
    authorization: String,  // La persona que da la autorizacion
    amount: Number, 
    coin: String,
    type: String,
    
},{ _id : false });


const schema = new Schema({
    agency: { type: 'ObjectId', ref: 'Agency'},
    code: { type: String, default: getRandomPasword },  // Código dinámico
    authorizerUser: { type: 'ObjectId', ref: 'User'},   // Usuario que autoriza
    authorizedUser: { type: 'ObjectId', ref: 'User'},   // Usuario autorizado

    status: { type: Boolean, default: false },  // Si el código ya fué reclamado
    updateDate: { type: Date },
    comment: { type: String, default: ''},      // Comentario
    // Objetos con los datos dependiendo del tipo de autorizacion
    isBoxWithdrawal: { type: Boolean, default: false }, // Si es un retiro de caja
    boxWithdrawalData: boxWithdrawalDataSchema,         // Datos para el retiro de caja
    

    createdDate: { type: Date, default: getTimeZoneDate },
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

// Obtener un número entero aleatorio
function getRandomPasword() {

    let password = "";
    
    for (let i = 0; i < 6; i++) {
      password += Math.floor(Math.random() * 10);
    }
    return password;
}
  
//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('AuthorizationCode', schema);