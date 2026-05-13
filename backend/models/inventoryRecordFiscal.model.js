const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

// Esquema principal para historial de inventario fiscal
const InventoryRecordFiscalSchema = new Schema({
  // product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Relación con productos
  // agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true }, // Agencia
  // kg: { type: Number, required: true }, // Peso previo en kg
  // in: { type: Number, required: true }, // Entrada en kg
  // out: { type: Number, default:0 },
  // adjustment: { type: Number, default:0 },
  // cut: { type: Number, default:0 },
  // total: { type: Number }, // Total después de la operación
  // note: { type: String, default: '' }, // Nota descriptiva
  // comment: { type: String, default: '' },
  // type: { type: Number, default:0 }, // Comentarios adicionales
  // typeIn: { type: String, required: true }, // Tipo de movimiento (entrada, ajuste, etc.)
  // isInit: { type: Boolean, default: false }, // Indica si es un registro inicial
  // createdDate: { type: Date, default: getTimeZoneDate }, // Fecha de creación
  // updatedDate: { type: Date, default: null } // Fecha de actualización
  product: { type: 'ObjectId', ref: 'Product'}, 
  agency: { type: 'ObjectId', ref: 'Agency'}, 
  kg: { type: Number, required: true },
  in: { type: Number, required: true },
  out: { type: Number, default:0 },
  adjustment: { type: Number, default:0 },
  cut: { type: Number, default:0 },//Recorte salida o entrada para código de prod 31 ó 32
  total: { type: Number },
  price: { type: Number, default:0 },
  regularPrice: { type: Number, default: 0 },
  differential: { type: Number, default: 0 },
  wholesaleDiscountDifferential: { type: Number, default: 0 },    // El diferemcial por descuento de venta al mayor
  totalDifferential: { type: Number, default: 0 },                //  Diferencial total
  isOffer: { type: Boolean, default: false },
  isWholesale: { type: Boolean, default: false },
  appliedWholesaleDiscount: { type: Boolean, default: false },    // Si en su venta aplicó el descuento por venta de algun producto al mayor
  isCredit: { type: Boolean, default: false },
  isCombo: { type: Boolean, default: false },            
  comment: { type: String, default:''},
  type: { type: Number, default:0 },//tipo de salida, 0 si es entrada, ver typeOut
  typeIn: { type: String, default:0 },//tipo de entrada si es entrada, ver typeIn
  isInit: { type: Boolean, default:false },//identifica si es inventario inicial
  createdDate: { type: Date, default: getTimeZoneDate },
});

// Función para obtener fecha con hora de Venezuela
function getTimeZoneDate() {
  return moment().subtract(4, 'hours');
}

// Transformar el modelo para incluir "id" en lugar de "_id" en el JSON
InventoryRecordFiscalSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('InventoryRecordFiscal', InventoryRecordFiscalSchema);
