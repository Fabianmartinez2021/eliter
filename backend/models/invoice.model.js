const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para los productos de la factura
const productSchema = new Schema({
  decrease: { type: Boolean, required: true },
  reweigh: { type: Boolean, required: true },
  mincemeat: { type: Boolean, required: true },
  exempt: { type: Boolean, required: true }, // Exento de impuestos
  taxed: { type: Boolean, required: true }, // Gravado con impuestos
  lastPrice: { type: Number, required: true }, // Último precio del producto
  wholesalePrice: { type: Number, required: true }, // Precio al por mayor
  lastWholesalePrice: { type: Number, required: true }, // Último precio al por mayor
  minWeight: { type: Number, required: true }, // Peso mínimo
  wholesaleDiscountPrice: { type: Number, required: true }, // Precio con descuento al por mayor
  applyWholesaleDiscount: { type: Boolean, required: true }, // Si se aplica el descuento al por mayor
  minWeightWholesaleDiscount: { type: Number, required: true }, // Peso mínimo para descuento
  image: { type: String, default: null }, // Imagen del producto
  updateDate: { type: Date }, // Fecha de la última actualización
  code: { type: String, required: true, index: true }, // Código del producto
  name: { type: String, required: true, index: true }, // Nombre del producto
  presentation: { type: String, required: true }, // Presentación (e.g., kg, unidad)
  price: { type: Number, required: true }, // Precio de venta
  createdDate: { type: Date, required: true }, // Fecha de creación del producto
  id: { type: String, required: true }, // ID del producto
  kg: { type: Number, required: true }, // Peso en kg
  // Campos adicionales que pueden venir desde el backend de fábrica
  units: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  regularPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  differential: { type: Number, default: 0 },
  wholesaleDiscountDifferential: { type: Number, default: 0 },
  totalDifferential: { type: Number, default: 0 },
  isOffer: { type: Boolean, default: false },
});

// Esquema para los totales de la factura
const totalsSchema = new Schema({
  taxableBase: { type: Number, required: true }, // Cambiado a Number para facilitar cálculos
  iva: { type: Number, required: true }, // IVA como número
  exempt: { type: Number, required: true }, // Exento como número
  totalAmount: { type: Number, required: true }, // Monto total como número
});

// Esquema principal para la factura
const invoiceSchema = new Schema(
  {
    address: { type: String, required: true },
    agency: { type:'ObjectId', ref: 'Agency', index: true }, // Referencia a Agency
    // Order de la factura en fábrica (opcional)
    order: { type: String, default: null, index: true },
    // ID externo de la factura en el backend de fábrica
    externalId: { type: String, default: null, index: true },
    controlNumber: { type: String, required: true, index: true }, // Número de control
    date: { type: Date, required: true, index: true }, // Fecha de la factura
    createdDate: { type: Date, required: true }, // Fecha de creación del producto
    document: { type: String, required: true }, // Documento relacionado
    documentType: { type: String, required: true }, // Tipo de documento
    names: { type: String, required: true }, // Nombre del cliente o usuario
    products: [productSchema], // Array de productos
    totals: totalsSchema, // Totales de la factura
    user: { type:'ObjectId', ref: 'User' }, // Referencia a User
    isAnulated: { type: Boolean, default: false, index: true },
    anulationComment: { type: String, default: '' },
    // Porcentaje de descuento o similar que pueda venir del backend
    percentage: { type: Number, default: null },
    // Información del market/agencia que pueda venir anidada en el payload
    market: { type: Schema.Types.Mixed, default: null },
    // Metadatos del webhook de origen
    source: { type: String, default: null },
    webhookTimestamp: { type: Date, default: null },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Middleware para asegurarse de que createdDate siempre sea igual a date
invoiceSchema.pre('save', function(next) {
  // Siempre asignamos createdDate al valor de date antes de guardar
  this.createdDate = this.date;
  next();
});

invoiceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

invoiceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  },
});

invoiceSchema.index({ date: -1, agency: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
