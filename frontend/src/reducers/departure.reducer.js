import { departureConstants } from '../constants';

export default function departure(state = {}, action) {
	switch (action.type) {
		//Crear salida
		case departureConstants.DEPARTURE_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case departureConstants.DEPARTURE_CREATE_SUCCESS:
			return {
				success: true,
			  };
		case departureConstants.DEPARTURE_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case departureConstants.DEPARTURE_TABLE_REQUEST:
			return {
				loading: true
			};
		case departureConstants.DEPARTURE_TABLE_SUCCESS:
			return {
				data: action.departure,
				loading: false
			};
		case departureConstants.DEPARTURE_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener salida
		case departureConstants.DEPARTURE_GET_REQUEST:
			return {
				searching: true
			};
		case departureConstants.DEPARTURE_GET_SUCCESS:
			return {
				sale: action.sale,
			};
		case departureConstants.DEPARTURE_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de salida
		case departureConstants.DEPARTURE_UPDATE_REQUEST:
			return {
				updating: true
			};
		case departureConstants.DEPARTURE_UPDATE_SUCCESS:
			return {
				success: true,
				saleUpdated: action.sale,
			};
		case departureConstants.DEPARTURE_UPDATE_FAILURE:
			return {
				error: action.error
			};
	
		default:
		return state
	}
}