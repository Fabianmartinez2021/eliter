import { invoiceConstants } from "../constants/invoice.constants";

export default function invoice(state = { Controller: new AbortController() }, action){
    switch(action.type){
        case invoiceConstants.INVOICE_TABLE_REQUEST:
            return{
                loading: true
            }
        case invoiceConstants.INVOICE_TABLE_SUCCESS:
            return{
                table: action.invoice,
                loading:false
            }
        case invoiceConstants.INVOICE_TABLE_FAILURE:
            return{
                error:action.error,
                loading:false
            }
        case invoiceConstants.INVOICE_TOTALS_REQUEST:
            return {
                ...state,
                loadingTotals: true,
            };
        case invoiceConstants.INVOICE_TOTALS_SUCCESS:
        return {
            ...state,
            totals: action.totals,
            loadingTotals: false,
        };
        case invoiceConstants.INVOICE_TOTALS_FAILURE:
        return {
            ...state,
            errorTotals: action.error,
            loadingTotals: false,
        };
        case invoiceConstants.UPDATE_INVOICE_REQUEST:
        return {
            ...state,
            updating: true,
        };
        case invoiceConstants.UPDATE_INVOICE_SUCCESS:
        return {
            ...state,
            updatedInvoice: action.invoice,
            updating: false,
        };
        case invoiceConstants.UPDATE_INVOICE_FAILURE:
        return {
            ...state,
            updateError: action.error,
            updating: false,
        };
        case invoiceConstants.GET_INVOICE_REQUEST:
        return {
            ...state,
            loadingInvoice: true,
        };
        case invoiceConstants.GET_INVOICE_SUCCESS:
        return {
            ...state,
            invoice: action.invoice,
            loadingInvoice: false,
        };
        case invoiceConstants.GET_INVOICE_FAILURE:
        return {
            ...state,
            errorInvoice: action.error,
            loadingInvoice: false,
        };
        case invoiceConstants.ANULATE_INVOICE_REQUEST:
        return {
            ...state,
            annulling: true,
        };
        case invoiceConstants.ANULATE_INVOICE_SUCCESS:
        return {
            ...state,
            annulling: false,
            annulledInvoice: action.invoice,
        };
        case invoiceConstants.ANULATE_INVOICE_FAILURE:
        return {
            ...state,
            annulling: false,
            annulError: action.error,
        };
        case invoiceConstants.INVOICE_STATS_BY_COMPANY_BRANCH_REQUEST:
        return {
            ...state,
            loadingStats: true,
        };
        case invoiceConstants.INVOICE_STATS_BY_COMPANY_BRANCH_SUCCESS:
        return {
            ...state,
            stats: action.stats,
            loadingStats: false,
        };
        case invoiceConstants.INVOICE_STATS_BY_COMPANY_BRANCH_FAILURE:
        return {
            ...state,
            errorStats: action.error,
            loadingStats: false,
        };
        case invoiceConstants.PAYMENT_FISCAL_METHODS_STATS_BY_COMPANY_BRANCH_REQUEST:
        return {
            ...state,
            loadingPaymentStats: true,
        };
        case invoiceConstants.PAYMENT_FISCAL_METHODS_STATS_BY_COMPANY_BRANCH_SUCCESS:
        return {
            ...state,
            paymentStats: action.stats,
            loadingPaymentStats: false,
        };
        case invoiceConstants.PAYMENT_FISCAL_METHODS_STATS_BY_COMPANY_BRANCH_FAILURE:
        return {
            ...state,
            errorPaymentStats: action.error,
            loadingPaymentStats: false,
        };
        default:
            return state;
    }
}