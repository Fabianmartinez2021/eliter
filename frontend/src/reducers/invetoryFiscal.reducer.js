import { inventoryFiscalConstants } from '../constants/inventoryFiscal.constans';

export default function inventoriesFiscal(state = { controller: new AbortController() }, action) {
	switch (action.type) {
		// Crear inventario
		case inventoryFiscalConstants.INVENTORY_FISCAL_CREATE_REQUEST:
			return { 
				registering: true 
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_CREATE_SUCCESS:
			return {
				success: true
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_CREATE_FAILURE:
			return {};

		// DataTable
		case inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_REQUEST:
			return {
				loading: true
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_SUCCESS:
			return {
				data: action.inventoriesFiscal,
				loading: false
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		// DataTable Balance
		case inventoryFiscalConstants.BALANCE_FISCAL_TABLE_REQUEST:
			return {
				loadingBalance: true
			};
		case inventoryFiscalConstants.BALANCE_FISCAL_TABLE_SUCCESS:
			return {
				dataBalance: action.inventoriesFiscal,
				loadingBalance: false
			};
		case inventoryFiscalConstants.BALANCE_FISCAL_TABLE_FAILURE:
			return { 
				error: action.error,
				loadingBalance: false
			};

		// Obtener inventario
		case inventoryFiscalConstants.INVENTORY_FISCAL_GET_REQUEST:
			return {
				searching: true
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_GET_SUCCESS:
			return {
				inventory: action.inventoryFiscal,
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_GET_FAILURE:
			return {
				error: action.error
			};

		// Actualización de inventario
		case inventoryFiscalConstants.INVENTORY_FISCAL_UPDATE_REQUEST:
			return {
				updating: true
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_UPDATE_SUCCESS:
			return {
				success: true,
				inventoryUpdated: action.inventoryFiscal,
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_UPDATE_FAILURE:
			return {
				error: action.error
			};

		// Obtener sucursales select
		case inventoryFiscalConstants.INVENTORY_FISCAL_SELECT_REQUEST:
			return {
				getting: true
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_SELECT_SUCCESS:
			return {
				obtained: true,
				list: action.list,
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_SELECT_FAILURE:
			return {
				error: action.error
			};

		// Detalle de reporte de inventarios
		case inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_DETAIL_REQUEST:
			return {
				loadingDetail: true,
				controller: action.controller
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_DETAIL_SUCCESS:
			return {
				dataDetail: action.inventoriesFiscal,
				loadingDetail: false,
				successDetail: true,
			};
		case inventoryFiscalConstants.INVENTORY_FISCAL_TABLE_DETAIL_FAILURE:
			return { 
				error: action.error,
				loadingDetail: false
			};

		default:
			return state;
	}
}
