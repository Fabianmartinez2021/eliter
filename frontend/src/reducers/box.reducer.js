import { boxConstants } from '../constants';

export default function box(state = { controller: new AbortController(), }, action) {

	switch (action.type) {
		//apertura de caja
		case boxConstants.BOX_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case boxConstants.BOX_CREATE_SUCCESS:
			return {
				success: true
			  };
		case boxConstants.BOX_CREATE_FAILURE:
			return {};

		//retiro de caja
		case boxConstants.BOX_WITHDRAWAL_REQUEST:
      		return { 
				withdrawing: true 
			};
		case boxConstants.BOX_WITHDRAWAL_SUCCESS:
			return {
				success: true
			  };
		case boxConstants.BOX_WITHDRAWAL_FAILURE:
			return {};

		//DataTable
		case boxConstants.BOX_TABLE_REQUEST:
			return {
				loading: true
			};
		case boxConstants.BOX_TABLE_SUCCESS:
			return {
				data: action.boxes,
				loading: false
			};
		case boxConstants.BOX_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Detalle de caja por divisa
		case boxConstants.BOX_TABLE_DETAIL_REQUEST:
			return {
				loadingDetail: true,
				controller: action.controller
			};
		case boxConstants.BOX_TABLE_DETAIL_SUCCESS:
			return {
				dataDetail: action.box,
				loadingDetail: false,
				successDetail: true,
			};
		case boxConstants.BOX_TABLE_DETAIL_FAILURE:
			return { 
				error: action.error,
				loadingDetail: false
			};

		case boxConstants.BOX_CLOSING_REQUEST:
			return { 
				closing: true 
			};
		case boxConstants.BOX_CLOSING_SUCCESS:
			return {
				closingSuccess: true,
			};
		case boxConstants.BOX_CLOSING_FAILURE:
			return {};
			

		case boxConstants.BOX_CORRECTION_REQUEST:
			return { 
				checking: true 
			};
		case boxConstants.BOX_CORRECTION_SUCCESS:
			return {
				checkingSuccess: true,
			};
		case boxConstants.BOX_CORRECTION_FAILURE:
			return {};
  

		// Adición de dinero a caja
		case boxConstants.BOX_ADD_REQUEST:
			return { 
			  adding: true 
			};
		case boxConstants.BOX_ADD_SUCCESS:
			return {
				success: true
				};
		case boxConstants.BOX_ADD_FAILURE:
			return {};

	
		default:
		return state
	}
}