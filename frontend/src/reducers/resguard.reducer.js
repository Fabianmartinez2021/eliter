import { resguardConstants } from '../constants';

export default function resguard(state = { controller: new AbortController(), }, action) {

	switch (action.type) {

		// Adición de dinero a caja
		case resguardConstants.RESGUARD_ADD_REQUEST:
			return { 
				loading: true 
			};
		case resguardConstants.RESGUARD_ADD_SUCCESS:
			return {
				success: true,
				loading: false
			};
		case resguardConstants.RESGUARD_ADD_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		// Retiro de caja
		case resguardConstants.RESGUARD_WITHDRAWAL_REQUEST:
      		return { 
				loading: true 
			};
		case resguardConstants.RESGUARD_WITHDRAWAL_SUCCESS:
			return {
				success: true,
				loading: false 
			  };
		case resguardConstants.RESGUARD_WITHDRAWAL_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

			
		// Confirmar retiro de resguardo
		case resguardConstants.RESGUARD_CONFIRM_REQUEST:
			return { 
			  loading: true 
		  	};
		case resguardConstants.RESGUARD_CONFIRM_SUCCESS:
			return {
				successConfirmation: true,
				loading: false 
			};
		case resguardConstants.RESGUARD_CONFIRM_FAILURE:
			return { 
				error: action.error,
				loading: false
			};


		//reportes
		case resguardConstants.RESGUARD_REPORT_REQUEST:
			return {
				loading: true
			};
		case resguardConstants.RESGUARD_REPORT_SUCCESS:
			return {
				data: action.resguard,
				loading: false
			};
		case resguardConstants.RESGUARD_REPORT_FAILURE:
			return { 
				error: action.error,
				loading: false
			};
		
		// Obtener el historial
		case resguardConstants.RESGUARD_DATATABLE_REQUEST:
			return {
				loading: true,
			};
		case resguardConstants.RESGUARD_DATATABLE_SUCCESS:
			return {
				table: action.resguard,
				loading: false,
				success: true,
			};
		case resguardConstants.RESGUARD_DATATABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		// Obtener una transaccion
		case resguardConstants.RESGUARD_GET_REQUEST:
			return {
				loading: true,
			};
		case resguardConstants.RESGUARD_GET_SUCCESS:
			return {
				searched: action.resguard,
				loading: false,
				success: true,
			};
		case resguardConstants.RESGUARD_GET_FAILURE:
			return { 
				error: action.error,
				loading: false
			};


		default:
		return state
	}
}