import { agencyConstants } from '../constants';

export default function agencies(state = {}, action) {
	switch (action.type) {
		//Crear agencia
		case agencyConstants.AGENCY_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case agencyConstants.AGENCY_CREATE_SUCCESS:
			return {
				success: true
			  };
		case agencyConstants.AGENCY_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case agencyConstants.AGENCY_TABLE_REQUEST:
			return {
				loading: true
			};
		case agencyConstants.AGENCY_TABLE_SUCCESS:
			return {
				data: action.agencies,
				loading: false
			};
		case agencyConstants.AGENCY_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener sede
		case agencyConstants.AGENCY_GET_REQUEST:
			return {
				searching: true
			};
		case agencyConstants.AGENCY_GET_SUCCESS:
			return {
				searched: true,
				agency: action.agency,
			};
		case agencyConstants.AGENCY_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de sede
		case agencyConstants.AGENCY_UPDATE_REQUEST:
			return {
				updating: true
			};
		case agencyConstants.AGENCY_UPDATE_SUCCESS:
			return {
				success: true,
				agencyUpdated: action.agency,
			};
		case agencyConstants.AGENCY_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener sucursales select
		case agencyConstants.AGENCY_SELECT_REQUEST:
			return {
				getting: true
			};
		case agencyConstants.AGENCY_SELECT_SUCCESS: {
			const list = action.list || [];
			let firstAgencyId = '';
			if (list.length > 0) {
				const a = list[0];
				const id = a.id != null ? a.id : a._id;
				firstAgencyId = id != null ? String(id) : '';
			}
			return {
				...state,
				getting: false,
				obtained: true,
				list: action.list,
				firstAgencyId,
			};
		}
		case agencyConstants.AGENCY_SELECT_FAILURE:
			return {
				...state,
				error: action.error,
				getting: false,
			};
	
		// hacer el cierre de la tienda
		case agencyConstants.AGENCY_CLOSE_REQUEST:
			return {
				getting: true
			};
		case agencyConstants.AGENCY_CLOSE_SUCCESS:
			return {
				success: true,
			};
		case agencyConstants.AGENCY_CLOSE_FAILURE:
			return {
				error: action.error
			};
			
		// Historial de cierre
		case agencyConstants.AGENCY_HISTORY_REQUEST:
			return {
				loading: true
			};
		case agencyConstants.AGENCY_HISTORY_SUCCESS:
			return {
				history: action.results,
				loading: false
			};
		case agencyConstants.AGENCY_HISTORY_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		default:
		return state
	}
}