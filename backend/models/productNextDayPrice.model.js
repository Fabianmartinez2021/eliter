const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    nextDayPrice: { type: Number, required: true },
    createdDate: { type: Date, default: getTimeZoneDate },
    updatedDate: { type: Date, default: getTimeZoneDate },
});

// Agregar virtual id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

//Obtener fecha con hora venezuela
function getTimeZoneDate() {
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('ProductNextDayPrice', schema);

