const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

const schema = new Schema({     
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    user: { type: 'ObjectId', ref: 'User'},
    code: { type: Number },     // Código del activo    
    hasSerial: { type: Boolean, default: true },               // Si el articulo tiene serial 
    serial: { type: String, required: true, unique: true },     // Serial
    name: { type: String, required: true },         // Nombre   
    condition: { type: String, required: true },    // Condición (Nuevo o usado)
    type: { type: String, required: true },         // Articulo o repuesto
    category: { type: String, required: true },     // Categoría (Refrigeración, articulo de oficina, financiero, etc)
    description: { type: String, required: true },  // Descripción del articulo   
    status: { type: String, required: true },       // Activo, inactivo o en reparación  
    price: { type: Number },                        // Valor en dolares que tiene el activo
    daysUnderRepair: { type: Number, default: 0 },  // Número de días en los que el activo está en reparación 

    assetsCondition: { type: String },  // Estado del equipo
    accessories: { type: String },      // Accesorios
    physicalPrint: { type: Boolean },   // Posee impresion física

    wasDeleted: { type: Boolean, default: false },                      // Si el activo fue eliminado
    deletionUser: { type: 'ObjectId', ref: 'User'},         // Usuario que realizó la eliminación
    deletionDate: { type: Date, default: getTimeZoneDate }, // Fecha de eliminación del activo

    createdDate: { type: Date, default: getTimeZoneDate }
});


schema.plugin(AutoIncrement, {id:'order_assets',inc_field: 'code'});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

//Agregar virutal id, y quitar _id y contraseña de los responses
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});


module.exports = mongoose.model('Assets', schema);