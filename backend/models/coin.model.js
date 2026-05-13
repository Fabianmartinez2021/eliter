const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: '' },
});

// Agregar virtual id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Coin', schema);
