const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

// Esquema principal para inventario fiscal
const InventoryFiscalSchema = new Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Relación con productos
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true }, // Agencia
  kg: { type: Number, required: true }, // Peso en kg
  minimumStock: { type: Number, default: 0 }, // Stock mínimo
  order: { type: Number, default: 0 }, // Pedido actual
  orderWasConfirmed: { type: Boolean, default: false }, // Confirmación de pedido
  modification: { type: Number, default: 0 }, // Modificaciones
  modificationWasConfirmed: { type: Boolean, default: false }, // Confirmación de modificaciones
  createdDate: { type: Date, default: getTimeZoneDate }, // Fecha de creación
  updatedDate: { type: Date, default: null } // Fecha de actualización
});

// Función para obtener fecha con hora de Venezuela
function getTimeZoneDate() {
  return moment().subtract(4, 'hours');
}

// Transformar el modelo para incluir "id" en lugar de "_id" en el JSON
InventoryFiscalSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('InventoryFiscal', InventoryFiscalSchema);


