import { pendingPaymentsFiscalConstants } from '../constants/pendingPaymentsFiscal.constants';

export default function pendingPaymentsFiscal(state = {}, action) {
    switch (action.type) {
        //Crear PENDING_PAYMENTS
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_CREATE_REQUEST:
            return { 
                registering: true 
            };
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_CREATE_SUCCESS:
            return {
                success: true,
              };
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_CREATE_FAILURE:
            return {};
      
        //DataTable
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_TABLE_REQUEST:
            return {
                loading: true
            };
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_TABLE_SUCCESS:
            return {
                table: action.pendingPayments,
                loading: false
            };
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_TABLE_FAILURE:
            return { 
                error: action.error,
                loading: false
            };

        //Actualización de PENDING_PAYMENTS
       case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_UPDATE_REQUEST:
            return {
                updating: true
            };
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_UPDATE_SUCCESS:
            return {
                successUpdated: true,
            };
        case pendingPaymentsFiscalConstants.PENDING_PAYMENTS_FISCAL_UPDATE_FAILURE:
            return {
                error: action.error
            };
        
        default:
        return state
    }
}