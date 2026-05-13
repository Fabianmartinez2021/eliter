import { noteMarketConstants } from '../constants';

export default function noteMarket(state = {}, action) {
	switch (action.type) {
		//DataTable
		case noteMarketConstants.NOTE_MARKET_TABLE_REQUEST:
			return {
				loading: true
			};
		case noteMarketConstants.NOTE_MARKET_TABLE_SUCCESS:
			return {
				table: action.data,
				loading: false
			};
		case noteMarketConstants.NOTE_MARKET_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Obtener nota
		case noteMarketConstants.NOTE_MARKET_GET_REQUEST:
			return {
				getting: true
			};
		case noteMarketConstants.NOTE_MARKET_GET_SUCCESS:
			return {
				currentNote: action.note,
				getting: false
			};
		case noteMarketConstants.NOTE_MARKET_GET_FAILURE:
			return {
				error: action.error,
				getting: false
			};

		//Actualizar nota
		case noteMarketConstants.NOTE_MARKET_UPDATE_REQUEST:
			return {
				updating: true
			};
		case noteMarketConstants.NOTE_MARKET_UPDATE_SUCCESS:
			return {
				successUpdated: true,
				updating: false,
				noteUpdated: action.note,
			};
		case noteMarketConstants.NOTE_MARKET_UPDATE_FAILURE:
			return {
				error: action.error,
				updating: false,
				successUpdated: false
			};

		default:
			return state;
	}
}

