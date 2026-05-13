const db = require('../_helpers/db');
const PendingPaymentsFiscal = db.PendingPaymentsFiscal;
const PendingVales = db.PendingVales;

let cronFiscalService = {
    
    cronPendingPaymentsFiscal: async (id) => {
    
        if(id == "FiscalPendingTrigger2025") {
  
            // Se incrementa en uno el tiempo de los dias pendientes de todas las cuentas pendientes
            try{
                await PendingPaymentsFiscal.updateMany({ status: false  }, { $inc: { "daysCounter": 1 }});
                console.log('La actualizacion de los dias pendientes se realizó correctamente');
            }
            catch(e){
                console.log('ERROR ', e)
            }
        }
    },

    cronPendingVales: async (id) => {
    
        if(id == "ValesPendingTrigger2025") {
  
            // Se incrementa en uno el tiempo de los dias pendientes de todas las cuentas pendientes
            try{
                await PendingVales.updateMany({ status: false  }, { $inc: { "daysCounter": 1 }});
                console.log('La actualizacion de los dias pendientes se realizó correctamente');
            }
            catch(e){
                console.log('ERROR ', e)
            }
        }
    }
}

module.exports = cronFiscalService;