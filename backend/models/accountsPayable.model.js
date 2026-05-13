const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const productLineSchema = new Schema({
    code: String,
    name: String,
    kg: Number,
    price: Number
}, { _id: false });

const paymentMixSchema = new Schema({
    cashUsd: { type: Number, default: 0 },
    cashVes: { type: Number, default: 0 },
    cashEur: { type: Number, default: 0 },
    cashCop: { type: Number, default: 0 },
    transferUsd: { type: Number, default: 0 },
    transferVes: { type: Number, default: 0 }
}, { _id: false });

/** Tasas ingresadas manualmente (no liscoin): VES/COP como moneda por 1 USD; EUR como USD por 1 EUR */
const paymentRatesSchema = new Schema({
    vesPerUsd: { type: Number },
    usdPerEur: { type: Number },
    copPerUsd: { type: Number }
}, { _id: false });

const paymentEntrySchema = new Schema({
    amountUsd: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'transfer', 'mixed'] },
    paymentReference: { type: String, default: '' },
    paymentNote: { type: String, default: '' },
    paymentMix: { type: paymentMixSchema },
    paymentRates: { type: paymentRatesSchema },
    paymentDate: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: true });

const schema = new Schema({
    supplierName: { type: String, required: true },
    agency: { type: Schema.Types.ObjectId, ref: 'Agency', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceRef: { type: String, default: '' },
    dueDate: { type: Date },
    note: { type: String, default: '' },
    comment: { type: String, default: '' },
    products: [productLineSchema],
    total: { type: Number, required: true },
    pending: { type: Number, required: true },
    status: { type: Boolean, default: false },
    daysCounter: { type: Number, default: 0 },
    createdDate: { type: Date, default: getTimeZoneDate },

    /** Pago referencial (no mueve cajas): efectivo, transferencia o mixto */
    paymentMethod: { type: String, enum: ['cash', 'transfer', 'mixed'] },
    paymentReference: { type: String, default: '' },
    paymentMix: { type: paymentMixSchema },
    /** Tasas usadas en el último abono (mixto) */
    paymentRates: { type: paymentRatesSchema },
    /** Monto del último abono en USD equivalente */
    paymentAmountUsd: { type: Number },
    paymentNote: { type: String, default: '' },
    paymentDate: { type: Date },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User' },
    /** Historial de abonos (equiv. USD); pending = total - sum(amountUsd) */
    payments: { type: [paymentEntrySchema], default: undefined }
});

function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('AccountsPayable', schema, 'accountsPayable');
