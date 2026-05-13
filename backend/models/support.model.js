const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    // Referencia al ID del usuario que crea la solicitud
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Cuando admin (rol 1) crea: tienda destino a la que enviar (para notificar a sus gerentes)
    targetAgency: { type: Schema.Types.ObjectId, ref: 'Agency' },
    // Ticket de difusión: admin selecciona "todas las tiendas" - todos los gerentes pueden ver/responder
    broadcastToAllManagers: { type: Boolean, default: false },
    affair: { type: String, required: true }, 
    description: { type: String, required: true }, 
    initialImage: { type: String },                          // Imagen base64 al crear ticket
    status: {  
        type: String, 
        enum: ['Abierto', 'En Proceso', 'Cerrado'], 
        default: 'Abierto' 
    },
    priority: {  
        type: String, 
        enum: ['Baja', 'Media', 'Alta'], 
        default: 'Baja' 
    },
    
    // --- Hilo de respuestas ---
    replies: [{
        sender: { type: Schema.Types.ObjectId, ref: 'User' }, // Quién envía el mensaje
        message: { type: String, default: '' },                // Contenido del mensaje
        image: { type: String },                              // Imagen base64 en la respuesta
        role: { type: String },                              // 'Cliente' o 'Soporte'
        createdAt: { type: Date, default: Date.now },        // Fecha de la respuesta
        seenBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, seenAt: { type: Date, default: Date.now } }] // Quién ha visto (estilo WhatsApp)
    }],

    createdDate: { type: Date, default: Date.now },
    closedDate: { type: Date },                              // Fecha y hora de cierre
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' }   // Quién cerró el ticket
});

// Para que cada caso tenga un número correlativo (Caso #1, #2...)
const AutoIncrement = require('mongoose-sequence')(mongoose);
schema.plugin(AutoIncrement, { inc_field: 'supportNumber' });

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Support', schema);