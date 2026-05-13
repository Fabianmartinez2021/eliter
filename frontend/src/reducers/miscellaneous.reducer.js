import { miscellaneousConstants } from '../constants';

export default function miscellaneous(state = {}, action) {
	switch (action.type) {
		//Crear miscellaneouso
		case miscellaneousConstants.MISCELLANEOUS_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case miscellaneousConstants.MISCELLANEOUS_CREATE_SUCCESS:
			return {
				success: true
			  };
		case miscellaneousConstants.MISCELLANEOUS_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case miscellaneousConstants.MISCELLANEOUS_TABLE_REQUEST:
			return {
				loading: true
			};
		case miscellaneousConstants.MISCELLANEOUS_TABLE_SUCCESS:
			return {
				obtained: true,
				data: action.miscellaneous,
				loading: false
			};
		case miscellaneousConstants.MISCELLANEOUS_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener miscellaneouso
		case miscellaneousConstants.MISCELLANEOUS_GET_REQUEST:
			return {
				searching: true
			};
		case miscellaneousConstants.MISCELLANEOUS_GET_SUCCESS:
			return {
				product: action.product,
			};
		case miscellaneousConstants.MISCELLANEOUS_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de miscellaneouso
		case miscellaneousConstants.MISCELLANEOUS_UPDATE_REQUEST:
			return {
				updating: true
			};
		case miscellaneousConstants.MISCELLANEOUS_UPDATE_SUCCESS:
			return {
				success: true,
				productUpdated: action.product,
			};
		case miscellaneousConstants.MISCELLANEOUS_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener miscellaneousos select
		case miscellaneousConstants.MISCELLANEOUS_SELECT_REQUEST:
			return {
				getting: true
			};
		case miscellaneousConstants.MISCELLANEOUS_SELECT_SUCCESS:
			return {
				obtained:true,
				list: action.list,
			};
		case miscellaneousConstants.MISCELLANEOUS_SELECT_FAILURE:
			return {
				error: action.error
			};
		// tabla pending
		case miscellaneousConstants.MISCELLANEOUS_PENDING_REQUEST:
			return {
				loading: true
			};
		case miscellaneousConstants.MISCELLANEOUS_PENDING_SUCCESS:
			return {
				dataPending: action.pending,
				loading: false
			};
		case miscellaneousConstants.MISCELLANEOUS_PENDING_FAILURE:
			return { 
				error: action.error,
				loading: false
			};
		case miscellaneousConstants.MISCELLANEOUS_ACCEPT_REQUEST:
			return {
				loading: true
			};
		case miscellaneousConstants.MISCELLANEOUS_ACCEPT_SUCCESS:
			return {
				success: true,
			  };
		case miscellaneousConstants.MISCELLANEOUS_ACCEPT_FAILURE:
			return {};	
		case miscellaneousConstants.MISCELLANEOUS_GET_PENDING_REQUEST:
			return {
				loading: true
			};
		case miscellaneousConstants.MISCELLANEOUS_GET_PENDING_SUCCESS:
			return {
				pending: action.pending,
				loading: false
			};
		case miscellaneousConstants.MISCELLANEOUS_GET_PENDING_FAILURE:
			return { 
				error: action.error,
				loading: false
			};
		default:
		return state
	}
}