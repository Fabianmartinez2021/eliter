import { authorizationCodeConstants } from '../constants';

export default function authorizationCode(state = { controller: new AbortController(), }, action) {
	switch (action.type) {
		
		case authorizationCodeConstants.REGISTER_REQUEST:
			return {
				registering: true
			};
		case authorizationCodeConstants.REGISTER_SUCCESS:
			return {
				success: true,
				data: action.data
			};
		case authorizationCodeConstants.REGISTER_FAILURE:
			return { 
				error: action.error
			};

			
		//eliminar un código
		case authorizationCodeConstants.DELETE_REQUEST:
			return {
				deleting: true
			};
		case authorizationCodeConstants.DELETE_SUCCESS:
			return {
				deleted: true,
			};
		case authorizationCodeConstants.DELETE_FAILURE:
			return {
				error: action.error,
			};


		//DataTable
		case authorizationCodeConstants.TABLE_REQUEST:
			return {
				loading: true
			};
		case authorizationCodeConstants.TABLE_SUCCESS:
			return {
				table: action.data,
				loading: false
			};
		case authorizationCodeConstants.TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};


		// Solicitar un código
		case authorizationCodeConstants.CODE_REQUEST:
			return {
				loading: true
			};
		case authorizationCodeConstants.CODE_SUCCESS:
			return {
				data: action.data,
				success: true
			};
		case authorizationCodeConstants.CODE_FAILURE:
			return { 
				error: action.error,
			};
		default:
		return state
	}
}