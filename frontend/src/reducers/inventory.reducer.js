import { inventoryConstants } from '../constants';

export default function inventories(state = { controller: new AbortController(), }, action) {
	switch (action.type) {
		//Crear inventario
		case inventoryConstants.INVENTORY_CREATE_REQUEST:
      		return { 
				registering: true 
			};
		case inventoryConstants.INVENTORY_CREATE_SUCCESS:
			return {
				success: true
			  };
		case inventoryConstants.INVENTORY_CREATE_FAILURE:
			return {};
	  
		//DataTable
		case inventoryConstants.INVENTORY_TABLE_REQUEST:
			return {
				loading: true
			};
		case inventoryConstants.INVENTORY_TABLE_SUCCESS:
			return {
				data: action.inventories,
				loading: false
			};
		case inventoryConstants.INVENTORY_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//DataTable Balance
		case inventoryConstants.BALANCE_TABLE_REQUEST:
			return {
				loadingBalance: true
			};
		case inventoryConstants.BALANCE_TABLE_SUCCESS:
			return {
				dataBalance: action.inventories,
				loadingBalance: false
			};
		case inventoryConstants.BALANCE_TABLE_FAILURE:
			return { 
				error: action.error,
				loadingBalance: false
			};

		//obtener inventario
		case inventoryConstants.INVENTORY_GET_REQUEST:
			return {
				searching: true
			};
		case inventoryConstants.INVENTORY_GET_SUCCESS:
			return {
				inventory: action.inventory,
			};
		case inventoryConstants.INVENTORY_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de inventario
		case inventoryConstants.INVENTORY_UPDATE_REQUEST:
			return {
				updating: true
			};
		case inventoryConstants.INVENTORY_UPDATE_SUCCESS:
			return {
				success: true,
				inventoryUpdated: action.inventory,
			};
		case inventoryConstants.INVENTORY_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener sucursales select
		case inventoryConstants.INVENTORY_SELECT_REQUEST:
			return {
				getting: true
			};
		case inventoryConstants.INVENTORY_SELECT_SUCCESS:
			return {
				obtained:true,
				list: action.list,
			};
		case inventoryConstants.INVENTORY_SELECT_FAILURE:
			return {
				error: action.error
			};

		//Detalle de reporte de inventarios
		case inventoryConstants.INVENTORY_TABLE_DETAIL_REQUEST:
			return {
				loadingDetail: true,
				controller: action.controller
			};
		case inventoryConstants.INVENTORY_TABLE_DETAIL_SUCCESS:
			return {
				dataDetail: action.inventories,
				loadingDetail: false,
				successDetail: true,
			};
		case inventoryConstants.INVENTORY_TABLE_DETAIL_FAILURE:
			return { 
				error: action.error,
				loadingDetail: false
			};
	
		default:
		return state
	}
}