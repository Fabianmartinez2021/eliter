import { offlineConstants } from '../constants';

export default function offline(state = {}, action) {
	switch (action.type) {
		//Crear venta offline
		case offlineConstants.SALES_OFFLINE_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case offlineConstants.SALES_OFFLINE_CREATE_SUCCESS:
			return {
				success: true,
			  };
		case offlineConstants.SALES_OFFLINE_CREATE_FAILURE:
			return {
				error: action.error
			};
	
		default:
		return state
	}
}