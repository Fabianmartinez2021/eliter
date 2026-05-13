import { salesConstants } from '../constants';

export default function sales(state = { controller: new AbortController(), }, action) {
	switch (action.type) {
		//Crear venta
		case salesConstants.SALES_CREATE_REQUEST:
			return {
				registering: true
			};
		case salesConstants.SALES_CREATE_SUCCESS:
			return {
				success: true,
				reference: action.sale,
			};
		case salesConstants.SALES_CREATE_FAILURE:
			return {};

		//Registrar ventas offline
		case salesConstants.SALES_CREATE_OFFLINE_REQUEST:
			return {
				registeringOffline: true
			};
		case salesConstants.SALES_CREATE_OFFLINE_SUCCESS:
			return {
				successOffline: true,
			};
		case salesConstants.SALES_CREATE_OFFLINE_FAILURE:
			return {
				error: action.error,
			};

		//DataTable
		case salesConstants.SALES_TABLE_REQUEST:
			return {
				loading: true
			};
		case salesConstants.SALES_TABLE_SUCCESS:
			return {
				table: action.sales,
				weeklyTotal: action.weeklyTotal || null,
				loading: false
			};
		case salesConstants.SALES_TABLE_FAILURE:
			return {
				error: action.error,
				loading: false
			};

		//Detalle de venta monedas
		case salesConstants.SALES_TABLE_DETAIL_REQUEST:
			return {
				...state,
				loadingDetail: true,
				controller: action.controller,
				successDetail: false
			};
		case salesConstants.SALES_TABLE_DETAIL_SUCCESS:
			return {
				...state,
				dataDetail: action.sales,
				loadingDetail: false,
				successDetail: true,
			};
		case salesConstants.SALES_TABLE_DETAIL_FAILURE:
			return {
				...state,
				error: action.error,
				loadingDetail: false
			};

		//obtener venta
		case salesConstants.SALES_GET_REQUEST:
			return {
				searching: true
			};
		case salesConstants.SALES_GET_SUCCESS:
			return {
				sale: action.sale,
			};
		case salesConstants.SALES_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de venta
		case salesConstants.SALES_UPDATE_REQUEST:
			return {
				updating: true
			};
		case salesConstants.SALES_UPDATE_SUCCESS:
			return {
				success: true,
				saleUpdated: action.sale,
			};
		case salesConstants.SALES_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener sucursales select
		case salesConstants.SALES_SELECT_REQUEST:
			return {
				getting: true
			};
		case salesConstants.SALES_SELECT_SUCCESS:
			return {
				obtained: true,
				list: action.list,
			};
		case salesConstants.SALES_SELECT_FAILURE:
			return {
				error: action.error
			};

		//obtener monedas, productos y terminales de sucursal 
		case salesConstants.SALES_DATA_REQUEST:
			return {
				getting: true
			};
		case salesConstants.SALES_DATA_SUCCESS:
			return {
				obtained: true,
				data: action.data,
			};
		case salesConstants.SALES_DATA_FAILURE:
			return {
				error: action.error
			};

		//Gráfico de ventas por tipo
		case salesConstants.SALES_CHART_REQUEST:
			return {
				loadingChart: true
			};
		case salesConstants.SALES_CHART_SUCCESS:
			return {
				chartData: action.chartData,
				loadingChart: false
			};
		case salesConstants.SALES_CHART_FAILURE:
			return {
				error: action.error,
				loadingChart: false
			};

		default:
			return state
	}
}