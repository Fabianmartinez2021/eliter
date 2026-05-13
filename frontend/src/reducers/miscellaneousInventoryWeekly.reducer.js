import { miscellaneousInventoryWeeklyConstants } from '../constants';

export default function miscellaneousInventoryWeekly(state = {}, action) {
	switch (action.type) {
		//DataTable
		case miscellaneousInventoryWeeklyConstants.MISCELLANEOUS_INVENTORY_WEEKLY_TABLE_REQUEST:
			return {
				loading: true
			};
		case miscellaneousInventoryWeeklyConstants.MISCELLANEOUS_INVENTORY_WEEKLY_TABLE_SUCCESS:
			return {
				data: action.inventories,
				loading: false
			};
		case miscellaneousInventoryWeeklyConstants.MISCELLANEOUS_INVENTORY_WEEKLY_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};
	
		default:
			return state
	}
}
