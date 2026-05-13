import { cronConstants } from '../constants';

export default function cron(state = {}, action) {
	switch (action.type) {
		
		//DataTable
		case cronConstants.CRON_TABLE_REQUEST:
			return {
				loading: true
			};
		case cronConstants.CRON_TABLE_SUCCESS:
			return {
				data: action.data,
				loading: false
			};
		case cronConstants.CRON_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};
	
		default:
		return state
	}
}