const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
const roles = require('../enums/roles.enum');

const schema = new Schema({
    code: { type: Number },                         // Código del operador
    document: { type: String, required: true },     // Documento del operador
    firstName: { type: String, required: true },    // Nombre o nombres
    lastName: { type: String, default: '' },        // Apellido o apellidos
    role: { type: Number, default: 10 },            // El numero 9 será el rol para futuras búsquedas en caso de que se necesite
    status: { type: Number, required: true },       // Si el operador está activo o inactivo

    hasShirt: { type: Boolean, default: false},         // Tiene camisa 
    hasPant: { type: Boolean, default: false},          // Tiene pantalones
    hasSecurityBoots: { type: Boolean, default: false}, // Tiene botas de seguridad 
    hasHat: { type: Boolean, default: false},           // Tiene gorro

    comment: { type: String, default: ''},          // Comentario

    startDate: { type: Date, required: true},                // Fecha correspondiente
    
    agency: { type: 'ObjectId', ref: 'Agency'},     // Agencia a la que pertenece el operador
    createdDate: { type: Date, default: Date.now }, 
});

//Agregar virutal id, y quitar _id y contraseña de los responses
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.hash;
    }
});

/*//Obtener texto del enum del rol
schema.virtual('profile').get(function() {
    let roleDescription = roles.description[parseInt(this.role)];
    return roleDescription;
});*/

schema.plugin(AutoIncrement, {id:'operator_seq',inc_field: 'code'});

module.exports = mongoose.model('Operator', schema);