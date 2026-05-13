import { offerConstants } from '../constants';

export default function offer(state = {}, action) {
	switch (action.type) {
		//Crear venta
		case offerConstants.OFFER_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case offerConstants.OFFER_CREATE_SUCCESS:
			return {
				success: true,
			  };
		case offerConstants.OFFER_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case offerConstants.OFFER_TABLE_REQUEST:
			return {
				loading: true
			};
		case offerConstants.OFFER_TABLE_SUCCESS:
			return {
				data: action.offers,
				loading: false
			};
		case offerConstants.OFFER_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Eliminacion de oferta
		case offerConstants.OFFER_DELETE_REQUEST:
			return {
				deleting: true
			};
		case offerConstants.OFFER_DELETE_SUCCESS:
			return {
                successDeleted: true,
                data: action.offers,
			};
		case offerConstants.OFFER_DELETE_FAILURE:
			return {
				error: action.error
			};
	
		default:
		return state
	}
}