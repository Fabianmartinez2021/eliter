import { salesFiscalConstants } from '../constants/salesFiscal.constants';

export default function salesFiscal(state = { controller: new AbortController(), }, action) {
	switch (action.type) {
		//Crear venta
		case salesFiscalConstants.SALES_FISCAL_CREATE_REQUEST:
      		return { 
				registeringFiscal: true 
			};
		case salesFiscalConstants.SALES_FISCAL_CREATE_SUCCESS:
			return {
				success: true,
				reference: action.saleFiscal,
			  };
		case salesFiscalConstants.SALES_FISCAL_CREATE_FAILURE:
			return {};

		//Registrar ventas offline
		case salesFiscalConstants.SALES_FISCAL_CREATE_OFFLINE_REQUEST:
      		return { 
				registeringOfflineFiscal: true 
			};
		case salesFiscalConstants.SALES_FISCAL_CREATE_OFFLINE_SUCCESS:
			return {
				successOfflineFiscal: true,
			  };
		case salesFiscalConstants.SALES_FISCAL_CREATE_OFFLINE_FAILURE:
			return { 
				error: action.error,
			};
	  
		//DataTable
		case salesFiscalConstants.SALES_FISCAL_TABLE_REQUEST:
			return {
				loading: true
			};
		case salesFiscalConstants.SALES_FISCAL_TABLE_SUCCESS:
			return {
				table: action.salesFiscal,
				loading: false
			};
		case salesFiscalConstants.SALES_FISCAL_TABLE_FAILURE:
			return { 
				error: action.error,
				loading: false
			};

		//Detalle de venta monedas
		case salesFiscalConstants.SALES_FISCAL_TABLE_DETAIL_REQUEST:
			return {
				loadingDetail: true,
				controller: action.controller
			};
		case salesFiscalConstants.SALES_FISCAL_TABLE_DETAIL_SUCCESS:
			return {
				dataDetail: action.salesFiscal,
				loadingDetail: false,
				successDetail: true,
			};
		case salesFiscalConstants.SALES_FISCAL_TABLE_DETAIL_FAILURE:
			return { 
				error: action.error,
				loadingDetail: false
			};

		//obtener venta
		case salesFiscalConstants.SALES_FISCAL_GET_REQUEST:
			return {
				searching: true
			};
		case salesFiscalConstants.SALES_FISCAL_GET_SUCCESS:
			return {
				saleFiscal: action.saleFiscal,
			};
		case salesFiscalConstants.SALES_FISCAL_GET_FAILURE:
			return {
				error: action.error
			};

		//Actualización de venta
		case salesFiscalConstants.SALES_FISCAL_UPDATE_REQUEST:
			return {
				updating: true
			};
		case salesFiscalConstants.SALES_FISCAL_UPDATE_SUCCESS:
			return {
				success: true,
				saleUpdated: action.saleFiscal,
			};
		case salesFiscalConstants.SALES_FISCAL_UPDATE_FAILURE:
			return {
				error: action.error
			};

		//obtener sucursales select
		case salesFiscalConstants.SALES_FISCAL_SELECT_REQUEST:
			return {
				getting: true
			};
		case salesFiscalConstants.SALES_FISCAL_SELECT_SUCCESS:
			return {
				obtained:true,
				list: action.list,
			};
		case salesFiscalConstants.SALES_FISCAL_SELECT_FAILURE:
			return {
				error: action.error
			};

		//obtener monedas, productos y terminales de sucursal 
		case salesFiscalConstants.SALES_FISCAL_DATA_REQUEST:
			return {
				getting: true
			};
		case salesFiscalConstants.SALES_FISCAL_DATA_SUCCESS:
			return {
				obtained:true,
				data: action.data,
			};
		case salesFiscalConstants.SALES_FISCAL_DATA_FAILURE:
			return {
				error: action.error
			};
	
		case salesFiscalConstants.INVOICE_TOTALS_COMPANY_REQUEST:
			return {
				...state,
				loadingTotalsByCompany: true,
			};
		case salesFiscalConstants.INVOICE_TOTALS_COMPANY_SUCCESS:
		return {
			...state,
			totalsByCompany: action.totals,
			loadingTotalsByCompany: false,
		};
		case salesFiscalConstants.INVOICE_TOTALS_COMPANY_FAILURE:
		return {
			...state,
			errorTotalsByCompany: action.error,
			loadingTotalsByCompany: false,
		};

		default:
		return state
	}
}