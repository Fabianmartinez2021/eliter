const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const enumBox = require('../enums/box.enum'); 
var moment = require('moment');


var commissionResultWholesaleGoalSchema = new Schema({ 

    agency: { type: 'ObjectId', ref: 'Agency'},     // Agencia
    seller: { type: 'ObjectId', ref: 'Seller'},     // Vendedor
    
    total: Number,
    totalDollars: Number,
    totalWholesales: Number,
    totalSumations: Number,
    valueDollar: Number,
    weeklyGoalPercentage: Number,
    weeklyGoalReached: Boolean,
    wholesalesGoalPercentage: Number,
    wholesalesGoalReached: Boolean,
    
},{ _id : false });


var commissionResultWeeklyGoalSchema = new Schema({ 

    agency: { type: 'ObjectId', ref: 'Agency'},     // Agencia
    seller: { type: 'ObjectId', ref: 'Seller'},     // Vendedor
   
    total: Number,
    valueDollar: Number,
    weeklyGoalPercentage: Number,
    weeklyGoalReached: Boolean,

},{ _id : false });


const schema = new Schema({
    
    commissionResultsWholesaleGoal: [commissionResultWholesaleGoalSchema],
    commissionResultsWeeklyGoal: [commissionResultWeeklyGoalSchema],

    startDate: { type: Date, required: true},   // Inicio de la semana
    endDate: { type: Date, required: true},     // Final de la semana

    createdDate: { type: Date, default: getTimeZoneDate },  // Fecha de creación del reporte (puede ser el dia siguiente)
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

module.exports = mongoose.model('CommissionsReport', schema);