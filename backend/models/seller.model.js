const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
const roles = require('../enums/roles.enum');

const schema = new Schema({
    code: { type: Number },                         // Código del vendedor
    firstName: { type: String, required: true },    // Nombre o nombres
    lastName: { type: String, default: '' },                     // Apellido o apellidos
    creditLimit: { type: Number, required: true },  // Límite de crédito fijado para el vendedor
    role: { type: Number, default: 9 },             // El numero 9 será el rol para futuras búsquedas en caso de que se necesite
    status: { type: Number, required: true },       // Si el vendedor está activo o inactivo
    totalInCredit: { type: Number, default: 0 },    // Total dado en crédito hasta ahora
    maximumTotalCreditAmount: { type: Number, default: 0 }, // Máximo total de crédito que el vendedor puede dar
    weeklyGoal: { type: Number, default: 100000 },                  // Meta semanal por total de ingresos (si aplica)
    weeklyGoalMinimumPercentageOfSales: { type: Number, default: 80 },   // Porcentaje mínimo de ventas para ganar la comision
    weeklyTicketGoal: { type: Number, default: 0 },                 // Meta semanal de tickets (cantidad de tickets)
    applyForWeeklyGoal: { type: Boolean, default: false },          //  Si aplica para ventas semanales
    wholesalesGoal: { type: Number, default: 1000 },                // Meta a la que debe llevar el vendedor
    wholesalesGoalCommissionPercentage: { type: Number, default: 5 },     // Porcentaje de comision que se llea el vendedor
    totalSold: { type: Number, default: 0 },        // Total histórico vendido 
    // Historial de metas semanales
    weeklyGoalHistory: [{
        date: { type: Date, required: true },                           // Fecha cuando se estableció la meta
        weeklyGoal: { type: Number, required: true },                   // Meta semanal establecida
        weeklyGoalMinimumPercentageOfSales: { type: Number, required: true },  // Porcentaje mínimo de ventas para esa meta
        weeklyTicketGoal: { type: Number, default: 0 }                 // Meta semanal de tickets (cantidad de tickets)
    }],  
    agency: { type: 'ObjectId', ref: 'Agency'},     // Agencia a la que pertenece el vendedor
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

schema.plugin(AutoIncrement, {id:'seller_seq',inc_field: 'code'});

module.exports = mongoose.model('Seller', schema);