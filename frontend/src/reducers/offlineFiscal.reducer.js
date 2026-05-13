import { offlineFiscalConstants } from '../constants/offlineFiscal.constants';

export default function offlineFiscal(state = {}, action) {
    switch (action.type) {
        //Crear venta offline
        case offlineFiscalConstants.SALES_FISCAL_OFFLINE_CREATE_REQUEST:
            return { 
                registering: true 
            };
        case offlineFiscalConstants.SALES_FISCAL_OFFLINE_CREATE_SUCCESS:
            return {
                success: true,
              };
        case offlineFiscalConstants.SALES_FISCAL_OFFLINE_CREATE_FAILURE:
            return {
                error: action.error
            };
    
        default:
        return state
    }
}