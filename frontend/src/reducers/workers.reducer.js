import { workerConstants } from '../constants';

export default function workers(state = {}, action) {
	switch (action.type) {
		case workerConstants.GETALL_REQUEST:
			return {
				loading: true
			};
		case workerConstants.GETALL_SUCCESS:
			return {
				items: action.workers
			};
		case workerConstants.GETALL_FAILURE:
			return { 
				error: action.error
			};

		//Actualización de información
		case workerConstants.UPDATE_DATA_REQUEST:
			return {
				updating: true
			};
		case workerConstants.UPDATE_DATA_SUCCESS:
			return {
				success: true,
				workerUpdated: action.worker,
			};
		case workerConstants.UPDATE_DATA_FAILURE:
			return {
				error: action.error
			};

		//DataTable
		case workerConstants.WORKER_TABLE_REQUEST:
			return {
				loading: true
			};
		case workerConstants.WORKER_TABLE_SUCCESS:
			return {
				data: action.workers,
				loading: false
			};
		case workerConstants.WORKER_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener usuario
		case workerConstants.WORKER_GET_REQUEST:
			return {
				searching: true
			};
		case workerConstants.WORKER_GET_SUCCESS:
			return {
				searched:true,
				worker: action.worker,
			};
		case workerConstants.WORKER_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de usuario desde admin
		case workerConstants.WORKER_UPDATE_REQUEST:
			return {
				updating: true
			};
		case workerConstants.WORKER_UPDATE_SUCCESS:
			return {
				success: true,
				workerUpdated: action.worker,
			};
		case workerConstants.WORKER_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//Obtener lista de usuarios y sucursales
		case workerConstants.WORKER_LIST_REQUEST:
			return {
				getting: true
			};
		case workerConstants.WORKER_LIST_SUCCESS:
			return {
				obtained: true,
				list: action.workers,
			};
		case workerConstants.WORKER_LIST_FAILURE:
			return {
				error: action.error
			};
			
		default:
		return state
	}
}