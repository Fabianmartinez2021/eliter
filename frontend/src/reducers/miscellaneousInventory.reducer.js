import { miscellaneousInventoryConstants } from '../constants';

export default function miscellaneousInventory(state = { }, action) {
	switch (action.type) {
		//Crear inventario
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_SUCCESS:
			return {
				success: true
			  };
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_REQUEST:
			return {
				loading: true
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_SUCCESS:
			return {
				data: action.inventories,
				loading: false
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//DataTable Balance
		case miscellaneousInventoryConstants.BALANCE_TABLE_REQUEST:
			return {
				loadingBalance: true
			};
		case miscellaneousInventoryConstants.BALANCE_TABLE_SUCCESS:
			return {
				dataBalance: action.inventories,
				loadingBalance: false
			};
		case miscellaneousInventoryConstants.BALANCE_TABLE_FAILURE:
			return { 
				error: action.error,
				loadingBalance: false
			};

		//obtener inventario
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_GET_REQUEST:
			return {
				searching: true
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_GET_SUCCESS:
			return {
				inventory: action.inventory,
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de inventario
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_REQUEST:
			return {
				updating: true
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_SUCCESS:
			return {
				success: true,
				inventoryUpdated: action.inventory,
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener sucursales select
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_SELECT_REQUEST:
			return {
				getting: true
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_SELECT_SUCCESS:
			return {
				obtained:true,
				list: action.list,
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_SELECT_FAILURE:
			return {
				error: action.error
			};

		//Detalle de reporte de inventarios
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_REQUEST:
			return {
				loadingDetail: true,
				controller: action.controller
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_SUCCESS:
			return {
				dataDetail: action.inventories,
				loadingDetail: false,
				successDetail: true,
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_TABLE_DETAIL_FAILURE:
			return { 
				error: action.error,
				loadingDetail: false
			};

		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_PENDING_REQUEST:
			return {
				loadingPending: true
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_PENDING_SUCCESS:
			return {
				pending: action.pending,
				loadingPending: false
			};
		case miscellaneousInventoryConstants.MISCELLANEOUS_INVENTORY_UPDATE_PENDING_FAILURE:
			return { 
				error: action.error,
				loadingPending: false
			};

	
		default:
		return state
	}
}