const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
    createdDate: { type: Date, default: getTimeZoneDate },
    updatedDate: { type: Date, default: getTimeZoneDate },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
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
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

module.exports = mongoose.model('CoinRecord', schema);
