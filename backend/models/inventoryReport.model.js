const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var moment = require('moment');

const schema = new Schema({
    
    product: { type: 'ObjectId', ref: 'Product'}, 
    agency: { type: 'ObjectId', ref: 'Agency'}, 
    totalOutAmount: { type: Number },   // Monto total en BS de lo que salió del producto de la tienda
    totalSell: { type: Number },        // Total vendido
    totalIn: { type: Number },          // Total que entró
    totalWholesales: { type: Number },                      // Total por ventas al mayor         
    totalWholesaleDifferential: { type: Number },           // Diferencial por ventas al mayor
    totalWholesaleDiscountDifferential: { type: Number },   // Diferencial por descuento de ventas al mayor
    totalInCredit: { type: Number },                        // Total dado en crédito
    totalInCreditDifferential: { type: Number },            // Diferencial total de lo dado por crédito
    totalComboDifferential: { type: Number },   // Diferencial total por combos
    totalDecrease: { type: Number },    // Total por mermas
    totalPacking: { type: Number },     // Total en mermas por Empaque
    totalReweigh: { type: Number },     // Total en mermas por Repesaje
    totalMincemeat: { type: Number },   // Total en mermas por Recortes
    totalOut: { type: Number },         // Total en salidas 
    totalDonation: { type: Number },    // Total en mermas por Donación
    totalTasting: { type: Number },                    // Total en mermas por Degustación
    totalPackaging: { type: Number },                 // Total en salidas por Empaque
    totalCoupon: { type: Number },                     // Total en salidas por Vale
    totalCorrection: { type: Number },                 // Total en salidas por Corrección
    totalTransfer: { type: Number },                   // Total en salidas por Trasnferencia entre tiendas
    totalTransferToFatt: { type: Number },             // Total en salidas por Trasnferencia a fabrica
    totalCut: { type: Number },                        // Total por recortes
    initial: { type: Number },                                 // Cantidad inicial en kg
    initialAmount: { type: Number },              // Cantidad inicial en Bs
    totalAdjustment: { type: Number },
    totalAdjustmentAmount: { type: Number },
    physicalQuantity: { type: Number },
    physicalAmount: { type: Number },
    TotalQuantity: { type: Number },
    TotalAmount: { type: Number },
    totalInAmount: { type: Number },
    totalSellAmount: { type: Number },
    totalCutAmount: { type: Number },
    totalDecreaseAmount: { type: Number },
    totalWholesalesAmount: { type: Number },
    totalInCreditAmount: { type: Number },
    totalPackingAmount: { type: Number },
    totalReweighAmount: { type: Number },
    totalMincemeatAmount: { type: Number },
    totalDonationAmount: { type: Number },
    totalTastingAmount: { type: Number },
    totalPackagingAmount: { type: Number },
    totalCouponAmount: { type: Number },
    totalCorrectionAmount: { type: Number },
    totalTransferAmount: { type: Number },
    totalTransferToFattAmount: { type: Number },
    priceAt: { type: Number },                  // Precio del activo al momento

    totalAdjustmentAmountSum: { type: Number },  

    date: { type: Date },
    createdDate: { type: Date, default: getTimeZoneDate },
});

//Obtener fecha con hora venezuela
function getTimeZoneDate(){
    return moment().subtract(4, 'hours');
}

//Agregar virutal id, y quitar _id
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('InventoryReport', schema);