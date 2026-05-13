import { terminalConstants } from '../constants';

export default function terminals(state = {}, action) {
	switch (action.type) {
		//Crear
		case terminalConstants.TERMINAL_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case terminalConstants.TERMINAL_CREATE_SUCCESS:
			return {
				success: true
			  };
		case terminalConstants.TERMINAL_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case terminalConstants.TERMINAL_TABLE_REQUEST:
			return {
				loading: true
			};
		case terminalConstants.TERMINAL_TABLE_SUCCESS:
			return {
				data: action.terminals,
				loading: false
			};
		case terminalConstants.TERMINAL_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener sede
		case terminalConstants.TERMINAL_GET_REQUEST:
			return {
				searching: true
			};
		case terminalConstants.TERMINAL_GET_SUCCESS:
			return {
				get:true,
				terminal: action.terminal,
			};
		case terminalConstants.TERMINAL_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de sede
		case terminalConstants.TERMINAL_UPDATE_REQUEST:
			return {
				updating: true
			};
		case terminalConstants.TERMINAL_UPDATE_SUCCESS:
			return {
				success: true,
				terminalUpdated: action.terminal,
			};
		case terminalConstants.TERMINAL_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener sucursales select
		case terminalConstants.TERMINAL_SELECT_REQUEST:
			return {
				getting: true
			};
		case terminalConstants.TERMINAL_SELECT_SUCCESS:
			return {
				obtained:true,
				list: action.list,
			};
		case terminalConstants.TERMINAL_SELECT_FAILURE:
			return {
				error: action.error
			};
	
		//Reportes de los puntos
		case terminalConstants.TERMINAL_RECORDS_REQUEST:
			return {
				loading: true
			};
		case terminalConstants.TERMINAL_RECORDS_SUCCESS:
			return {
				table: action.records,
				loading: false
			};
		case terminalConstants.TERMINAL_RECORDS_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		default:
		return state
	}
}