const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var AutoIncrement = require('mongoose-sequence')(mongoose);
var moment = require('moment');

var pendingPaymentSchema = new Schema({    //  Modelo provisional del crédito
    products: [],                 //  Productos
    agency: { type: 'ObjectId', ref: 'Agency'}, //  Agencia donde se pidió el credito
    user: { type: 'ObjectId', ref: 'User'},     //  Cajero
    
    ves:{ type: Number, default:0 },        //  bolivares
    dollar:{ type: Number, default:0 },     //  dolares
    eur:{ type: Number, default:0 },        //  euros
    cop:{ type: Number, default:0 },        //  pesos
    tAmmount:{ type: Number, default:0 },
    pAmmount:{ type: Number, default:0 },
    //Punto de venta extra
    total: { type: Number },        //  Monto total del crédito
    payments: [],                   //  Listado de abonos al pago
    pending: { type: Number },      //  Monto restante a pagar
    totalWeight: { type: Number },
    valueDollar:{ type: Number, default:0 },    //valor registrado en dolares
    valueEur:{ type: Number, default:0 },       //valor registrado en euros
    valueCop:{ type: Number, default:0 },       //valor registrado en pesos
    order: { type: Number },//referencia
    daysCounter: { type: Number, default:0 },   //  Contador de dias que lleva sin pagar (aumenta cada día hasta que se pague)
    status: { type: Boolean, default: false },  //  Si el credito esta pago o no
    seller: { type: 'ObjectId', ref: 'Seller'},     //  Código del vendedor
    comment: { type: String, default:'' }, //forma de pago
    paymentDate: { type: Date },        //  Fecha en que pagó el crédito  
    createdDate: { type: Date }
},{ _id : false });

const schema = new Schema({
    
    agency: { type: 'ObjectId', ref: 'Agency'}, //  Agencia donde fué registrado el cliente
    // clientCode: { type: String },   //  Código del cliente
    documentType: { type: String, required: true }, //  Si es V, J, E,G, P, R
    document: { type: String, required: true },     
    names: { type: String, required: true },        //  Nombre del responsable del negocio
    businessName: { type: String }, //  Nombre del negocio
    clientType: { type: String, required: true },   //  Si es revendedor independiente, restaurant, charcuteria, etc
    taxpayer: { type: String, required: true },     //  Tipo de contribuyente: Especial y Ordinario
    phone: { type: String, required: true },
    isSolvent: { type: Boolean, default: true },   //  Si está solvente con los créditos
    address: { type: String, required: true },      
    referenciePoint: { type: String, default: '' }, //  Punto de referencia para llegar
    photo: { type: String, default: '' },           //  Link de la foto del lugar
    comment: { type: String, default: '' },         //  Algun comentario acerca de su conducta
    
    pendingPayment: { type: pendingPaymentSchema },       //  Venta pendiente (si la hay)

    totalSpent: { type: Number, default:0 },       // Total gastado por el cliente
    
    totalCreditAmount: { type: Number, default:0 },        // Total de crédito que tiene el cliente
    maximumTotalCreditAmount: { type: Number, default: 2000 },  // Máximo total de crédito que puede tener un cliente

    createdDate: { type: Date, default: getTimeZoneDate },
});

//Agregar virutal id, y quitar _id y contraseña de los responses
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

//schema.plugin(AutoIncrement, {id:'wholesaleClient_seq',inc_field: 'clientCode'});


//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('WholesaleClient', schema);