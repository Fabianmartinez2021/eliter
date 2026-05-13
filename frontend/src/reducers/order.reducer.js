import { orderConstants } from '../constants';

export default function order(state = { controller: new AbortController(), }, action) {
	switch (action.type) {
		//Crear un pedido
		case orderConstants.ORDER_CREATE_REQUEST:
      		return { 
				loading: true 
			};
		case orderConstants.ORDER_CREATE_SUCCESS:
			return {
				success: true,
				order: action.order,
				loading: false,
			  };
		case orderConstants.ORDER_CREATE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};


		//Actualización de un pedido
		case orderConstants.ORDER_UPDATE_REQUEST:
			return {
				updating: true
			};
		case orderConstants.ORDER_UPDATE_SUCCESS:
			return {
				success: true,
				updating: false,
			};
		case orderConstants.ORDER_UPDATE_FAILURE:
			return {
				error: action.error,
				updating: false
			};


		// Tabla de todos los pedidos
		case orderConstants.ORDER_TABLE_REQUEST:
			return {
				loading: true
			};
		case orderConstants.ORDER_TABLE_SUCCESS:
			return {
				table: action.order,
				loading: false
			};
		case orderConstants.ORDER_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};


		// obtener un pedido en específico
		case orderConstants.ORDER_GET_REQUEST:
			return {
				loading: true
			};
		case orderConstants.ORDER_GET_SUCCESS:
			return {
				order: action.order,
				loading: false
			};
		case orderConstants.ORDER_GET_FAILURE:
			return {
				error: action.error,
				loading: false
			};
	

		// Obtener todas las ayudas para las ordenes
		case orderConstants.ORDER_HELPER_GET_REQUEST:
			return {
				getting: true
			};
		case orderConstants.ORDER_HELPER_GET_SUCCESS:
			return {
				orderHelperList: action.order,
				getting: false
			};
		case orderConstants.ORDER_HELPER_GET_FAILURE:
			return {
				error: action.error,
				getting: false
			};
	

		// Crear una de las ayudas para las órdenes
		case orderConstants.ORDER_HELPER_SET_REQUEST:
			return {
				setting: true
			};
		case orderConstants.ORDER_HELPER_SET_SUCCESS:
			return {
				success: true,
				setting: false
			};
		case orderConstants.ORDER_HELPER_SET_FAILURE:
			return {
				error: action.error,
				setting: false
			};
	
		default:
		return state
	}
}