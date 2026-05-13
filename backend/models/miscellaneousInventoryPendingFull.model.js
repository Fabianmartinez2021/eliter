const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const productSchema = new Schema({
  lastPrice: Number,
  image: String,
  updateDate: Date,
  name: String,
  presentation: String,
  price: Number,
  createdDate: Date,
  code: Number,
  id: { type: Schema.Types.ObjectId, ref: 'Miscellaneous' },
  kg: Number
}, { _id: false });

// Schema para las modificaciones
const modificationSchema = new Schema({
  date: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  changes: { type: Object } // Aquí guardas los cambios específicos
}, { _id: false });

const pendingFullSchema = new Schema({
  typeIn: { type: String },
  agency: { type: Schema.Types.ObjectId, ref: 'Agency' },
  note: { type: String },
  comment: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  products: [productSchema],
  confirmed: { type: Boolean, default: false },
  modified: { type: Boolean, default: false },
  createdDate: { type: Date, default: () => moment().subtract(4, 'hours') },
  
  // NUEVOS CAMPOS PARA MANEJAR MODIFICACIONES
  originalData: { type: Object }, // Datos originales del pedido
  isModifiedVersion: { type: Boolean, default: false }, // Si es una versión modificada
  modifiedFrom: { type: Schema.Types.ObjectId, ref: 'InventoryMiscellaneousPendingFull' }, // Referencia al original
  modifiedDate: { type: Date }, // Fecha de modificación
  modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Usuario que modificó
  modifications: [modificationSchema], // Historial de modificaciones
  wasModified: { type: Boolean, default: false } // Si el original fue modificado
});

pendingFullSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('InventoryMiscellaneousPendingFull', pendingFullSchema);