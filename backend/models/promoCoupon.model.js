const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Cupones de la promoción (tickets irrepetibles).
 * Un documento por código ("00" a "3000"). Se usa para validar y reservar atómicamente el cupón.
 */
const schema = new Schema({
    // Código del cupón (ej. "00", "01", "3000"). Único en la colección.
    code: { type: String, required: true, unique: true },
    // Si el cupón ya fue canjeado en una venta
    used: { type: Boolean, default: false },
    // Fecha/hora en que se usó (cuando used pasa a true)
    usedAt: { type: Date, default: null }
});

// Índice compuesto para reserva atómica eficiente (findOneAndUpdate por code + used)
schema.index({ code: 1, used: 1 });

module.exports = mongoose.model('PromoCoupon', schema);
