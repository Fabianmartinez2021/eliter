const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    code: { type: String, required: true, unique: true },
    serial: { type: String, required: true },
    bank: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    description: { type: String, default: '' },
    comment: {type: String, default:''},
    used: { type: Boolean, default: false },
    apply: { type: Boolean, default: false },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date }
});

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Terminal', schema);