import { coinConstants } from '../constants';

export default function coin(state = {}, action) {
	switch (action.type) {
		//Crear agencia
		case coinConstants.COIN_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case coinConstants.COIN_CREATE_SUCCESS:
			return {
				success: true
			  };
		case coinConstants.COIN_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case coinConstants.COIN_TABLE_REQUEST:
			return {
				loading: true
			};
		case coinConstants.COIN_TABLE_SUCCESS:
			return {
				data: action.coins,
				loading: false
			};
		case coinConstants.COIN_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener moneda
		case coinConstants.COIN_GET_REQUEST:
			return {
				searching: true
			};
		case coinConstants.COIN_GET_SUCCESS:
			return {
				coin: action.coin,
			};
		case coinConstants.COIN_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de moneda
		case coinConstants.COIN_UPDATE_REQUEST:
			return {
				updating: true
			};
		case coinConstants.COIN_UPDATE_SUCCESS:
			return {
				success: true,
				coinUpdated: action.coin,
			};
		case coinConstants.COIN_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener monedas select
		case coinConstants.COIN_SELECT_REQUEST:
			return {
				getting: true
			};
		case coinConstants.COIN_SELECT_SUCCESS:
			return {
				obtained:true,
				list: action.list,
			};
		case coinConstants.COIN_SELECT_FAILURE:
			return {
				error: action.error
			};
	
		default:
		return state
	}
}