const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    address: { type: String, default:null },
    company: { type: String },
    phone: { type: String, required: false },
    attendant: { type: String, required: true },//Encargado
    terminal: [{ type: 'ObjectId', ref: 'Terminal'}],
    orderHelper: { type: 'ObjectId', ref: 'OrderHelper'},
    billingWeeklyGoal: { type: Number, default: 0 },
    invoiceWeeklyGoal: { type: Number, default: 0 },
    /** Metas de ventas por sucursal (sustituyen la configuración por vendedor en reportes en tiempo real) */
    weeklyGoal: { type: Number, default: 0 },
    weeklyGoalMinimumPercentageOfSales: { type: Number, default: 80 },
    weeklyTicketGoal: { type: Number, default: 0 },
    applyForWeeklyGoal: { type: Boolean, default: false },
    wholesalesGoal: { type: Number, default: 0 },
    wholesalesGoalCommissionPercentage: { type: Number, default: 0 },
    goalRatio: { type: Number, default: 0 }, // billingWeeklyGoal / invoiceWeeklyGoal
    rif: { type: String, default: ''},
    billingWeeklyHistory: {
        type: [{
            id: { type: String },
            date: { type: Date },
            changedBy: { type: String, default: '' },
            type: { type: String, default: '' },
            oldValue: { type: Number, default: 0 },
            newValue: { type: Number, default: 0 },
            agencyId: { type: 'ObjectId', ref: 'Agency', default: null },
            agencyName: { type: String, default: '' }
        }],
        default: []
    },
    invoiceWeeklyHistory: {
        type: [{
            id: { type: String },
            date: { type: Date },
            changedBy: { type: String, default: '' },
            type: { type: String, default: '' },
            oldValue: { type: Number, default: 0 },
            newValue: { type: Number, default: 0 },
            agencyId: { type: 'ObjectId', ref: 'Agency', default: null },
            agencyName: { type: String, default: '' }
        }],
        default: []
    },
    lastUpdated: { type: Date },
    updatedBy: { type: String, default: '' },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date }
});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

//Obtener texto del enum del rol
schema.virtual('terminalCodes').get(function() {
    if(this.terminal && this.terminal.length > 0){
        return this.terminal.map(e => e.code).join(", ");
    }else{
        return "";
    }
    
});

module.exports = mongoose.model('Agency', schema);