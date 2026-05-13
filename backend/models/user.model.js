const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const roles = require('../enums/roles.enum');
const schema = new Schema({
    username: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: Number, required: true },
    status: { type: Number, required: true },
    agency: { type: 'ObjectId', ref: 'Agency'},
    email: { type: String, required: false, unique: true, sparse: true, default: null  },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, required: false },
    emailVerificationExpires: { type: Date, required: false },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    receiveSupportTicketNotificationsByEmail: { type: Boolean, default: false },
    /* Preferencias de correo para gerentes (rol 3): nunca se notifica sobre tickets de otras tiendas */
    notifyEmailDiffusionTicket: { type: Boolean, default: false },
    notifyEmailSameStoreTicket: { type: Boolean, default: false },
    notifyEmailTicketReplies: { type: Boolean, default: false },
    createdDate: { type: Date, default: Date.now },
    lastSeenAt: { type: Date } // Última actividad (visto en tiempo real estilo WhatsApp)

});
/*
schema.pre('save', function (next) {
    if (this.email === '') this.email = null;
    next();
});*/

//Agregar virutal id, y quitar _id y contraseña de los responses
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.hash;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
    }
});

//Obtener texto del enum del rol
schema.virtual('profile').get(function() {
    let roleDescription = roles.description[parseInt(this.role)];
    return roleDescription;
});

module.exports = mongoose.model('User', schema);