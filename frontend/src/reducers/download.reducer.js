import { downloadConstants } from '../constants';
const initialState =  { loading: false, excel:null };
export default function download(state = initialState, action) {
	switch (action.type) {

		//DataTable
		case downloadConstants.EXCEL_TABLE_REQUEST:
			return {
				loading: true
			};
		case downloadConstants.EXCEL_TABLE_SUCCESS:
			return {
				excel: action.data,
				loading: false
			};
		case downloadConstants.EXCEL_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};
		case downloadConstants.EXCEL_TABLE_RESET:
			return initialState; //Resetear estado luego de una descarga
	
		default:
		return state
    }

}