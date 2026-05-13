import { orderMarketMiscellaneousConstants } from '../constants';

export default function orderMarketMiscellaneous(state = {}, action) {
	switch (action.type) {
		//DataTable
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_TABLE_REQUEST:
			return {
				loading: true
			};
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_TABLE_SUCCESS:
			return {
				table: action.data,
				loading: false
			};
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Obtener nota de suministro
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_GET_REQUEST:
			return {
				...state,
				getting: true
			};
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_GET_SUCCESS:
			return {
				...state,
				currentNote: action.note,
				getting: false
			};
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_GET_FAILURE:
			return {
				...state,
				error: action.error,
				getting: false
			};

		//Actualizar nota de suministro
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_UPDATE_REQUEST:
			return {
				...state,
				updating: true
			};
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_UPDATE_SUCCESS:
			return {
				...state,
				successUpdated: true,
				updating: false,
				noteUpdated: action.note,
			};
		case orderMarketMiscellaneousConstants.ORDER_MARKET_MISCELLANEOUS_UPDATE_FAILURE:
			return {
				...state,
				error: action.error,
				updating: false,
				successUpdated: false
			};

		default:
			return state;
	}
}
