import { pendingPaymentsConstants } from '../constants';

export default function pendingPayments(state = {}, action) {
	switch (action.type) {
		//Crear PENDING_PAYMENTS
		case pendingPaymentsConstants.PENDING_PAYMENTS_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case pendingPaymentsConstants.PENDING_PAYMENTS_CREATE_SUCCESS:
			return {
				success: true,
			  };
		case pendingPaymentsConstants.PENDING_PAYMENTS_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case pendingPaymentsConstants.PENDING_PAYMENTS_TABLE_REQUEST:
			return {
				loading: true
			};
		case pendingPaymentsConstants.PENDING_PAYMENTS_TABLE_SUCCESS:
			return {
				table: action.pendingPayments,
				loading: false
			};
		case pendingPaymentsConstants.PENDING_PAYMENTS_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Actualización de PENDING_PAYMENTS
		case pendingPaymentsConstants.PENDING_PAYMENTS_UPDATE_REQUEST:
			return {
				updating: true
			};
		case pendingPaymentsConstants.PENDING_PAYMENTS_UPDATE_SUCCESS:
			return {
				successUpdated: true,
			};
		case pendingPaymentsConstants.PENDING_PAYMENTS_UPDATE_FAILURE:
			return {
				error: action.error
            };
        
		default:
		return state
	}
}