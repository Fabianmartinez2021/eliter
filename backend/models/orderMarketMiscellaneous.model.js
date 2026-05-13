const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subdocumento para los productos de la orden de mercado misceláneos
const OrderMarketMiscellaneousProductSchema = new Schema(
  {
    // ID del producto misceláneo en tiendas (opcional, se puede mapear por código si es necesario)
    id: { type: Schema.Types.ObjectId, ref: 'Miscellaneous', required: false },
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    lastPrice: { type: Number, default: 0 },
    kg: { type: Number, default: 0 },
    units: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    code: { type: String, default: '' },
    presentation: { type: String, default: '' },
    pz: { type: Number, default: 0 },
    image: { type: String, default: '' },
    updateDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Esquema principal de la orden de mercado misceláneos que viene desde fábrica
const OrderMarketMiscellaneousSchema = new Schema(
  {
    // ID propio de la orden en fábrica. Lo usamos también como _id en tiendas para mantener trazabilidad.
    // Si no viene, Mongoose generará uno nuevo.
    order: { type: Number },

    products: { type: [OrderMarketMiscellaneousProductSchema], default: [] },

    // Historial de productos modificados (se almacena como estructura libre)
    modifiedProducts: { type: Array, default: [] },

    // Sucursal/agency en tiendas (se mapea a partir de marketId o agency del payload)
    agency: { type: Schema.Types.ObjectId, ref: 'Agency' },

    // Usuario que generó la orden en fábrica (referencia por id de usuario de fábrica si es compartido)
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: '' },

    total: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },

    valueDollar: { type: Number, default: 0 },
    valueEur: { type: Number, default: 0 },
    valueCop: { type: Number, default: 0 },
    totalDollar: { type: Number, default: 0 },

    seller: { type: Schema.Types.ObjectId, ref: 'Seller' },
    operator: { type: Schema.Types.ObjectId, ref: 'Operator' },

    comment: { type: String, default: '' },

    // En fábrica este campo se llama marketId/market, aquí lo guardamos también pero
    // normalmente agency será el ID de la sucursal en tiendas.
    marketId: { type: Schema.Types.ObjectId },
    marketName: { type: String, default: '' },
    marketCompany: { type: String, default: '' },
    marketAttendant: { type: String, default: '' },
    marketAddress: { type: String, default: '' },

    driverId: { type: Schema.Types.ObjectId },
    driverName: { type: String, default: '' },

    status: { type: String, default: 'pending' },
    invoice: { type: Boolean, default: false },

    audit: { type: Boolean, default: false },
    commentAudit: { type: String, default: '' },
  },
  {
    timestamps: {
      createdAt: 'createdDate',
      updatedAt: 'updatedDate',
    },
  }
);

module.exports = mongoose.model(
  'OrderMarketMiscellaneous',
  OrderMarketMiscellaneousSchema
);

