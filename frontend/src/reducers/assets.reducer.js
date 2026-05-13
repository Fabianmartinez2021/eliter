import { assetsConstants } from '../constants';

export default function assets(state = {}, action) {
	switch (action.type) {
		case assetsConstants.REGISTER_REQUEST:
			return {
				loading: true
			};
		case assetsConstants.REGISTER_SUCCESS:
			return {
				success: true,
				items: action.assets
			};
		case assetsConstants.REGISTER_FAILURE:
			return { 
				error: action.error
			};

		//Actualización de información
		case assetsConstants.UPDATE_DATA_REQUEST:
			return {
				updating: true
			};
		case assetsConstants.UPDATE_DATA_SUCCESS:
			return {
				success: true,
				assetsUpdated: action.assets,
			};
		case assetsConstants.UPDATE_DATA_FAILURE:
			return {
				error: action.error
			};

		//DataTable
		case assetsConstants.ASSETS_TABLE_REQUEST:
			return {
				loading: true
			};
		case assetsConstants.ASSETS_TABLE_SUCCESS:
			return {
				table: action.data,
				loading: false
			};
		case assetsConstants.ASSETS_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//obtener activo
		case assetsConstants.ASSETS_GET_REQUEST:
			return {
				searching: true
			};
		case assetsConstants.ASSETS_GET_SUCCESS:
			return {
				searched:true,
				assets: action.assets,
			};
		case assetsConstants.ASSETS_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de activo desde admin
		case assetsConstants.ASSETS_UPDATE_REQUEST:
			return {
				updating: true
			};
		case assetsConstants.ASSETS_UPDATE_SUCCESS:
			return {
				success: true,
				assetsUpdated: action.assets,
			};
		case assetsConstants.ASSETS_UPDATE_FAILURE:
			return {
				error: action.error
			};

			
		//eliminar un activo
		case assetsConstants.DELETE_REQUEST:
			return {
				deleting: true
			};
		case assetsConstants.DELETE_SUCCESS:
			return {
				deleted: true,
				deleting: false
			};
		case assetsConstants.DELETE_FAILURE:
			return {
				error: action.error,
				deleting: false
			};
			
		// restaurar un activo
		case assetsConstants.RESTORE_REQUEST:
			return {
				restoring: true
			};
		case assetsConstants.RESTORE_SUCCESS:
			return {
				restored: true,
				restoring: false
			};
		case assetsConstants.RESTORE_FAILURE:
			return {
				error: action.error,
				restoring: false
			};

		default:
		return state
	}
}